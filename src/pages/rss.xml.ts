import type { APIRoute } from "astro";
import { getPosts } from "../lib/posts";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
}

export const GET: APIRoute = ({ site }) => {
  const posts = getPosts();
  const base = site?.toString().replace(/\/$/, "") ?? "https://insight.hnlab.kr";
  const items = posts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${base}/posts/${encodeURIComponent(post.slug)}</link>
      <guid>${base}/posts/${encodeURIComponent(post.slug)}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00+09:00`).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary)}</description>
    </item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>Insight Desk</title><link>${base}</link><description>기술·과학·의학 이슈를 근거와 맥락으로 정리합니다.</description>${items}</channel></rss>`, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
};
