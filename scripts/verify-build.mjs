import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const originals = readdirSync(join(root, "content", "posts")).filter((name) => name.endsWith(".html"));
const articleRoot = join(root, "dist", "posts");
const articlePages = readdirSync(articleRoot).filter((name) => statSync(join(articleRoot, name)).isDirectory());
const home = readFileSync(join(root, "dist", "index.html"), "utf8");

const failures = [];
if (originals.length !== 22) failures.push(`원고 수: ${originals.length}/22`);
if (articlePages.length !== 22) failures.push(`글 페이지 수: ${articlePages.length}/22`);
if ((home.match(/class="story-card"/g) ?? []).length !== 22) failures.push("메인 카드가 22개가 아닙니다.");
if (!home.includes("post-search")) failures.push("검색 입력창이 없습니다.");
if (!home.includes("category-button")) failures.push("카테고리 버튼이 없습니다.");

for (const original of originals) {
  const slug = original.replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/\.html$/, "");
  const file = join(articleRoot, slug, "index.html");
  if (!existsSync(file)) {
    failures.push(`${slug}: 게시 파일 없음`);
    continue;
  }
  const sourceHtml = readFileSync(join(root, "content", "posts", original), "utf8");
  const builtHtml = readFileSync(file, "utf8");
  if (builtHtml !== sourceHtml) failures.push(`${slug}: 원본 HTML과 게시 HTML이 다릅니다.`);
  if (!builtHtml.includes("핵심태그")) failures.push(`${slug}: 태그 없음`);
}

const previewRoot = join(root, "local-preview");
for (const file of [join(previewRoot, "index.html"), ...articlePages.map((slug) => join(previewRoot, "posts", slug, "index.html"))]) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|data:)/.test(value)) continue;
    const candidate = resolve(dirname(file), value);
    if (!existsSync(candidate) && !existsSync(join(candidate, "index.html"))) failures.push(`${file}: 깨진 내부 경로 ${value}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Verified: 22 unchanged original HTML posts, search, categories, tags, and local links.");
