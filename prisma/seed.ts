import { District, ListingType, PrismaClient, SubmissionStatus } from "@prisma/client";
import { createUniqueSlug } from "../lib/slug";

const prisma = new PrismaClient();

const artists = [
  {
    name: "Kinabalu Echo",
    district: District.KOTA_KINABALU,
    genres: "Indie, Alternative",
    bio: "An indie quartet blending coastal folk textures with modern alternative grooves from Sabah's west coast.",
    spotifyUrl: "https://open.spotify.com/",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    coverImageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    featured: true
  },
  {
    name: "Tawau Tide",
    district: District.TAWAU,
    genres: "Pop, R&B",
    bio: "Tawau-based pop and R&B duo known for bilingual hooks and smooth vocal layers.",
    appleMusicUrl: "https://music.apple.com/",
    youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    coverImageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
    featured: false
  },
  {
    name: "Sandakan Signals",
    district: District.SANDAKAN,
    genres: "Rock, Alternative",
    bio: "A Sandakan rock band writing songs about city nights, ocean roads, and everyday Sabah stories.",
    spotifyUrl: "https://open.spotify.com/",
    youtubeUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    coverImageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    featured: true
  },
  {
    name: "Ranau Reverie",
    district: District.RANAU,
    genres: "Folk, Acoustic",
    bio: "Acoustic folk songwriter from Ranau inspired by village life, mountain air, and Dusun melodies.",
    spotifyUrl: "https://open.spotify.com/",
    youtubeUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    coverImageUrl: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80",
    featured: false
  },
  {
    name: "Semporna Sunrise",
    district: District.SEMPORNA,
    genres: "EDM, Pop",
    bio: "Electronic pop producer-vocalist from Semporna with warm synths and island-inspired percussion.",
    spotifyUrl: "https://open.spotify.com/",
    youtubeUrl: "https://www.youtube.com/watch?v=YQHsXMglC9A",
    coverImageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    featured: false
  },
  {
    name: "Keningau Rhythm Crew",
    district: District.KENINGAU,
    genres: "Hip Hop, R&B",
    bio: "A Keningau collective producing Sabah-centric hip hop with local slang, live drums, and melodic choruses.",
    spotifyUrl: "https://open.spotify.com/",
    youtubeUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    coverImageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    featured: true
  }
];

async function main() {
  await prisma.artist.deleteMany({});

  const usedSlugs = new Set<string>();
  for (const artist of artists) {
    const slug = createUniqueSlug(artist.name, usedSlugs);
    await prisma.artist.create({
      data: {
        ...artist,
        slug,
        status: SubmissionStatus.APPROVED,
        type: ListingType.NORMAL_LISTING,
        hasSongReleased: true,
        contactWhatsapp: "+60 12-000 0000",
        uploadLinks: null
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
