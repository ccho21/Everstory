# Batch 8 — About / FAQ / Sizing Guide / Materials Guide 페이지

이 문서로 4개 정보 페이지를 storefront 에 정상 노출시킨다. **MVP 는 default `page.json` template 그대로 사용** — admin 에 등록된 본문 (Batch 3 에서 입력) 이 자동 노출되므로 추가 작업이 적다.

- **소요 시간**: 약 30–45분 (검증 위주)
- **이전 batch**: `07_product_template.md`
- **다음 batch**: `09_qa_launch.md`
- **본문 SOT**: [`../pages_copy.md`](../pages_copy.md), [`../footer_copy.md`](../footer_copy.md)

---

## 시작 전 점검

- [ ] Batch 3 종료 — 4 페이지 (About / FAQ / Sizing Guide / Materials Guide) 가 admin Pages 에 본문 + 한국어 footer 포함해 등록됨
- [ ] Batch 5 종료 — Theme 업로드, Header / Footer 셋업

---

## Horizon `page.json` default 구조

```
main (main-page section)
  ├─ Title (text block)         {{ closest.page.title }}  자동
  └─ Page content (page-content block)  admin description  자동
```

매우 단순. admin → Pages 의 title + description 이 그대로 storefront 에 렌더링.

→ **4 페이지 모두 default page.json 으로 충분**. 별도 template 분리는 MVP 이후 (특정 페이지에 hero / accordion / 비주얼 layout 이 꼭 필요할 때).

---

## Step 8.1 — Default Page template 확인

[Action 8.1.a] Theme Editor 좌측 상단 페이지 selector → `Pages` → `About Everstory Studio` 선택

[Action 8.1.b] 좌측 트리 default 구성 확인:
- `main-page` section
  - `Title` (text block)
  - `Page content` block

[Checkpoint 8.1] ✅ About 페이지 미리보기에 **admin 에 입력한 모든 본문** (English 본문 + horizontal rule + 한국어 안내) 자동 노출.

---

## Step 8.2 — `main-page` section settings

[Action 8.2.a] `main-page` section 클릭 → 우측 settings:

| 항목 | 값 |
|------|------|
| Content direction | `column` |
| Gap | `32` |
| Color scheme | default 또는 `scheme-1` |
| Padding block-start | `64` (wireframe 기준 더 여유 있게, default = 40) |
| Padding block-end | `80` |
| Section width | `page-width` (또는 `narrow` — 본문 가독성 위해 좁게) |

[Action 8.2.b] `Title` text block 클릭:
- Text → `<h1>{{ closest.page.title }}</h1>` (default 유지)
- Type preset → `h1` 또는 `display`
- Alignment → `left` (또는 `center` 취향)
- Font size → 큰 사이즈 (예: `2.5rem`)

[Action 8.2.c] `Page content` block — settings 없음 (description 자동 렌더링)

[Checkpoint 8.2] ✅ Title 이 큰 헤딩으로 표시. 본문이 그 아래 자동 노출.

---

## Step 8.3 — 4 페이지 미리보기 검증

[Action 8.3.a] 좌측 페이지 selector → 다음 4 페이지 차례로 미리보기:

#### About
- URL = `/pages/about`
- Title = `About Everstory Studio`
- 본문: English ("Everstory Studio is a small photo sticker studio in Toronto…") → ─ → "한국어로 한 마디" (footer_copy.md) → KR 본문

#### FAQ
- URL = `/pages/faq`
- Title = `Frequently Asked Questions`
- 본문: English Q&A 카테고리별 (Ordering / Photos / Sizes and Materials / Shipping) → ─ → "한국어 자주 묻는 질문" (footer_copy.md) → KR Q&A

#### Sizing Guide
- URL = `/pages/sizing-guide`
- Title = `Sticker Size Guide`
- 본문: 6 size cards + use case + proportion note (영문 only)

#### Materials Guide
- URL = `/pages/materials-guide`
- Title = `Material Guide`
- 본문: 4 material 표 (Best for 컬럼) + waterproof·fade resistant 노트 (영문 only)

[Checkpoint 8.3] ✅ 4 페이지 모두 admin 본문 자동 노출, 한국어 footer 포함된 페이지 (About / FAQ) 는 horizontal rule 다음 KR 섹션 정상.

---

## Step 8.4 — (옵션) FAQ 를 accordion 으로 강화

> MVP 는 description plain text 로 충분. 다만 FAQ 가 길어 accordion 으로 분해하면 UX 향상.

선택지:

### 옵션 A — 그대로 (description plain text)
**MVP 추천**. Batch 8 종료. 본문이 길지만 카테고리 헤딩이 있어 읽기 가능.

### 옵션 B — admin description 을 HTML accordion 으로 변환
- admin → Pages → FAQ → description 에 `<details><summary>Q. ...</summary>...</details>` 형식으로 직접 작성
- 단점: Rich text editor 에서 HTML 직접 편집 필요 (`<>` 토글), 디자인이 native HTML accordion 한계

### 옵션 C — FAQ 전용 template (`page.faq.json`) 생성
- Theme Editor 좌측 상단 페이지 selector → `Pages` → `Frequently Asked Questions` → 우측 상단 `…` → `Create template`
- 새 template name = `faq` (실제 파일 = `templates/page.faq.json`)
- main-page section + accordion section 2개 구성
- Accordion 안에 Q&A row 10여개 직접 입력
- admin → Pages → FAQ → Theme template 변경 → `page.faq`

옵션 C 가 가장 깔끔하지만 작업량 큼. **launch 후 enhancement 로 진행 권장**.

---

## Step 8.5 — Footer policy / Help 메뉴 링크 검증

> Footer · Help 메뉴는 Batch 3 에서 Shipping / Refund 정책에 직접 URL 로 연결됨. 실제 작동 확인.

[Action 8.5.a] storefront 미리보기 → footer 의 `Help` 그룹에서 다음 링크 클릭:

- `Shipping & Pickup` → `/policies/shipping-policy` 정상 진입
- `Refund Policy` → `/policies/refund-policy` 정상 진입
- `FAQ` → `/pages/faq` 정상 진입
- `Contact` → `mailto:` 메일 클라이언트 열림 (또는 Contact page 링크 시 정상 진입)

[Action 8.5.b] Footer · Brand 그룹:
- `About` → `/pages/about`
- `Privacy` → `/policies/privacy-policy`
- `Terms` → `/policies/terms-of-service`
- `Sizing guide` → `/pages/sizing-guide`

[Checkpoint 8.5] ✅ Footer 의 모든 링크가 정상 진입. 깨지는 링크 없음.

---

## Batch 8 종료 검증

다음 모두 ✅ 면 Batch 8 완료:

- [ ] **Step 8.1**: 4 페이지 default page.json 사용, 본문 자동 노출
- [ ] **Step 8.2**: main-page section settings 조정 (padding, alignment, title style)
- [ ] **Step 8.3**: 4 페이지 미리보기 정상 (About / FAQ / Sizing / Materials)
- [ ] **Step 8.5**: Footer 모든 링크 정상

---

## 다음 batch

→ **`09_qa_launch.md`** (최종 QA + Test order + Pre-launch checklist)
