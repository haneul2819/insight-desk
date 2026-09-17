import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const root = process.cwd();
const source = join(root, "dist");
const target = join(root, "local-preview");

if (!existsSync(source)) throw new Error("dist 폴더가 없습니다. 먼저 npm run build를 실행하세요.");
if (existsSync(target)) rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

for (const file of walk(target).filter((path) => path.endsWith(".html"))) {
  const depth = relative(target, dirname(file)).split(sep).filter(Boolean).length;
  const prefix = depth ? "../".repeat(depth) : "";
  let html = readFileSync(file, "utf8");
  html = html
    .replaceAll('href="/favicon.svg"', `href="${prefix}favicon.svg"`)
    .replaceAll('href="/rss.xml"', `href="${prefix}rss.xml"`)
    .replaceAll('href="/_astro/', `href="${prefix}_astro/`)
    .replaceAll('src="/_astro/', `src="${prefix}_astro/`)
    .replaceAll('href="/"', `href="${prefix}index.html"`)
    .replace(/href="\/posts\/([^"?#]+)"/g, (_match, slug) => `href="${prefix}posts/${slug}/index.html"`);
  writeFileSync(file, html, "utf8");
}

console.log(`Local preview created: ${target}`);
