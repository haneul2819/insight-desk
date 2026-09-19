import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "content", "posts");
const target = join(root, "public", "posts");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

const files = readdirSync(source).filter((name) => name.endsWith(".html"));

const magazineHeader = `
<style id="hnlab-magazine-style">
.hnlab-magazine-bar{box-sizing:border-box;width:100%;padding:13px 22px;border-bottom:1px solid #dfe3e6;background:#fff;color:#101820;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;line-height:1.2}
.hnlab-magazine-bar a{display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:0 auto;color:inherit;text-decoration:none}
.hnlab-magazine-bar b{font-size:15px;letter-spacing:.12em}
.hnlab-magazine-bar span{font-size:14px;font-weight:700;color:#5f6870}
@media(max-width:620px){.hnlab-magazine-bar{padding:11px 16px}.hnlab-magazine-bar b{font-size:13px}.hnlab-magazine-bar span{font-size:13px}}
</style>
<header class="hnlab-magazine-bar"><a href="/" aria-label="HN LAB 매거진 홈"><b>HN LAB</b><span>매거진</span></a></header>`;

function applyMagazineBrand(html) {
  const brandedTitle = html.replace(/<title>([\s\S]*?)<\/title>/i, "<title>$1 | HN LAB 매거진</title>");
  return brandedTitle.replace(/(<body[^>]*>)/i, `$1${magazineHeader}`);
}

for (const file of files) {
  const slug = file
    .replace(/^\d{4}-\d{2}-\d{2}_/, "")
    .replace(/\.html$/, "");
  const directory = join(target, slug);
  mkdirSync(directory, { recursive: true });
  const original = readFileSync(join(source, file), "utf8");
  writeFileSync(join(directory, "index.html"), applyMagazineBrand(original));
}

console.log(`Synced ${files.length} original HTML posts to public/posts.`);
