const DEFAULT_REPOSITORY = "haneul2819/insight-desk";
const DEFAULT_BRANCH = "main";
const DEFAULT_ORIGIN = "https://insight.hnlab.kr";
const MAX_HTML_BYTES = 700_000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function sameSecret(received, expected) {
  const [left, right] = await Promise.all([digest(received), digest(expected)]);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function koreanDate() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

function cleanFilename(value = "") {
  const base = value.split(/[\\/]/).pop().trim()
    .replace(/[\u0000-\u001f<>:"|?*]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 150);
  if (!base || !/\.html?$/i.test(base)) throw new Error("파일 이름은 .html로 끝나야 합니다.");
  const normalized = base.replace(/\.htm$/i, ".html");
  return /^\d{4}-\d{2}-\d{2}_/.test(normalized) ? normalized : `${koreanDate()}_${normalized}`;
}

function validateHtml(html) {
  if (typeof html !== "string" || !html.trim()) throw new Error("HTML 원고가 비어 있습니다.");
  if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) throw new Error("HTML 원고는 700KB 이하만 게시할 수 있습니다.");
  if (!/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) throw new Error("완전한 HTML 문서(html, body 포함)를 입력해 주세요.");
  if (!/<h1[\s>][\s\S]*?<\/h1>/i.test(html)) throw new Error("게시글 제목인 h1 요소가 필요합니다.");
  if (/<(?:script|iframe|object|embed|form)[\s>]/i.test(html) || /\son[a-z]+\s*=/i.test(html) || /javascript\s*:/i.test(html)) {
    throw new Error("보안을 위해 스크립트·프레임·폼 또는 이벤트 코드가 포함된 HTML은 게시할 수 없습니다.");
  }
}

function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function githubHeaders(token) {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "HN-LAB-Knowledge-Engine",
  };
}

function contentUrl(repository, path) {
  return `https://api.github.com/repos/${repository}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = env.SITE_ORIGIN || DEFAULT_ORIGIN;
  if (origin && origin !== allowedOrigin) return json({ ok: false, error: "허용되지 않은 요청 출처입니다." }, 403);
  if (!env.PUBLISH_KEY || !env.GITHUB_TOKEN) return json({ ok: false, error: "게시 기능 설정이 아직 완료되지 않았습니다. Cloudflare 비밀키를 등록해 주세요." }, 503);

  const authorization = request.headers.get("Authorization") || "";
  const receivedKey = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!receivedKey || !(await sameSecret(receivedKey, env.PUBLISH_KEY))) return json({ ok: false, error: "관리자 게시 키가 올바르지 않습니다." }, 401);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "게시 요청 형식이 올바르지 않습니다." }, 400);
  }

  let filename;
  try {
    filename = cleanFilename(payload.filename);
    validateHtml(payload.html);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "원고를 확인해 주세요." }, 400);
  }

  const repository = env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = `content/posts/${filename}`;
  const url = contentUrl(repository, path);
  const headers = githubHeaders(env.GITHUB_TOKEN);
  const existingResponse = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
  let existingSha;
  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    existingSha = existing.sha;
    if (!payload.overwrite) return json({ ok: false, error: "같은 이름의 글이 이미 있습니다. 수정하려면 덮어쓰기를 선택해 주세요." }, 409);
  } else if (existingResponse.status !== 404) {
    return json({ ok: false, error: "GitHub 저장소의 기존 파일을 확인하지 못했습니다." }, 502);
  }

  const commitMessage = `${existingSha ? "Update" : "Publish"} magazine post: ${payload.title || filename}`.slice(0, 180);
  const githubResponse = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: commitMessage,
      content: toBase64(payload.html),
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });
  const githubResult = await githubResponse.json().catch(() => ({}));
  if (!githubResponse.ok) {
    const detail = githubResponse.status === 403 ? "GitHub 토큰의 저장소 Contents 쓰기 권한을 확인해 주세요." : "GitHub에 원고를 저장하지 못했습니다.";
    return json({ ok: false, error: detail }, 502);
  }

  const slug = filename.replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/\.html$/i, "");
  return json({
    ok: true,
    filename,
    path,
    commitSha: githubResult.commit?.sha,
    commitUrl: githubResult.commit?.html_url,
    postUrl: `${allowedOrigin}/posts/${encodeURIComponent(slug)}/`,
  });
}

export const _test = { cleanFilename, validateHtml, toBase64 };
