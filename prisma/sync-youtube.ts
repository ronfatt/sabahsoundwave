import { syncYoutubeArtists } from "../lib/youtube-sync";

function getArg(flag: string) {
  const found = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.slice(flag.length + 1) : undefined;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const days = Number(getArg("--days") || process.env.YOUTUBE_SYNC_DAYS || 30);
  const result = await syncYoutubeArtists({ dryRun, days });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
