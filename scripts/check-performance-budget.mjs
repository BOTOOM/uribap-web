import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const chunksDirectory = ".next/static/chunks";
const budgetBytes = 2_000_000;

async function collectBytes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    const path = join(directory, entry.name);
    total += entry.isDirectory() ? await collectBytes(path) : (await stat(path)).size;
  }
  return total;
}

const bytes = await collectBytes(chunksDirectory);
console.log(`Client chunk budget: ${bytes} bytes / ${budgetBytes} bytes`);
if (bytes > budgetBytes) {
  console.error("Client chunk budget exceeded.");
  process.exit(1);
}
