import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const blockedDirs = new Set(["node_modules", ".git", ".next", ".expo", "dist", "build", "coverage"]);
const textExtensions = new Set([
  ".css",
  ".csv",
  ".env",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".rules",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml"
]);
const brokenChars = [0x00c3, 0x00c5, 0x00c4, 0x00d0, 0x00de, 0xfffd].map((code) => String.fromCharCode(code));
const requiredChars = ["ç", "Ç", "ğ", "Ğ", "ı", "İ", "ö", "Ö", "ş", "Ş", "ü", "Ü"];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (blockedDirs.has(entry.name)) return [];
      return walk(join(dir, entry.name));
    }
    return [join(dir, entry.name)];
  });
}

const files = walk(root).filter((file) => {
  const lower = file.toLowerCase();
  return [...textExtensions].some((extension) => lower.endsWith(extension));
});

const failures = [];
let protectedCharCount = 0;

for (const file of files) {
  const buffer = readFileSync(file);
  const text = buffer.toString("utf8");
  const rel = relative(root, file);

  if (text.charCodeAt(0) === 0xfeff) {
    failures.push(`${rel}: BOM içeriyor, UTF-8 BOM'suz olmalı.`);
  }

  if (brokenChars.some((char) => text.includes(char))) {
    failures.push(`${rel}: Türkçe karakter bozulması bulundu.`);
  }

  for (const char of requiredChars) {
    if (text.includes(char)) protectedCharCount += 1;
  }

  if (statSync(file).size > 0 && text.includes("\u0000")) {
    failures.push(`${rel}: metin dosyasında null byte bulundu.`);
  }
}

if (failures.length > 0) {
  console.error("Türkçe karakter / UTF-8 kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Türkçe karakter / UTF-8 kontrolü başarılı. Taranan dosya: ${files.length}, korunan karakter izleri: ${protectedCharCount}`);
