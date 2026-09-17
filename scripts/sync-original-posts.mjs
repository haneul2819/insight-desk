import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "content", "posts");
const target = join(root, "public", "posts");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

const files = readdirSync(source).filter((name) => name.endsWith(".html"));

for (const file of files) {
  const slug = file
    .replace(/^\d{4}-\d{2}-\d{2}_/, "")
    .replace(/\.html$/, "");
  const directory = join(target, slug);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "index.html"), readFileSync(join(source, file)));
}

console.log(`Synced ${files.length} original HTML posts to public/posts.`);
