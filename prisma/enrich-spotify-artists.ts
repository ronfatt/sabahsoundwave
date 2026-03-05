import { enrichSpotifyArtists } from "../lib/spotify-enrich";

function getArgValue(flag: string) {
  const found = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.split("=")[1] : undefined;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const pendingOnly = hasFlag("--pending-only");
  const limitArg = getArgValue("--limit");
  const limit = limitArg ? Number(limitArg) : undefined;
  const result = await enrichSpotifyArtists({ limit, pendingOnly, dryRun });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
