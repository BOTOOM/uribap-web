import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const sourceRevision = "02d07e951b0b6ff8d5fa5e74b65209a8e9efddfe";
const scriptPath = fileURLToPath(new URL("./apply-overlay.mjs", import.meta.url));
const overlayPath = fileURLToPath(new URL("./overlay", import.meta.url));
const layoutPath = "apps/login/src/app/(login)/layout.tsx";
const logoPath = "apps/login/src/components/logo.tsx";
const cardPath = "apps/login/src/components/card.tsx";
const loginPath = "apps/login/src/app/(login)/loginname/page.tsx";
const originalLayout = [
  'import { BackgroundWrapper } from "@/components/background-wrapper";',
  "export default async function RootLayout() { getAllowedLanguages(); return <html/>; }",
  "",
].join("\n");
const originalLogo = [
  "type Props = { darkSrc?: string; lightSrc?: string; height?: number; width?: number };",
  'export function Logo({ lightSrc, darkSrc, height, width }: Props) { return <img src={lightSrc || darkSrc} height={height} width={width} alt="logo"/>; }',
  "",
].join("\n");

function createSource(
  cardSource = `className={clsx(
          actualBackground,
          actualCardStyling,
        )}`,
) {
  const root = mkdtempSync(join(tmpdir(), "uribap-login-overlay-"));
  mkdirSync(join(root, "apps/login/src/styles"), { recursive: true });
  const files = new Map([
    ["package.json", JSON.stringify({ name: "@zitadel/zitadel" })],
    [".git/HEAD", `${sourceRevision}\n`],
    [layoutPath, originalLayout],
    [logoPath, originalLogo],
    [cardPath, cardSource],
    [loginPath, 'export const passwordAndMfaFlow = "untouched";\n'],
  ]);
  for (const [relativePath, content] of files) {
    const absolutePath = join(root, relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
  }
  return root;
}

function applyOverlay(root) {
  return spawnSync(process.execPath, [scriptPath, root, overlayPath], { encoding: "utf8" });
}

test("overlay replaces only guarded presentation seams and retains authentication flows", () => {
  const root = createSource();
  const result = applyOverlay(root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(join(root, layoutPath), "utf8"),
    readFileSync(join(overlayPath, "apps/login/src/app/(login)/layout.tsx"), "utf8"),
  );
  assert.equal(
    readFileSync(join(root, logoPath), "utf8"),
    readFileSync(join(overlayPath, "apps/login/src/components/logo.tsx"), "utf8"),
  );
  const card = readFileSync(join(root, cardPath), "utf8");
  assert.equal(card.indexOf('"uribap-card"') < card.indexOf("actualBackground"), true);
  assert.equal(
    readFileSync(join(root, loginPath), "utf8"),
    'export const passwordAndMfaFlow = "untouched";\n',
  );
});

test("overlay fails before replacing files when the upstream Card seam drifts", () => {
  const root = createSource(`className={clsx(
          changedUpstreamSeam,
        )}`);
  const result = applyOverlay(root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Card patch seam/);
  assert.equal(readFileSync(join(root, layoutPath), "utf8"), originalLayout);
  assert.equal(readFileSync(join(root, logoPath), "utf8"), originalLogo);
});
