import assert from "node:assert/strict";
import { _test } from "../functions/api/publish.js";

assert.equal(_test.cleanFilename("2026-09-20_테스트.html"), "2026-09-20_테스트.html");
assert.match(_test.cleanFilename("테스트.htm"), /^\d{4}-\d{2}-\d{2}_테스트\.html$/);
assert.throws(() => _test.cleanFilename("../bad.txt"), /\.html/);

const safeHtml = "<!doctype html><html lang=\"ko\"><body><h1>안전한 글</h1><p>본문입니다.</p></body></html>";
assert.doesNotThrow(() => _test.validateHtml(safeHtml));
assert.throws(() => _test.validateHtml("<html><body><p>제목 없음</p></body></html>"), /h1/);
assert.throws(() => _test.validateHtml("<html><body><h1>제목</h1><script>alert(1)</script></body></html>"), /보안/);
assert.throws(() => _test.validateHtml("<html><body><h1 onclick=\"alert(1)\">제목</h1></body></html>"), /보안/);

const decoded = Buffer.from(_test.toBase64("한글 원고 ✓"), "base64").toString("utf8");
assert.equal(decoded, "한글 원고 ✓");

console.log("Publish API helpers verified: filename, HTML validation, and UTF-8 encoding.");
