import { Prisma } from "@prisma/client";
import { createUniqueSlug } from "../lib/slug";
import { prisma } from "../lib/prisma";

type ImportArtist = {
  name: string;
  district: Prisma.District;
  genres: string;
  sourceGroup: string;
};

const IMPORT_ARTISTS: ImportArtist[] = [
  // 1) Mainstream
  { name: "Gary Chaw", district: "KOTA_KINABALU", genres: "Pop", sourceGroup: "Mainstream" },
  { name: "Marsha Milan", district: "KOTA_KINABALU", genres: "Pop, Ballad", sourceGroup: "Mainstream" },
  { name: "Velvet Aduk", district: "KOTA_KINABALU", genres: "Pop, R&B", sourceGroup: "Mainstream" },
  { name: "Bella Astillah", district: "KOTA_KINABALU", genres: "Pop", sourceGroup: "Mainstream" },
  { name: "Stacy", district: "PENAMPANG", genres: "Pop", sourceGroup: "Mainstream" },
  { name: "Nikki Palikat", district: "PENAMPANG", genres: "Pop", sourceGroup: "Mainstream" },
  { name: "Elica Paujin", district: "PENAMPANG", genres: "Sabahan Pop, Ethnic", sourceGroup: "Mainstream" },

  // 2) Sabah Hip Hop / Urban
  { name: "MK K-Clique", district: "KOTA_KINABALU", genres: "Hip Hop, Urban", sourceGroup: "Hip Hop" },
  { name: "Noki", district: "KOTA_KINABALU", genres: "Hip Hop, Urban", sourceGroup: "Hip Hop" },
  { name: "Gnello", district: "KOTA_KINABALU", genres: "Hip Hop, Urban", sourceGroup: "Hip Hop" },
  { name: "Fareed", district: "KOTA_KINABALU", genres: "Hip Hop, Urban", sourceGroup: "Hip Hop" },
  { name: "Somean", district: "KOTA_KINABALU", genres: "Hip Hop, Urban", sourceGroup: "Hip Hop" },
  { name: "Tuju", district: "KOTA_KINABALU", genres: "Hip Hop, Urban", sourceGroup: "Hip Hop" },
  { name: "Azree", district: "KOTA_KINABALU", genres: "Hip Hop, Urban", sourceGroup: "Hip Hop" },
  { name: "K-Clique", district: "KOTA_KINABALU", genres: "Hip Hop, Urban", sourceGroup: "Hip Hop" },

  // 3) Sabah Pop / Modern
  { name: "Dabra Sia", district: "PENAMPANG", genres: "Sabahan Pop, Ballad", sourceGroup: "Sabah Pop" },
  { name: "George Lian", district: "KENINGAU", genres: "Lagu Sabahan, Folk", sourceGroup: "Sabah Pop" },
  { name: "John Moduli", district: "KENINGAU", genres: "Lagu Sabahan, Folk Rock", sourceGroup: "Sabah Pop" },
  { name: "Greg Giting", district: "RANAU", genres: "Lagu Sabahan, Acoustic", sourceGroup: "Sabah Pop" },
  { name: "Francis Landong", district: "RANAU", genres: "Lagu Sabahan, Folk", sourceGroup: "Sabah Pop" },
  { name: "Rosario Bianis", district: "PENAMPANG", genres: "Lagu Sabahan, Traditional", sourceGroup: "Sabah Pop" },
  { name: "Hosiani Keewon", district: "KENINGAU", genres: "Lagu Sabahan, Pop", sourceGroup: "Sabah Pop" },
  { name: "Jimmy Palikat", district: "PENAMPANG", genres: "Lagu Sabahan, Folk", sourceGroup: "Sabah Pop" },
  { name: "Mayabayu", district: "KOTA_KINABALU", genres: "Indie, Alternative", sourceGroup: "Sabah Pop" },
  { name: "Sharon Meet3", district: "KOTA_KINABALU", genres: "Sabahan Pop", sourceGroup: "Sabah Pop" },
  { name: "Eylia Guntabid", district: "KENINGAU", genres: "Sabahan Pop, Contemporary", sourceGroup: "Sabah Pop" },
  { name: "Beza Cabeza", district: "KOTA_KINABALU", genres: "Indie Pop, Alternative", sourceGroup: "Sabah Pop" },
  { name: "Tuni Sundatang", district: "KENINGAU", genres: "Sabahan Pop", sourceGroup: "Sabah Pop" },

  // 4) Kadazan-Dusun
  { name: "John Gaisah", district: "KENINGAU", genres: "Kadazan-Dusun, Traditional", sourceGroup: "Kadazan-Dusun" },
  { name: "Justin Stimol", district: "KENINGAU", genres: "Kadazan-Dusun, Folk", sourceGroup: "Kadazan-Dusun" },
  { name: "Ambrose Mudi", district: "RANAU", genres: "Kadazan-Dusun, Traditional", sourceGroup: "Kadazan-Dusun" },
  { name: "Rider Gutang", district: "RANAU", genres: "Kadazan-Dusun, Pop", sourceGroup: "Kadazan-Dusun" },
  { name: "Molly Alina", district: "PENAMPANG", genres: "Kadazan-Dusun, Pop", sourceGroup: "Kadazan-Dusun" },
  { name: "Olivia Ambrose", district: "PENAMPANG", genres: "Kadazan-Dusun, Contemporary", sourceGroup: "Kadazan-Dusun" },
  { name: "Jossy Alpheus", district: "PENAMPANG", genres: "Kadazan-Dusun", sourceGroup: "Kadazan-Dusun" },
  { name: "Atama", district: "KOTA_KINABALU", genres: "Kadazan-Dusun, Pop", sourceGroup: "Kadazan-Dusun" },
  { name: "Marcellus", district: "PENAMPANG", genres: "Kadazan-Dusun", sourceGroup: "Kadazan-Dusun" },
  { name: "Andrewson Ngalai", district: "KENINGAU", genres: "Kadazan-Dusun", sourceGroup: "Kadazan-Dusun" },
  { name: "Benson Anthony", district: "PENAMPANG", genres: "Kadazan-Dusun", sourceGroup: "Kadazan-Dusun" },
  { name: "Jonas Makun", district: "KENINGAU", genres: "Kadazan-Dusun", sourceGroup: "Kadazan-Dusun" },
  { name: "Oswald Bin", district: "KENINGAU", genres: "Kadazan-Dusun", sourceGroup: "Kadazan-Dusun" },
  { name: "Delvin Anthony", district: "PENAMPANG", genres: "Kadazan-Dusun", sourceGroup: "Kadazan-Dusun" },

  // 5) Sabah Bands / Groups
  { name: "Atmosfera", district: "KOTA_KINABALU", genres: "Band, Pop Rock", sourceGroup: "Bands" },
  { name: "Bamboo Woods", district: "KOTA_KINABALU", genres: "Band, Indie", sourceGroup: "Bands" },
  { name: "Stellar Band", district: "KOTA_KINABALU", genres: "Band, Pop", sourceGroup: "Bands" },

  // 7) Sabah New Generation
  { name: "Brie", district: "KOTA_KINABALU", genres: "Sabahan Pop", sourceGroup: "New Generation" },
  { name: "Andrea", district: "KOTA_KINABALU", genres: "Sabahan Pop", sourceGroup: "New Generation" },
  { name: "Sipofcola", district: "KOTA_KINABALU", genres: "Sabahan Pop", sourceGroup: "New Generation" },
  { name: "Chendana", district: "KOTA_KINABALU", genres: "Indie Pop", sourceGroup: "New Generation" },
  { name: "Ryn", district: "KOTA_KINABALU", genres: "Pop", sourceGroup: "New Generation" },
  { name: "Chubb-E", district: "KOTA_KINABALU", genres: "Hip Hop", sourceGroup: "New Generation" }
];

