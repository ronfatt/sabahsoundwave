import { discoverSpotifyArtists } from "../lib/spotify-discover";

function getArg(flag: string) {
  const found = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.slice(flag.length + 1) : undefined;
}

function parseCsvArg(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const target = Number(getArg("--target") || process.env.SPOTIFY_DISCOVERY_TARGET || 220);
  const playlistIds = parseCsvArg(getArg("--playlists") || process.env.SPOTIFY_PLAYLIST_IDS);
  const searchTerms = parseCsvArg(getArg("--terms") || process.env.SPOTIFY_SEARCH_TERMS);

  const result = await discoverSpotifyArtists({
    dryRun,
    target,
    playlistIds: playlistIds.length > 0 ? playlistIds : undefined,
    searchTerms: searchTerms.length > 0 ? searchTerms : undefined
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
