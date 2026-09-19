# Insight Desk

기술·과학·의학 이슈를 정리하는 Astro 기반 정적 아카이브입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run check
npm run build
```

Cloudflare Pages 설정은 빌드 명령 `npm run build`, 출력 폴더 `dist`를 사용합니다.

## HN Knowledge Engine

원본 HTML 한 편에서 SNS 문안, 뉴스레터, 카드뉴스 구성안, 쇼츠 대본, 메타데이터와 검토 체크리스트를 자동 생성합니다.

개발 서버를 실행한 뒤 `/engine`에 접속하면 HTML 파일 업로드, 분석 결과 확인, 6종 결과 미리보기와 파일 내려받기를 브라우저에서 사용할 수 있습니다. 입력한 원고는 서버로 전송하지 않습니다.

```bash
npm run knowledge:one -- content/posts/YYYY-MM-DD_글이름.html
npm run knowledge:build
```

자세한 사용법은 `HN_KNOWLEDGE_ENGINE.md`를 확인하세요.