const SKIPPED_NON_SABAH = [
  "Zee Avi",
  "Dayang Nurfaizah",
  "Adira",
  "Bunga",
  "Yonnyboii",
  "Gisele",
  "Wendy Goh",
  "Priscilla Abby",
  "Andi Bernadee",
  "Dennis Lau",
  "Erysha Emyra",
  "Bihzhu",
  "Jerry Kamit",
  "Floor 88",
  "Estranged",
  "Hujan",
  "Pitahati",
  "Midnight Fusic",
  "Bunkface",
  "Mad August",
  "Darren Ashley",
  "Azmyl Yunor",
  "Froya",
  "Noh Salleh",
  "Reza Salleh",
  "Azlan Typewriter",
  "Hani & Zue",
  "Lunadira",
  "Talitha Tan",
  "Claudia Tan",
  "Darren Iskandar",
  "Liyana Fizi",
  "Fugo",
  "An Honest Mistake",
  "Aisha Retno",
  "Elizabeth Tan",
  "Daiyan Trisha",
  "Hael Husaini",
  "Naim Daniel",
  "SonaOne"
];

function spotifySearchUrl(name: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(name)}`;
}

function defaultBio(name: string, group: string) {
  return `${name} is listed on Sabah Soundwave from the ${group} shortlist. Profile is pending editorial verification for district, links, and latest release details.`;
}

async function main() {
  const existing = await prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      genres: true,
      bio: true,
      spotifyUrl: true,
      status: true,
      featured: true
    }
  });

  const byName = new Map(existing.map((item) => [item.name.toLowerCase(), item]));
  const slugSet = new Set(existing.map((item) => item.slug));

  let created = 0;
  let updated = 0;
  let skippedDuplicate = 0;

  for (const artist of IMPORT_ARTISTS) {
    const existingArtist = byName.get(artist.name.toLowerCase());

    if (existingArtist) {
      await prisma.artist.update({
        where: { id: existingArtist.id },
        data: {
          genres: existingArtist.genres?.trim() ? existingArtist.genres : artist.genres,
          bio: existingArtist.bio?.trim() ? existingArtist.bio : defaultBio(artist.name, artist.sourceGroup),
          spotifyUrl: existingArtist.spotifyUrl?.trim() ? existingArtist.spotifyUrl : spotifySearchUrl(artist.name)
        }
      });
      updated += 1;
      skippedDuplicate += 1;
      continue;
    }

    const slug = createUniqueSlug(artist.name, slugSet);

    await prisma.artist.create({
      data: {
        slug,
        status: "PENDING",
        type: "NORMAL_LISTING",
        hasSongReleased: true,
        contactWhatsapp: "+601100000000",
        name: artist.name,
        district: artist.district,
        genres: artist.genres,
        bio: defaultBio(artist.name, artist.sourceGroup),
        spotifyUrl: spotifySearchUrl(artist.name),
        featured: false
      }
    });

    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        created,
        updated,
        skippedDuplicate,
        skippedNonSabah: SKIPPED_NON_SABAH.length,
        skippedNonSabahList: SKIPPED_NON_SABAH
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
