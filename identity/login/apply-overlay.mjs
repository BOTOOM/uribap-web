import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const expectedRevision = "02d07e951b0b6ff8d5fa5e74b65209a8e9efddfe";
const sourceRoot = resolve(process.argv[2] ?? "");
const overlayRoot = resolve(process.argv[3] ?? "");
const sourcePackage = resolve(sourceRoot, "package.json");
const headPath = resolve(sourceRoot, ".git/HEAD");
const layoutPath = resolve(sourceRoot, "apps/login/src/app/(login)/layout.tsx");
const logoPath = resolve(sourceRoot, "apps/login/src/components/logo.tsx");
const cardPath = resolve(sourceRoot, "apps/login/src/components/card.tsx");
const loginFlowPath = resolve(sourceRoot, "apps/login/src/app/(login)/loginname/page.tsx");
const cardSeam = "className={clsx(\n          actualBackground,";
const overlayFiles = [
  { path: "apps/login/src/app/(login)/layout.tsx", mode: "replace" },
  { path: "apps/login/src/components/logo.tsx", mode: "replace" },
  { path: "apps/login/src/components/uribap-brand.tsx", mode: "add" },
  { path: "apps/login/src/styles/uribap-login.css", mode: "add" },
];

function fail(message) {
  throw new Error(message);
}

if (!existsSync(sourcePackage) || !existsSync(headPath)) {
  fail("Expected a complete upstream Git checkout and package manifest.");
}
const packageJson = JSON.parse(readFileSync(sourcePackage, "utf8"));
if (packageJson.name !== "@zitadel/zitadel") {
  fail("Unexpected upstream workspace package name.");
}
if (readFileSync(headPath, "utf8").trim() !== expectedRevision) {
  fail("Unexpected upstream source revision.");
}

const layout = readFileSync(layoutPath, "utf8");
if (
  !layout.includes('import { BackgroundWrapper } from "@/components/background-wrapper";') ||
  !layout.includes("export default async function RootLayout") ||
  !layout.includes("getAllowedLanguages")
) {
  fail("Unexpected upstream login layout seam.");
}
const logo = readFileSync(logoPath, "utf8");
if (
  !logo.includes("type Props = {") ||
  !logo.includes("export function Logo(") ||
  !logo.includes("darkSrc") ||
  !logo.includes("lightSrc")
) {
  fail("Unexpected upstream logo seam.");
}
if (!existsSync(loginFlowPath)) {
  fail("Missing upstream login flow.");
}
let card = readFileSync(cardPath, "utf8");
if (card.split(cardSeam).length !== 2) {
  fail("Card patch seam must occur exactly once.");
}

for (const file of overlayFiles) {
  const source = resolve(overlayRoot, file.path);
  const destination = resolve(sourceRoot, file.path);
  if (!existsSync(source)) fail(`Missing overlay file: ${file.path}`);
  if (!existsSync(dirname(destination))) fail(`Missing upstream destination directory: ${file.path}`);
  if (file.mode === "replace" && !existsSync(destination)) {
    fail(`Missing upstream replacement target: ${file.path}`);
  }
  if (file.mode === "add" && existsSync(destination)) {
    fail(`Unexpected upstream file at new overlay path: ${file.path}`);
  }
}

card = card.replace(cardSeam, 'className={clsx(\n          "uribap-card",\n          actualBackground,');
writeFileSync(cardPath, card);
for (const file of overlayFiles) {
  copyFileSync(
    resolve(overlayRoot, file.path),
    resolve(sourceRoot, file.path),
  );
}
