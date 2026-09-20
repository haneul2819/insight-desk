# HN Knowledge Engine 1.2

HN LAB 매거진의 원본 HTML 한 개를 여러 배포 형식으로 자동 변환합니다. 원본 HTML의 모양과 내용은 변경하지 않습니다.

## 현재 자동 생성되는 결과물

- 검색·연동용 메타데이터 `metadata.json`
- 홈페이지 및 외부 서비스용 전체 색인 `public/api/knowledge-index.json`
- SNS·카카오톡 공유문 `social.txt`
- 이메일 뉴스레터 `newsletter.html`
- 카드뉴스 10장 이내 구성안 `card-news.md`
- 40초 쇼츠 대본 `shorts-script.md`
- 출처·팩트체크·재검토일 체크리스트 `review-checklist.md`

생성 파일은 `knowledge-output/글주소/`에 저장됩니다.

## 새 글 한 편 처리하기

### 브라우저 관리 화면

```bash
npm run dev
```

브라우저에서 `http://localhost:4321/engine`을 열고 HTML 파일을 놓거나 원고를 직접 붙여 넣습니다.

- 제목·요약·태그·출처·팩트체크 상태 확인
- 6종 결과 탭별 미리보기
- 현재 결과 복사 및 개별 파일 내려받기
- 6개 결과 파일 일괄 내려받기
- 게시 전 제목·저장 위치·게시 주소·검토 상태 최종 확인
- 관리자 게시 키 확인 후 GitHub 저장 및 Cloudflare 자동 배포
- 분석 단계에서는 원본 HTML을 서버로 전송하거나 수정하지 않음

정적 배포에서도 분석과 6종 생성은 브라우저 안에서 작동합니다. `게시 준비`를 누르고 최종 확인을 거쳐 승인하면 원본 HTML만 GitHub의 `content/posts/`에 저장되고 Cloudflare Pages 빌드가 시작됩니다.

## 게시 API 운영 설정

Cloudflare Pages 프로젝트의 **Production Variables and Secrets**에 아래 두 비밀값을 등록합니다.

- `PUBLISH_KEY`: 관리자가 게시할 때 입력할 충분히 긴 임의 문자열
- `GITHUB_TOKEN`: `haneul2819/insight-desk` 저장소만 선택하고 **Contents: Read and write** 권한만 부여한 GitHub fine-grained personal access token

필요할 때만 아래 일반 환경 변수를 추가합니다.

- `GITHUB_REPOSITORY`: 기본값 `haneul2819/insight-desk`
- `GITHUB_BRANCH`: 기본값 `main`
- `SITE_ORIGIN`: 기본값 `https://insight.hnlab.kr`

비밀값은 소스 코드나 브라우저 저장소에 넣지 않습니다. 게시 키는 게시 요청의 `Authorization` 헤더로 한 번만 전송되며 화면에 저장되지 않습니다. 같은 파일명이 있으면 기본적으로 게시를 중단하고, 관리자가 덮어쓰기를 명시적으로 선택한 경우에만 수정합니다.

### 명령줄 처리

1. 완성한 HTML을 `content/posts/YYYY-MM-DD_글이름.html`에 넣습니다.
2. 다음 명령을 실행합니다.

```bash
npm run knowledge:one -- content/posts/YYYY-MM-DD_글이름.html
```

3. `knowledge-output/글이름/`에서 생성 결과를 확인합니다.

## 모든 글 다시 처리하기

```bash
npm run knowledge:build
```

사이트를 빌드할 때도 전체 엔진이 먼저 자동 실행됩니다.

```bash
npm run build
```

## 운영 원칙

- 원본 HTML이 단일 기준 문서입니다.
- 자동 생성물이 원문에 없는 새로운 사실이나 수치를 만들지 않습니다.
- 태그는 최대 10개만 사용합니다.
- 출처, 팩트체크, 다음 검토일을 별도로 관리합니다.
- 게시 전 최종 승인 단계를 반드시 거칩니다.
- HTML의 스크립트, 프레임, 폼, 이벤트 속성은 게시 API에서 차단합니다.
