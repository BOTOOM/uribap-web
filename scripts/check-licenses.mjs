import { execFileSync } from "node:child_process";

const output = execFileSync("pnpm", ["licenses", "list", "--json"], { encoding: "utf8" });
const licenses = JSON.parse(output);
const reviewedExceptions = new Set(["LGPL-3.0-or-later"]);
const blocked = Object.keys(licenses).filter(
  (license) => /GPL|AGPL|LGPL|SSPL|EUPL|CC-BY-NC/i.test(license) && !reviewedExceptions.has(license),
);

if (blocked.length > 0) {
  console.error(`Blocked licenses detected: ${blocked.join(", ")}`);
  process.exit(1);
}

if (reviewedExceptions.has("LGPL-3.0-or-later") && licenses["LGPL-3.0-or-later"]) {
  console.log("Reviewed exception: LGPL libvips is a transitive Next sharp dependency and is not used for Uribap media storage.");
}
console.log(`License check passed for ${Object.keys(licenses).length} license families.`);
