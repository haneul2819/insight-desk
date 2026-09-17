import type { APIRoute } from "astro";
import { getPosts } from "../lib/posts";

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "https://insight.hnlab.kr";
  const urls = [
    `<url><loc>${base}/</loc></url>`,
    ...getPosts().map((post) => `<url><loc>${base}/posts/${encodeURIComponent(post.slug)}</loc><lastmod>${post.date}</lastmod></url>`)
  ].join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
};
