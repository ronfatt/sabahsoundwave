import { District, SubmissionStatus } from "@prisma/client";
import { createUniqueSlug } from "../lib/slug";
import { prisma } from "../lib/prisma";

type ImportArtist = {
  name: string;
  district: District;
  genres: string;
  featured?: boolean;
};

const IMPORT_ARTISTS: ImportArtist[] = [
  { name: "Marsha Milan Londoh", district: "KOTA_KINABALU", genres: "Pop, Ballad", featured: true },
  { name: "Velvet Aduk", district: "KOTA_KINABALU", genres: "Pop, R&B", featured: true },
  { name: "Bella Astillah", district: "KOTA_KINABALU", genres: "Pop", featured: true },
  { name: "Elica Paujin", district: "PENAMPANG", genres: "Sabahan Pop, Ethnic", featured: true },
  { name: "Dabra Sia", district: "PENAMPANG", genres: "Sabahan Pop, Ballad", featured: true },
  { name: "Eylia Guntabid", district: "KENINGAU", genres: "Sabahan Pop, Contemporary", featured: true },
  { name: "Beza Cabeza", district: "KOTA_KINABALU", genres: "Indie Pop, Alternative" },
  { name: "Mayabayu", district: "KOTA_KINABALU", genres: "Indie, Alternative" },
  { name: "George Lian", district: "KENINGAU", genres: "Lagu Sabahan, Folk" },
  { name: "John Moduli", district: "KENINGAU", genres: "Lagu Sabahan, Folk Rock" },
  { name: "Greg Giting", district: "RANAU", genres: "Lagu Sabahan, Acoustic" },
  { name: "Rosario Bianis", district: "PENAMPANG", genres: "Lagu Sabahan, Traditional" },
  { name: "Francis Landong", district: "RANAU", genres: "Lagu Sabahan, Folk" },
  { name: "Tumatik", district: "KOTA_KINABALU", genres: "Sabahan Rock, Pop" },
  { name: "Ronney Bikin Panas", district: "PAPAR", genres: "Lagu Sabahan, Pop" },
  { name: "Sharon Meet3", district: "KOTA_KINABALU", genres: "Sabahan Pop" },
  { name: "Atmosfera", district: "KOTA_KINABALU", genres: "Band, Pop Rock" },
  { name: "Bamboo Woods", district: "KOTA_KINABALU", genres: "Band, Indie" },
  { name: "SABAH MUSIC collective", district: "KOTA_KINABALU", genres: "Collective, Sabahan Collaboration" },
  { name: "Sabah Bangkit", district: "KOTA_KINABALU", genres: "Sabahan Collaboration, Project" },
  { name: "Sipofcola", district: "KOTA_KINABALU", genres: "Sabahan Pop" },
  { name: "Brie", district: "KOTA_KINABALU", genres: "Sabahan Pop" },
  { name: "Andrea", district: "KOTA_KINABALU", genres: "Sabahan Pop" }
];

const SKIPPED_NON_SABAH = ["Zee Avi"];

function spotifySearchUrl(name: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(name)}`;
}

function defaultBio(name: string) {
  return `${name} is listed on Sabah Soundwave as part of the Sabah music ecosystem. This profile was imported from a curation shortlist and can be refined with updated official links, bio details, and latest releases.`;
}

async function main() {
  const existing = await prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      featured: true,
      status: true,
      genres: true,
      bio: true,
      spotifyUrl: true
    }
  });

  const byName = new Map(existing.map((item) => [item.name.toLowerCase(), item]));
  const slugSet = new Set(existing.map((item) => item.slug));

  let created = 0;
  let updated = 0;

  for (const artist of IMPORT_ARTISTS) {
    const existingArtist = byName.get(artist.name.toLowerCase());

    if (existingArtist) {
      await prisma.artist.update({
        where: { id: existingArtist.id },
        data: {
          status: "APPROVED" satisfies SubmissionStatus,
          featured: existingArtist.featured || Boolean(artist.featured),
          genres: existingArtist.genres?.trim() ? existingArtist.genres : artist.genres,
          bio: existingArtist.bio?.trim() ? existingArtist.bio : defaultBio(artist.name),
          spotifyUrl: existingArtist.spotifyUrl?.trim() ? existingArtist.spotifyUrl : spotifySearchUrl(artist.name)
        }
      });
      updated += 1;
      continue;
    }

    const slug = createUniqueSlug(artist.name, slugSet);
    await prisma.artist.create({
      data: {
        slug,
        status: "APPROVED",
        type: "NORMAL_LISTING",
        hasSongReleased: true,
        contactWhatsapp: "+601100000000",
        name: artist.name,
        district: artist.district,
        genres: artist.genres,
        bio: defaultBio(artist.name),
        spotifyUrl: spotifySearchUrl(artist.name),
        featured: Boolean(artist.featured)
      }
    });
    created += 1;
  }

  console.log(JSON.stringify({ created, updated, skipped: SKIPPED_NON_SABAH }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
