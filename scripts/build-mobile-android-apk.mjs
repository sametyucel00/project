import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const mobileRoot = path.join(repoRoot, "apps", "mobile");
const androidRoot = path.join(mobileRoot, "android");

if (!existsSync(androidRoot)) {
  console.error("Android native project not found. Run `npm run prebuild:android` first.");
  process.exit(1);
}

if (process.platform === "win32") {
  execFileSync("cmd.exe", ["/d", "/s", "/c", "gradlew.bat assembleDebug"], {
    cwd: androidRoot,
    stdio: "inherit"
  });
} else {
  execFileSync("./gradlew", ["assembleDebug"], {
    cwd: androidRoot,
    stdio: "inherit"
  });
}
