import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";

const root = process.cwd();
const postsRoot = join(root, "content", "posts");
const outputRoot = join(root, "knowledge-output");
const apiRoot = join(root, "public", "api");
const config = JSON.parse(readFileSync(join(root, "knowledge.config.json"), "utf8"));

function decode(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>|<\/li>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function firstSentence(value = "", limit = 190) {
  const clean = value.replace(/\s+/g, " ").trim();
  const sentence = clean.match(/^.{20,}?(?:다\.|요\.|니다\.|습니다\.|[.!?](?:\s|$))/)?.[0] ?? clean;
  return sentence.length <= limit ? sentence : `${sentence.slice(0, limit - 1).trim()}…`;
}

function classify(value) {
  if (/AI|GPT|Claude|Anthropic|OpenAI|인공지능/.test(value)) return "AI";
  if (/의학|건강|백신|수면|신약|질환|환자/.test(value)) return "의학";
  if (/과학|기후|폭염|햇빛|지구|연구/.test(value)) return "과학";
  if (/로봇|휴머노이드|Digit/.test(value)) return "로보틱스";
  if (/반도체|메모리|보안|통신|인터넷|Apple|애플|Microsoft|마이크로소프트/.test(value)) return "IT";
  return config.defaultCategory;
}

function extractSections(article) {
  const headings = [...article.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  return headings.map((match, index) => {
    const start = match.index + match[0].length;
    const end = headings[index + 1]?.index ?? article.length;
    const title = decode(match[1]);
    const html = article.slice(start, end);
    return { title, text: decode(html), html };
  }).filter((section) => section.title && section.text);
}

function parsePost(filePath) {
  const file = basename(filePath);
  const raw = readFileSync(filePath, "utf8");
  const article = raw.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]
    ?? raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]
    ?? raw;
  const title = decode(article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?? raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?? file.replace(/\.html$/i, ""));
  const date = file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? new Date().toISOString().slice(0, 10);
  const slug = file.replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/\.html$/i, "");
  const summaryHtml = article.match(/<(?:div|p)[^>]*class=["'][^"']*(?:summary|lead|key)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p)>/i)?.[1];
  const paragraphs = [...article.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => decode(match[1]))
    .filter((text) => text.length > 35 && !/^#/.test(text));
  const summary = firstSentence(decode(summaryHtml ?? paragraphs[0] ?? title), 240)
    .replace(/^(?:한 줄 요약|한 줄 정리)\s*/i, "");
  const tagBlock = article.match(/<(?:div|p)[^>]*class=["'][^"']*tags[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p)>/i)?.[1] ?? "";
  const tags = [...decode(tagBlock).matchAll(/#([^\s#]+)/g)]
    .map((match) => match[1].replace(/[.,;:]+$/, ""))
    .filter((tag, index, all) => tag && all.indexOf(tag) === index)
    .slice(0, config.maxTags);
  const sections = extractSections(article);
  const sourceSection = sections.find((section) => /출처|참고/.test(section.title));
  const factCheckSection = sections.find((section) => /팩트체크|주의|확인/.test(section.title));
  const factCheckBlock = article.match(/<(?:div|section)[^>]*class=["'][^"']*(?:check|fact-check|factcheck)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i)?.[1];
  const sourceLinks = [...(sourceSection?.html ?? article).matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ title: decode(match[2]), url: match[1] }))
    .filter((source) => /^https?:\/\//.test(source.url));
  const sourceText = sourceSection?.text
    ? sourceSection.text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
    : [];
  const wordCount = decode(article).split(/\s+/).filter(Boolean).length;
  const category = classify(`${file} ${title} ${tags.join(" ")}`);
  const url = `${config.siteUrl}/posts/${encodeURIComponent(slug)}/`;
  const publishedAt = `${date}T09:00:00+09:00`;
  const reviewDue = new Date(`${date}T00:00:00Z`);
  reviewDue.setUTCDate(reviewDue.getUTCDate() + config.reviewCycleDays);

  return {
    schemaVersion: "1.0",
    slug,
    title,
    date,
    publishedAt,
    reviewDue: reviewDue.toISOString().slice(0, 10),
    category,
    summary,
    tags,
    url,
    publisher: config.publisher,
    brand: config.brand,
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 350)),
    sections,
    sources: sourceLinks.length ? sourceLinks : sourceText.map((title) => ({ title, url: "" })),
    factCheck: factCheckSection?.text ?? decode(factCheckBlock ?? ""),
    sourceFile: `content/posts/${file}`,
  };
}

function cardNews(post) {
  const selected = post.sections
    .filter((section) => !/출처|핵심용어|태그/.test(section.title))
    .slice(0, 7);
  const cards = [
    `# 카드 1 · 표지\n\n${post.title}`,
    `# 카드 2 · 한 줄 요약\n\n${post.summary}`,
    ...selected.map((section, index) => `# 카드 ${index + 3} · ${section.title}\n\n${firstSentence(section.text, 150)}`),
  ].slice(0, 9);
  cards.push(`# 카드 ${cards.length + 1} · 더 읽기\n\n${config.brand}\n${post.url}`);
  return `${cards.join("\n\n---\n\n")}\n`;
}

function shorts(post) {
  const points = post.sections
    .filter((section) => !/출처|핵심용어|태그/.test(section.title))
    .slice(0, 3)
    .map((section) => firstSentence(section.text, 110));
  return `# 40초 쇼츠 대본\n\n[0~4초 · 훅]\n${post.title}\n\n[5~12초 · 핵심]\n${post.summary}\n\n[13~30초 · 설명]\n${points.join("\n")}\n\n[31~36초 · 의미]\n이 변화가 우리 생활과 산업에 어떤 영향을 주는지 함께 지켜봐야 합니다.\n\n[37~40초 · 마무리]\n전체 내용은 HN LAB 매거진에서 확인하세요.\n${post.url}\n`;
}

function social(post) {
  const hashtags = post.tags.map((tag) => `#${tag}`).join(" ");
  return `[공통 게시문]\n${post.title}\n\n${post.summary}\n\n${post.url}\n\n${hashtags}\n\n[짧은 게시문]\n${post.title}\n${post.summary}\n${post.url}\n\n[카카오톡 공유문]\n${post.title}\n${post.summary}\n자세히 보기: ${post.url}\n`;
}

function newsletter(post) {
  const highlights = post.sections
    .filter((section) => !/출처|태그/.test(section.title))
    .slice(0, 4)
    .map((section) => `<li style="margin:0 0 10px"><strong>${escapeHtml(section.title)}</strong><br>${escapeHtml(firstSentence(section.text, 180))}</li>`)
    .join("");
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(post.title)}</title></head>
<body style="margin:0;background:#f4f1e8;color:#101820;font-family:Arial,'Noto Sans KR',sans-serif">
<main style="max-width:680px;margin:0 auto;padding:40px 24px;background:#fff">
<p style="font-size:13px;letter-spacing:.12em;color:#b7442d;font-weight:700">${escapeHtml(config.brand)}</p>
<h1 style="font-size:32px;line-height:1.35">${escapeHtml(post.title)}</h1>
<p style="font-size:18px;line-height:1.8">${escapeHtml(post.summary)}</p>
<ul style="padding-left:22px;font-size:16px;line-height:1.7">${highlights}</ul>
<p><a href="${post.url}" style="display:inline-block;padding:13px 18px;background:#101820;color:#fff;text-decoration:none;font-weight:700">전체 글 읽기</a></p>
<hr style="margin:36px 0;border:0;border-top:1px solid #ddd">
<p style="font-size:12px;color:#697178">발행: ${escapeHtml(config.publisher)} · ${post.date}</p>
</main></body></html>\n`;
}

function review(post) {
  const checks = [
    [Boolean(post.title), "제목 확인"],
    [post.summary.length >= 40, "한 줄 요약 40자 이상"],
    [post.tags.length > 0 && post.tags.length <= config.maxTags, `태그 1~${config.maxTags}개`],
    [post.sections.length >= 3, "본문 소제목 3개 이상"],
    [post.sources.length > 0, "출처 섹션 확인"],
    [Boolean(post.factCheck), "팩트체크 또는 주의사항 확인"],
  ];
  return `# 검토 체크리스트\n\n- 글: ${post.title}\n- 게시일: ${post.date}\n- 다음 정기 검토일: ${post.reviewDue}\n- 예상 읽기 시간: ${post.readingMinutes}분\n\n${checks.map(([ok, label]) => `- [${ok ? "x" : " "}] ${label}`).join("\n")}\n\n## 출처\n\n${post.sources.length ? post.sources.map((source) => `- ${source.title}${source.url ? ` — ${source.url}` : ""}`).join("\n") : "- [ ] 원문 출처를 추가하세요."}\n\n## 변경 이력\n\n- ${post.date}: 최초 등록\n`;
}

function writePostPackage(post) {
  const directory = join(outputRoot, post.slug);
  mkdirSync(directory, { recursive: true });
  const publicPost = { ...post };
  delete publicPost.sections;
  writeFileSync(join(directory, "metadata.json"), `${JSON.stringify(publicPost, null, 2)}\n`);
  writeFileSync(join(directory, "social.txt"), social(post));
  writeFileSync(join(directory, "newsletter.html"), newsletter(post));
  writeFileSync(join(directory, "card-news.md"), cardNews(post));
  writeFileSync(join(directory, "shorts-script.md"), shorts(post));
  writeFileSync(join(directory, "review-checklist.md"), review(post));
  return publicPost;
}

function getInputFiles() {
  if (process.argv.includes("--all")) {
    return readdirSync(postsRoot)
      .filter((name) => name.endsWith(".html"))
      .map((name) => join(postsRoot, name));
  }
  const argument = process.argv.slice(2).find((value) => !value.startsWith("--"));
  if (!argument) throw new Error("사용법: npm run knowledge:one -- content/posts/파일.html");
  const candidate = resolve(root, argument);
  if (!existsSync(candidate) || !candidate.endsWith(".html")) throw new Error(`HTML 파일을 찾을 수 없습니다: ${argument}`);
  return [candidate];
}

const files = getInputFiles();
if (process.argv.includes("--all")) rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });
mkdirSync(apiRoot, { recursive: true });

const generated = files.map((file) => writePostPackage(parsePost(file)));
const metadataFiles = readdirSync(outputRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(outputRoot, entry.name, "metadata.json")))
  .map((entry) => JSON.parse(readFileSync(join(outputRoot, entry.name, "metadata.json"), "utf8")))
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "ko"));

writeFileSync(join(apiRoot, "knowledge-index.json"), `${JSON.stringify({
  schemaVersion: "1.0",
  generatedAt: new Date().toISOString(),
  count: metadataFiles.length,
  posts: metadataFiles,
}, null, 2)}\n`);

console.log(`HN Knowledge Engine: ${generated.length}개 원고 처리, 전체 색인 ${metadataFiles.length}개.`);
