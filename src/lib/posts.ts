import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Post = {
  slug: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  tags: string[];
  body: string;
};

const source = join(process.cwd(), "content", "posts");

function decode(value = "") {
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function classify(name: string) {
  if (/휴머노이드|Digit/.test(name)) return "로보틱스";
  if (/인출연습/.test(name)) return "학습";
  if (/신약|수면|물섭취|뇌일부/.test(name)) return "의학";
  if (/폭염|햇빛|지구|두가지_액체/.test(name)) return "과학";
  if (/해저|케이블/.test(name)) return "IT";
  if (/AI|GPT|Claude|우버|마이크로소프트|반도체|그래픽카드|애플|클라우드/.test(name)) return "AI";
  return "IT";
}

export function getPosts(): Post[] {
  return readdirSync(source)
    .filter((name) => name.endsWith(".html"))
    .map((file) => {
      const raw = readFileSync(join(source, file), "utf8");
      const article = raw.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]
        ?? raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]
        ?? raw;
      const title = decode(article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? file.replace(/\.html$/, ""));
      const summaryHtml = article.match(/<(?:div|p)[^>]*class=["'][^"']*summary[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p)>/i)?.[1];
      const firstParagraph = article.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
      const summary = decode(summaryHtml ?? firstParagraph).replace(/^한 줄 요약\s*/i, "");
      const date = file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "2026-01-01";
      const slug = file.replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/\.html$/, "");
      const tagsBlock = article.match(/<(?:div|p)[^>]*class=["'][^"']*tags[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p)>/i)?.[1] ?? "";
      const tags = [...decode(tagsBlock).matchAll(/#[^\s#]+/g)].map((match) => match[0].slice(1));
      const body = article.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "").trim();
      return { slug, title, date, category: classify(file), summary, tags, body };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "ko"));
}
