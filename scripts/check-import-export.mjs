import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = process.cwd();
const sourcePath = join(root, "packages", "core", "src", "importExport.ts");
const source = readFileSync(sourcePath, "utf8").replace(/^import type .*;\s*$/m, "");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    strict: true
  }
}).outputText;

const exportsObject = {};
const sandbox = {
  exports: exportsObject,
  module: { exports: exportsObject },
  require,
  console
};

vm.runInNewContext(transpiled, sandbox, { filename: "importExport.js" });
const api = sandbox.module.exports;

const panelActions = readFileSync(join(root, "apps", "web", "lib", "panel-actions.ts"), "utf8");
const actionForms = readFileSync(join(root, "apps", "web", "components", "ActionForms.tsx"), "utf8");
const core = readFileSync(join(root, "packages", "core", "src", "index.ts"), "utf8");
const functions = readFileSync(join(root, "firebase", "functions", "src", "index.ts"), "utf8");
const docs = readFileSync(join(root, "docs", "import-export-schema.md"), "utf8");

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const csv = [
  "title.tr,title.en,description.tr,categoryId,district,address",
  "Örnek Mekan,Sample Place,Örnek açıklama,coffee,Muratpaşa,Kaleiçi"
].join("\n");

const csvRows = api.parseCsvRows(csv);
assert(csvRows.length === 1, "CSV satır sayısı 1 olmalı.");
assert(csvRows[0]?.title?.tr === "Örnek Mekan", "CSV title.tr nested objeye yazılmalı.");
assert(csvRows[0]?.description?.tr === "Örnek açıklama", "CSV description.tr nested objeye yazılmalı.");

const jsonRows = api.parseJsonRows(JSON.stringify([{ title: { tr: "JSON Mekan" }, description: { tr: "JSON açıklama" } }]));
assert(jsonRows[0]?.title?.tr === "JSON Mekan", "JSON import nested objeyi korumalı.");

const preview = api.previewRows("places", csvRows);
assert(preview[0]?.valid === true, "Geçerli CSV satırı preview içinde valid olmalı.");

const brokenPreview = api.previewRows("places", [{ title: { en: "Missing TR" }, description: { tr: "" } }]);
assert(brokenPreview[0]?.valid === false, "Eksik Türkçe alanlar invalid olmalı.");
assert(brokenPreview[0]?.messages.includes("Türkçe başlık eksik."), "Eksik başlık mesajı üretilmeli.");

const matrixRows = api.parseXlsxMatrixRows([
  ["title.tr", "description.tr", "district"],
  ["XLSX Mekan", "XLSX açıklama", "Konyaaltı"]
]);
assert(matrixRows[0]?.title?.tr === "XLSX Mekan", "XLSX matrisi title.tr nested objeye çevrilmeli.");
assert(matrixRows[0]?.description?.tr === "XLSX açıklama", "XLSX matrisi description.tr nested objeye çevrilmeli.");

const flattened = api.flattenRow({ title: { tr: "Başlık" }, district: "Muratpaşa" });
assert(flattened["title.tr"] === "Başlık", "flattenRow nested alanı noktalı yola çevirmeli.");

const exportedCsv = api.exportRowsToCsv([{ title: { tr: "Başlık" }, description: { tr: "Açıklama" } }]);
assert(exportedCsv.includes("title.tr"), "CSV export nested title.tr başlığı içermeli.");
assert(exportedCsv.includes("Açıklama"), "CSV export Türkçe açıklamayı korumalı.");

const exportedJson = api.exportRowsByFormat("json", csvRows);
assert(exportedJson.includes("Örnek Mekan"), "JSON export Türkçe karakterleri korumalı.");

try {
  api.parseRowsByFormat("xlsx", "");
  failures.push("parseRowsByFormat xlsx için açıklayıcı hata atmalı.");
} catch (error) {
  assert(String(error?.message ?? error).includes("XLSX import"), "XLSX hata mesajı anlaşılır olmalı.");
}

const requiredNeedles = [
  [panelActions, "previewXlsxImport", "Web panel XLSX preview callable köprüsü eksik."],
  [panelActions, "commitImport", "Web panel import commit köprüsü eksik."],
  [panelActions, "createExportManifest", "Web panel export manifest köprüsü eksik."],
  [actionForms, "ImportExportFormat", "Panel import/export format state tipi eksik."],
  [actionForms, "parseJsonRows", "Panel JSON preview desteği eksik."],
  [actionForms, "previewXlsxImport", "Panel XLSX preview aksiyonu eksik."],
  [actionForms, "workbookBase64", "Panel XLSX base64 alanı eksik."],
  [actionForms, "İçe aktar</button>", "Panel import kayıt aksiyonu eksik."],
  [actionForms, "Önizleme kaydı", "Panel import önizleme kimliği görünürlüğü eksik."],
  [actionForms, "Dışa aktarım geçmişi", "Panel dışa aktarım geçmişi görünürlüğü eksik."],
  [actionForms, "Canlı dışa aktarım geçmişi", "Panel canlı dışa aktarım geçmişi eksik."],
  [actionForms, "Henüz dışa aktarım kaydı yok", "Panel boş dışa aktarım durumu eksik."],
  [actionForms, "<option value=\"csv\">CSV</option>", "Panel CSV format seçimi eksik."],
  [actionForms, "<option value=\"json\">JSON</option>", "Panel JSON format seçimi eksik."],
  [actionForms, "<option value=\"xlsx\">XLSX</option>", "Panel XLSX format seçimi eksik."],
  [core, "ExportManifest", "Core export manifest sözleşmesi eksik."],
  [core, "sampleExportManifests", "Core export geçmişi örnek verisi eksik."],
  [functions, "previewXlsxImport", "Functions XLSX preview fonksiyonu eksik."],
  [functions, "XLSX.read", "Functions XLSX workbook okuma izi eksik."],
  [functions, "commitImport", "Functions import commit fonksiyonu eksik."],
  [functions, "createExportManifest", "Functions export manifest fonksiyonu eksik."],
  [docs, "Desteklenen formatlar: `csv`, `json`, `xlsx`.", "Import/export dokümanı format listesini içermeli."],
  [docs, "XLSX Akışı", "Import/export dokümanı XLSX akışını içermeli."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Import/export davranış kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Import/export davranış kontrolü başarılı. CSV, JSON, XLSX, panel, commit ve export geçmişi doğrulandı.");
