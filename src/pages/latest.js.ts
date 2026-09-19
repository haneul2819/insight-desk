import type { APIRoute } from "astro";
import { getPosts } from "../lib/posts";

export const prerender = true;

export const GET: APIRoute = () => {
  const latest = getPosts()
    .slice(0, 3)
    .map((post) => ({
      title: post.title,
      date: post.date,
      category: post.category,
      url: `https://insight.hnlab.kr/posts/${encodeURIComponent(post.slug)}/`,
    }));

  const payload = JSON.stringify(latest).replace(/</g, "\\u003c");

  return new Response(`window.HN_LAB_LATEST_POSTS = ${payload};\n`, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
