# HN Knowledge Engine 1차 버전

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
- 원본 HTML은 서버로 전송하거나 수정하지 않음

정적 배포에서도 브라우저 안에서 동일하게 작동합니다. 다만 이 화면에서 생성한 결과는 서버 저장소에 자동 반영되지 않으므로, 내려받은 파일을 검토한 뒤 배포 절차에 사용합니다.

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

## 1차 버전의 원칙

- 원본 HTML이 단일 기준 문서입니다.
- 자동 생성물이 원문에 없는 새로운 사실이나 수치를 만들지 않습니다.
- 태그는 최대 10개만 사용합니다.
- 출처, 팩트체크, 다음 검토일을 별도로 관리합니다.
- AI를 이용한 문장 재작성과 최신 사실 재검증은 다음 버전에서 승인 절차와 함께 추가합니다.
