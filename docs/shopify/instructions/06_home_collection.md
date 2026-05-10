# Batch 6 — Home + Collection 템플릿 조립 (Theme Editor 한 단계씩)

이 문서는 Theme Editor 만 써서 **Home (`/`)** 와 **Collection (`/collections/photo-sheets`)** 페이지를 wireframe 그대로 조립한다. 클릭 위치 / 화면 변화 / 입력값을 한 단계씩 명시.

- **소요 시간**: 약 90–120분 (Hero 30분, How it works 30분, 나머지 30–60분)
- **이전 batch**: `05_theme_global.md`
- **다음 batch**: `07_product_template.md`
- **Horizon 버전**: 3.5.1
- **편집 방식**: Theme Editor (Shopify admin) 만 사용. 코드 직접 편집 안 함.

---

## ⚠️ 시작 전 꼭 읽기

### GitHub 동기화가 켜져있는 경우 (이 스토어가 그렇다)

이 스토어는 GitHub 저장소 (`github.com/ccho21/everstory-theme`) 와 양방향 sync 가 켜져 있다. 즉:

- Theme Editor 에서 **Save** 누를 때마다 `shopify[bot]` 이 자동으로 GitHub 에 commit + push 한다.
- 동시에 본인 또는 누군가 로컬 코드 (`Shopify Theme/horizon/`) 에서 같은 파일 (예: `templates/index.json`) 을 편집하고 있으면 **충돌 또는 덮어쓰기** 발생 가능.
- 이 batch 작업 중에는 **로컬 코드 편집 금지**. Theme Editor 에만 집중.

### Unpublished theme 에서 작업할 것

- admin → `Online Store` → `Themes` → **Theme library** → 본인이 업로드한 Horizon 의 `Customize` 클릭.
- 절대 Live theme (현재 published) 의 Customize 누르지 말 것 — Save 즉시 storefront 반영됨.

### 시작 전 점검

- [ ] Batch 5 완료 — Theme Editor 진입 가능, Header / Footer 셋업됨
- [ ] Batch 3 완료 — `Photo Sheets` collection 에 4 상품 (Solo / Duo / Trio / Memory Pack) 포함, Pages (About / FAQ / Sticker Size Guide / Material Guide) 등록됨
- [ ] **이미지 준비** (없으면 placeholder 색상 박스로 진행, launch 전 교체):
  - Home hero 이미지 1장 — 4:5 portrait, 약 1200×1500 px
  - How it works 3-step 이미지 3장 — 1:1 square, 약 800×800 px
  - Why Everstory studio 이미지 1장 — 16:9 landscape, 약 1600×900 px
  - Sizing/materials guide CTA 이미지 1장 — 16:9 landscape, 약 1600×900 px

---

## 📋 이 batch 에서 사용할 모든 카피 (한곳에 모음)

> 진행 중 step 별로 같은 내용이 다시 나옴. 어느 쪽에서 카피하든 OK.

### Home page

**Hero — Heading text block**
```html
<p>Photographs, kept by hand.</p>
```

**Hero — Eyebrow text block (작은 글씨, heading 위)**
```html
<p>Made in Toronto</p>
```

**Hero — Body text block**
```html
<p>A5 die-cut sticker sheets, traced and finished by hand on Korean premium substrates. Made to order, shipped in 2–5 business days.</p>
```

**Hero — Primary button**
- Label: `Shop the lookbook`
- Link: `/collections/photo-sheets`

**Hero — Secondary button**
- Label: `How it works`
- Link: `#how-it-works`

**How it works — Section eyebrow text**
```html
<p>How it works</p>
```

**How it works — Section heading text**
```html
<h2>From your photo to a sheet you'll keep.</h2>
```

**How it works — Step 01**
- Heading: `<h3>01 — Send a photo</h3>`
- Body: `<p>Pick a size and material. Upload your photograph(s) and write notes on what matters — a face we should not crop, a tone, a detail.</p>`

**How it works — Step 02**
- Heading: `<h3>02 — We hand-cut</h3>`
- Body: `<p>Every silhouette is traced by a person, not an algorithm. We start within one business day of your order.</p>`

**How it works — Step 03**
- Heading: `<h3>03 — Made to keep</h3>`
- Body: `<p>Printed on Epson ET-8550, cut on Summa D75. Free Ontario shipping or Toronto pickup.</p>`

**Featured collection — Eyebrow**
```html
<p>Photo sheets by count</p>
```

**Featured collection — Heading**
```html
<h2>Pick the count that fits your story.</h2>
```

**Featured collection — View all button**
- Label: `View all`
- Link: `/collections/photo-sheets`

**Why Everstory — Eyebrow**
```html
<p>Why Everstory</p>
```

**Why Everstory — Heading**
```html
<h2>Made to keep, not to scroll past.</h2>
```

**Why Everstory — Body**
```html
<p>The sticker industry runs on automation. We do the part the algorithm gives up on — hair, ears, paws, the gap between fingers — by hand. Korean premium substrates. Toronto studio. Made to order.</p>
```

**Why Everstory — Button**
- Label: `Read our story`
- Link: `/pages/about-everstory-studio`

### Collection page

**Collection heading — Eyebrow**
```html
<p>Photo sheets</p>
```

**Collection heading — Title (H1)**
```html
<h1>Photo sheets by count.</h1>
```

**Collection heading — Description**
```html
<p>A5 die-cut sheets, hand cut at our Toronto studio. Pick the count that fits your story — from a single portrait to a four-photo keepsake set.</p>
```

**Sizing/materials CTA — Eyebrow**
```html
<p>Not sure which to pick?</p>
```

**Sizing/materials CTA — Heading**
```html
<h2>Sizing &amp; materials guide.</h2>
```

**Sizing/materials CTA — Body**
```html
<p>XS through XXL plus Mixed. Four Korean substrates with LAMat-AF / Oraguard lamination. Pick by surface, by use, by tone.</p>
```

**Sizing/materials CTA — Button 1**
- Label: `Sizing guide`
- Link: `/pages/sticker-size-guide`

**Sizing/materials CTA — Button 2**
- Label: `Materials guide`
- Link: `/pages/material-guide`

---

## 🗺️ Theme Editor 화면 구조 (한 번만 익히면 끝)

화면이 3개 영역으로 나뉜다:

```
┌──────────────────────────────────────────────────────────────────┐
│  [Pages ▾]                            [↩ ↪]  [💻 📱]   [Save]   │  ← 상단 toolbar
├──────────────┬─────────────────────────────────┬────────────────┤
│              │                                  │                 │
│  좌측         │     가운데 (preview canvas)       │   우측         │
│  Sections    │                                  │   Settings     │
│  tree        │     ─ 실시간 페이지 미리보기 ─       │   panel        │
│              │                                  │                 │
│  ▾ Header    │                                  │   (선택한       │
│  ▾ Template  │                                  │    section /   │
│    Hero      │                                  │    block 의     │
│    Featured… │                                  │    설정값)      │
│  ▾ Footer    │                                  │                 │
│              │                                  │                 │
└──────────────┴─────────────────────────────────┴────────────────┘
```

- **좌측 sidebar 상단** = 페이지 selector (현재 어떤 페이지 보고 있는지). 클릭하면 dropdown.
- **좌측 sidebar 본체** = 그 페이지의 sections tree. Header (group) / Template (이 페이지의 sections) / Footer (group).
- **각 section 호버** → 우측에 ⋮ (kebab) 메뉴 노출 → Hide / Duplicate / Remove.
- **각 section 사이 호버** → `+ Add section` 버튼 노출.
- **section 클릭** → 우측 settings 패널이 그 section 의 설정으로 바뀜 + 왼쪽에 그 section 안의 blocks 펼쳐짐.
- **block 호버** → 같은 패턴 (⋮ 메뉴, `+ Add block`).
- **상단 우측** Save = 변경사항 저장 (이때 GitHub 봇이 자동 commit).
- **상단 우측** 💻 📱 = 데스크톱 / 모바일 viewport 토글.

---

## Step 6.1 — Home 페이지

### 6.1.0 Home page 진입

**클릭 1**: 좌측 sidebar 상단 페이지 selector (현재 `Home page` 또는 다른 페이지 이름이 표시됨).

**클릭 2**: dropdown 에서 `Home page` 선택.

**확인**: 가운데 preview 가 storefront home 으로 바뀐다. 좌측 sidebar 본체에 다음이 보인다:

```
▾ Header
    Announcement bar
    Header
▾ Template
    Hero
    Featured collection
▾ Footer
    Footer
    Footer utilities
```

> 이미 hero 일부 작업했으면 hero 의 텍스트가 default ("Browse our latest products") 가 아니라 본인이 입력한 내용으로 보일 수 있음. 그대로 OK — 다음 step 에서 확인.

✅ **Checkpoint 6.1.0** — 좌측 트리에 `Hero` + `Featured collection` 두 section 보임.

---

### 6.1.1 Hero section 의 settings 변경

#### 6.1.1.a Hero 클릭

**클릭**: 좌측 트리 `Template` 아래 `Hero` 클릭.

**확인**:
- 가운데 preview 가 hero 영역으로 자동 스크롤.
- 우측 패널 상단에 `Hero` 라고 표시되고, 그 아래 settings 가 표시됨.
- 좌측 트리 `Hero` 가 펼쳐지면서 안의 blocks (Text, Button 등) 보임.

#### 6.1.1.b Hero 의 Layout 영역 설정

우측 패널을 위에서 아래로 스크롤하면 헤더로 묶인 섹션들이 있다. **Layout** 헤더 아래:

| 필드 | 어떤 값으로 | 의미 |
| --- | --- | --- |
| Section width | `Page` | 좌우 max-width 기본값 |
| Height | `Large` | hero 가 뷰포트의 큰 비율 차지 |
| Padding > Block start | `100` | 상단 안쪽 여백 |
| Padding > Block end | `72` | 하단 안쪽 여백 |

> Padding 항목은 보통 슬라이더 또는 숫자 입력. 단위는 px.

#### 6.1.1.c Hero 의 Colors / Background 영역

| 필드 | 값 |
| --- | --- |
| Color scheme | `Scheme 1` (또는 brand 따라) |

> 원래 default 가 `Scheme 6` (어두운 계열) 인데, hero 이미지 위에 텍스트 올릴 거라 overlay 와 함께 쓰면 어떤 scheme 든 OK. 일단 `Scheme 1` 로 통일.

#### 6.1.1.d Hero 의 Overlay 영역

| 필드 | 값 |
| --- | --- |
| Toggle overlay | ✅ on (체크) |
| Overlay color | `#12121266` (검정 + 알파 40%, default 그대로 유지) |
| Overlay style | `Solid` (default) |

**의미**: 이미지 위에 어둡게 깔아서 흰색 텍스트 가독성 확보.

#### 6.1.1.e Hero 의 Media 영역

같은 패널 아래로 스크롤하면 **Media** (또는 **Background**) 헤더.

| 필드 | 값 |
| --- | --- |
| Media 1 > Type | `Image` |
| Media 1 > Image | (Select image 클릭 → 준비한 4:5 hero 이미지 업로드) |
| Stack media | off (체크 해제) |

> Media 2 는 비워둠. Hero 이미지 1장만 사용.

> 이미지 업로드는 Shopify Files 에 저장됨. 한 번 업로드해두면 다른 곳에서도 재사용 가능.

#### 6.1.1.f 첫 Save

**클릭**: 우측 상단 `Save` 버튼.

**확인**: 버튼이 잠깐 spinner 로 바뀌었다가 `Saved` 로 표시. preview 에도 변경 반영.

> 이 시점에 GitHub 에 봇 자동 commit 1건 발생. 정상 동작.

✅ **Checkpoint 6.1.1** — Hero 영역에 본인이 업로드한 4:5 이미지 + 그 위에 어둑한 overlay + 본문 텍스트 (아직 default 일 수 있음). Section 높이가 페이지 위에서 큰 비율 차지.

---

### 6.1.2 Hero 의 Text block 정리 — Eyebrow / Heading / Body 3개

#### 6.1.2.a 현재 hero 안의 blocks 확인

**클릭**: 좌측 트리에서 `Hero` 옆 `▾` 화살표 (이미 펼쳐져 있을 수 있음).

**확인**: 그 안에 다음이 있어야 함:
- `Heading` (text block 1개) — 본인이 이전에 만든 거면 다른 이름일 수 있음
- `Text` (text block 1개)
- `Button` (button block 1개)
- `Button` (button block 1개) — 없을 수 있음

> Hero 의 default 는 text 1개 + button 1개. 본인이 이미 두 번째 button 까지 추가했으면 모두 4개. **이미 있는 건 그대로 두고, 부족한 것만 추가**한다.

#### 6.1.2.b 첫 번째 Text block 을 "Eyebrow" 로 사용

**클릭**: 좌측 트리에서 `Hero` 안의 첫 번째 Text/Heading block 클릭.

**확인**: 우측 패널이 그 text block 의 settings 로 바뀜.

**작업**: 우측 패널의 **Text** 입력 칸 (큰 textarea) 의 기존 내용을 모두 지우고, 다음을 그대로 붙여넣기:

```html
<p>Made in Toronto</p>
```

같은 패널에서:

| 필드 | 값 |
| --- | --- |
| Text preset | `Body (Small)` |
| Width | `Fit content` |
| Alignment | `Left` |
| Color | `var(--color-foreground)` (default) — 또는 흰색 사용하려면 색 picker 에서 흰색 선택 |
| Case | `Uppercase` (eyebrow 느낌 살리려면) |

#### 6.1.2.c 두 번째 Text block 을 "Heading" 으로 사용

**클릭**: 좌측 트리의 두 번째 Text block 클릭. (없으면 6.1.2.f 참고해서 추가)

**작업**: Text 입력 칸:

```html
<p>Photographs, kept by hand.</p>
```

| 필드 | 값 |
| --- | --- |
| Text preset | `Heading (Extra large)` 또는 `Heading (Large)` |
| Width | `Custom` → custom width = `80%` (긴 헤딩이 너무 한 줄로 길게 안 가게) |
| Alignment | `Left` |
| Color | 흰색 (overlay 위 가독성) |
| Case | `None` |

#### 6.1.2.d 세 번째 Text block 을 "Body" 로 사용

> Hero default 에는 text block 이 1개만 있음. 만약 두 번째도 없으면 추가해야 함.

**Text block 이 2개 이하라서 Body 가 없으면**:

1. 좌측 트리에서 `Hero` 호버 → 마우스 커서를 hero 안의 마지막 block 아래에 두면 `+ Add block` 버튼이 노출.
2. 클릭 → block 종류 dropdown 표시 → `Text` 선택.
3. 새 Text block 이 hero 의 마지막에 추가됨.
4. drag handle 로 button 위로 옮김 (heading 다음, button 위).

**Text block 클릭 후 작업**:

```html
<p>A5 die-cut sticker sheets, traced and finished by hand on Korean premium substrates. Made to order, shipped in 2–5 business days.</p>
```

| 필드 | 값 |
| --- | --- |
| Text preset | `Body` |
| Width | `Custom` → custom width = `60%` |
| Alignment | `Left` |
| Color | 흰색 |

#### 6.1.2.e Block 순서 정리

좌측 트리에서 hero 안의 blocks 순서가 위에서 아래로 다음과 같아야 함:

1. Text — `Made in Toronto` (eyebrow)
2. Text — `Photographs, kept by hand.` (heading)
3. Text — `A5 die-cut sticker sheets...` (body)
4. Button — `Shop the lookbook`
5. Button — `How it works`

순서가 다르면 각 block 의 왼쪽 ☰ drag handle 을 잡고 위/아래로 드래그.

#### 6.1.2.f Button 이 부족하면 추가

만약 button block 이 1개만 있으면:

1. 좌측 트리 hero 안 마지막 block 아래 호버 → `+ Add block` → `Button` 선택.
2. 새 button block 의 settings (다음 step 에서 설정).

#### 6.1.2.g 첫 Button 을 Primary CTA 로 설정

**클릭**: 좌측 트리에서 첫 번째 Button block 클릭.

| 필드 | 값 |
| --- | --- |
| Label | `Shop the lookbook` |
| Link | `Search or paste a link` 입력칸에 `/collections/photo-sheets` 직접 입력. 또는 dropdown → `Collections` → `Photo Sheets` 선택. |
| Open in new tab | off |
| Style | `Primary` |
| Width | `Fit content` |

#### 6.1.2.h 두 번째 Button 을 Secondary CTA 로 설정

**클릭**: 두 번째 Button block 클릭.

| 필드 | 값 |
| --- | --- |
| Label | `How it works` |
| Link | `/#how-it-works` 입력 (앞에 `/` 가 있어야 절대 경로로 인식되어 어디서 눌러도 home 으로 이동 후 anchor 로 스크롤) |
| Open in new tab | off |
| Style | `Secondary` |
| Width | `Fit content` |

> 💡 **함정**: Theme Editor 의 link 입력 칸에 `#how-it-works` 만 넣으면 dropdown 이 "Search results" 라고 표시할 수 있음. 그래도 그냥 입력 후 Enter 또는 빈 영역 클릭하면 저장됨. preview 에서 button 클릭 시 home 위에서 scroll 안 되면 6.1.3 에서 anchor block 셋업 후 다시 테스트.

#### 6.1.2.i Save

**클릭**: 우측 상단 `Save`.

✅ **Checkpoint 6.1.2** — Preview 의 hero 영역에:
- 작은 글씨 "MADE IN TORONTO" (uppercase eyebrow)
- 큰 헤딩 "Photographs, kept by hand."
- 본문 paragraph
- 버튼 2개: 진한 "Shop the lookbook" + 외곽선만 있는 "How it works"
- 모두 이미지 위에 흰색으로 노출

---

### 6.1.3 How it works section 추가

> Wireframe 의 3-step 영역. **Section** 컨테이너 1개 + 안에 Custom Liquid (anchor) + Text (eyebrow) + Text (heading) + Group (3 column row) + Group 안에 Group ×3 (각 column).

#### 6.1.3.a Hero 와 Featured collection 사이에 새 section 추가

**작업**:
1. 좌측 트리에서 `Hero` 와 `Featured collection` 사이를 마우스로 호버.
2. 사이에 얇은 가로선 + 가운데 `+ Add section` 버튼 노출.
3. 클릭.
4. section 종류 picker 가 뜸. 카테고리별로 묶여 있음 — 가장 위 또는 "Layout" / "Other" 카테고리에서 **Section** 선택.

> 💡 **헷갈림**: section picker 에는 `Hero`, `Image with text`, `Featured product`, `Multicolumn` 같은 특화 section 도 보임. 이번엔 일반 컨테이너인 **Section** 을 쓴다 (이름 그대로 "Section"). "Image with text" 는 이미지 + 텍스트 2-column 만 되므로 3-step 에 부적합.

**확인**: 좌측 트리에서 `Hero` 와 `Featured collection` 사이에 새 `Section` 항목 추가. 가운데 preview 에 빈 회색 영역 표시.

#### 6.1.3.b 새 Section 의 Layout 설정

**클릭**: 좌측 트리에서 방금 추가된 `Section` 클릭.

우측 패널:

| 필드 | 값 |
| --- | --- |
| Content direction | `Vertical` |
| Vertical on mobile | ✅ on |
| Alignment | `Center` (가로 중앙 정렬) |
| Position | `Top` |
| Gap | `24` |
| Section width | `Page` |
| Height | `Auto` |
| Color scheme | `Scheme 1` |
| Padding > Block start | `64` |
| Padding > Block end | `64` |

#### 6.1.3.c Anchor 용 Custom Liquid block 추가

> Horizon 3.5.1 의 일반 Section 에는 별도 "Section ID" 필드가 없다. Hero 의 "How it works" 버튼이 `#how-it-works` 로 스크롤되게 하려면, 이 section 안에 보이지 않는 anchor 를 직접 심어야 한다.

**작업**:
1. 좌측 트리에서 방금 만든 Section 안 빈 영역 호버 → `+ Add block` 버튼 노출 → 클릭.
2. Block picker 에서 `Custom Liquid` 선택. (없으면 `Apps` 카테고리도 확인 — Horizon 은 보통 "Custom" 카테고리 또는 "Code" 비슷한 이름 아래 있음)

**확인**: 좌측 트리 Section 안에 `Custom Liquid` block 추가됨.

**클릭**: 그 Custom Liquid block 클릭 → 우측 패널에 **Liquid** 라는 textarea 표시.

**입력**: 다음을 그대로 붙여넣기:

```html
<div id="how-it-works" style="position: relative; top: -80px;"></div>
```

> `top: -80px` 는 sticky header 높이만큼 보정 (header 가 화면 위에서 64–80px 차지하므로). 스크롤이 너무 짧거나 길면 숫자만 조정 (예: `-100px`).

**Block 위치**: 이 anchor block 을 section 의 **맨 위**로 드래그.

#### 6.1.3.d Eyebrow text block 추가

**작업**:
1. 좌측 트리 Section 호버 → `+ Add block` → `Text`.
2. 새 Text block 클릭 → 우측 Text 입력 칸:

```html
<p>How it works</p>
```

| 필드 | 값 |
| --- | --- |
| Text preset | `Body (Small)` |
| Alignment | `Center` |
| Case | `Uppercase` |
| Color | `var(--color-foreground)` |

**Block 위치**: anchor 다음 (위에서 두 번째).

#### 6.1.3.e Heading text block 추가

**작업**:
1. 다시 `+ Add block` → `Text`.
2. Text 입력:

```html
<h2>From your photo to a sheet you'll keep.</h2>
```

| 필드 | 값 |
| --- | --- |
| Text preset | `Heading (Large)` |
| Alignment | `Center` |
| Width | `Fit content` |

**Block 위치**: eyebrow 다음 (세 번째).

#### 6.1.3.f 3-column row Group 추가

**작업**:
1. `+ Add block` → `Group` 선택.
2. 새 Group 클릭 → 우측 settings:

| 필드 | 값 |
| --- | --- |
| Content direction | `Horizontal` (가로 배치) |
| Vertical on mobile | ✅ on (모바일에서 세로로 stack) |
| Alignment | `Center` |
| Position | `Top` |
| Gap | `24` |
| Width | `Fill` (가로 100%) |

**Block 위치**: heading 다음 (네 번째). 좌측 트리에서 이 group 이 section 안의 마지막에 있으면 OK.

✅ **현재 진행**: Section 안에 [Custom Liquid (anchor) → Text (eyebrow) → Text (heading) → Group (horizontal, 3-column 컨테이너)] 4개 block. 마지막 group 은 아직 비어있음.

#### 6.1.3.g Step 01 column group 추가 (row group 안에)

**작업**:
1. 좌측 트리에서 방금 만든 horizontal Group 호버 → 그 group **안쪽** 으로 마우스 이동 시 `+ Add block` 노출 → 클릭.
2. `Group` 선택 (또 group). 이 inner group 이 column 1.

**클릭**: 새 inner Group 의 settings:

| 필드 | 값 |
| --- | --- |
| Content direction | `Vertical` |
| Vertical on mobile | (이미 default) |
| Alignment | `Left` |
| Gap | `12` |
| Width | `Fill` |

#### 6.1.3.h Step 01 column 안에 Image + Heading + Body 3개 block

**Image block 추가**:
1. 좌측 트리에서 방금 만든 Step 01 inner Group 호버 → 안쪽 `+ Add block` → `Image`.
2. 클릭 → 우측 settings → **Image** 의 `Select image` → STEP 01 사진 업로드 (1:1 square).
3. **Image ratio** = `Square`.

**Heading text block 추가**:
1. 같은 inner Group 안에 `+ Add block` → `Text`.
2. Text:
   ```html
   <h3>01 — Send a photo</h3>
   ```
3. Text preset = `Heading (Small)`.
4. Alignment = `Left`.

**Body text block 추가**:
1. `+ Add block` → `Text`.
2. Text:
   ```html
   <p>Pick a size and material. Upload your photograph(s) and write notes on what matters — a face we should not crop, a tone, a detail.</p>
   ```
3. Text preset = `Body`.
4. Alignment = `Left`.
5. Color = `var(--color-foreground-secondary)` (옅게).

✅ **Checkpoint Step 01** — Preview 의 How it works section 안 왼쪽에 image + 작은 heading + 본문 1단 노출.

#### 6.1.3.i Step 02 column group 추가

**작업**:
1. 좌측 트리에서 horizontal Group (parent row group) 호버 → 그 안쪽 `+ Add block` → `Group`. (Step 01 group 옆에 새 inner group 생성)
2. settings: 6.1.3.g 와 동일 (`Vertical` / `Left` / Gap `12` / Width `Fill`).

**Inner group 안에 추가**:

**Image block** — STEP 02 사진, ratio `Square`.

**Text block (heading)**:
```html
<h3>02 — We hand-cut</h3>
```

**Text block (body)**:
```html
<p>Every silhouette is traced by a person, not an algorithm. We start within one business day of your order.</p>
```

#### 6.1.3.j Step 03 column group 추가

마찬가지 패턴.

**Image** — STEP 03 사진, ratio `Square`.

**Text block (heading)**:
```html
<h3>03 — Made to keep</h3>
```

**Text block (body)**:
```html
<p>Printed on Epson ET-8550, cut on Summa D75. Free Ontario shipping or Toronto pickup.</p>
```

#### 6.1.3.k Save + 구조 검증

**클릭**: `Save`.

좌측 트리에서 How it works section 의 최종 구조 확인:

```
▾ Section (How it works)
    Custom Liquid       ← anchor
    Text                ← "How it works" eyebrow
    Text                ← "From your photo..." heading
    ▾ Group (horizontal, 3-column row)
        ▾ Group (vertical, column 1)
            Image
            Text         ← 01 heading
            Text         ← 01 body
        ▾ Group (vertical, column 2)
            Image
            Text         ← 02 heading
            Text         ← 02 body
        ▾ Group (vertical, column 3)
            Image
            Text         ← 03 heading
            Text         ← 03 body
```

✅ **Checkpoint 6.1.3** — Preview:
- Hero 다음에 새 section 노출
- 가운데 정렬된 eyebrow + heading
- 그 아래 3 column 으로 image + heading + body
- 모바일 viewport 토글 → 3 column 이 세로로 stack
- Hero 의 "How it works" 버튼 클릭 → 이 section 위치로 스크롤 (anchor 동작)

---

### 6.1.4 Featured collection (product-list) 변경

#### 6.1.4.a Featured collection 클릭

**클릭**: 좌측 트리에서 `Featured collection` section 클릭.

**확인**: 우측 패널이 product-list settings 로 바뀜. 좌측 트리에 안의 blocks 펼쳐짐:

```
▾ Featured collection
    Header              ← static (제거 불가, sub-block 안에 Collection title + View all)
    Product card        ← static (제거 불가, sub-block 안에 Image + Title + Price)
```

#### 6.1.4.b Section settings

우측 패널:

| 필드 | 값 |
| --- | --- |
| Collection | (dropdown 클릭 → `Photo Sheets` 선택) |
| Type | `Grid` |
| Carousel on mobile | off |
| Max products | `4` |
| Columns | `4` |
| Mobile columns | `2` |
| Columns gap | `8` |
| Rows gap | `24` |
| Section width | `Page` |
| Color scheme | `Scheme 1` |
| Padding > Block start | `48` |
| Padding > Block end | `48` |

#### 6.1.4.c Header static block 안의 Collection title 변경

**클릭**: 좌측 트리 `Featured collection` → `Header` 클릭. (Header 는 static 이라 삭제 불가, 클릭만 됨)

**확인**: Header 가 펼쳐지면서 안에 sub-block 2개 보임:
```
▾ Header
    Collection title    ← text sub-block
    Button             ← button sub-block (View all)
```

**클릭**: `Collection title` 클릭. 우측 Text 입력 칸:

```html
<h2>Pick the count that fits your story.</h2>
```

| 필드 | 값 |
| --- | --- |
| Text preset | `Heading (Medium)` |
| Alignment | `Left` |

> Eyebrow 까지 표시하려면 별도 처리 필요. Featured collection 의 Header 는 sub-block 2개만 허용해서 새 text block 추가 어려움. 두 가지 방법:
> - **방법 A (간단)**: Eyebrow 를 포기하고 heading 만 사용 — wireframe 과 약간 다르지만 깔끔.
> - **방법 B (수동)**: heading 의 HTML 을 multi-line 으로:
>   ```html
>   <p style="font-size:0.75rem; text-transform:uppercase; margin-bottom:4px;">Photo sheets by count</p>
>   <h2>Pick the count that fits your story.</h2>
>   ```
>   → 한 text block 에서 eyebrow + heading 둘 다 표시. inline style 이라 design token 과 분리되지만 MVP 는 OK.

#### 6.1.4.d Header static block 안의 View all 버튼 변경

**클릭**: 좌측 트리 `Header` 안의 `Button` 클릭.

| 필드 | 값 |
| --- | --- |
| Label | `View all` |
| Link | `/collections/photo-sheets` |
| Open in new tab | off |
| Style | `Link` (default — 텍스트 링크 스타일) |

#### 6.1.4.e Product card static block 안의 sub-block 설정

**클릭**: 좌측 트리 `Featured collection` → `Product card` 클릭.

**확인**: 안에 sub-block 3개:
```
▾ Product card
    Product card media   ← image
    Product title        ← text
    Product price        ← price
```

**`Product card media` 클릭**:

| 필드 | 값 |
| --- | --- |
| Image ratio | `Adapt` (상품 이미지 비율 그대로 — square 면 square, portrait 면 portrait) |

**`Product title` 클릭**:

| 필드 | 값 |
| --- | --- |
| Text preset | `Body` |
| Alignment | `Left` |

**`Product price` 클릭**:

| 필드 | 값 |
| --- | --- |
| Show sale price first | ✅ on |
| Show installments | off |
| Show tax info | off |
| Text preset | `Heading (Extra small)` |
| Alignment | `Left` |

#### 6.1.4.f Save

**클릭**: `Save`.

✅ **Checkpoint 6.1.4** — Preview:
- 헤더 영역에 좌측 "Pick the count that fits your story." (heading) + 우측 "View all" (텍스트 링크)
- 그 아래 4 column grid 에 Solo / Duo / Trio / Memory Pack 4개 product card
- 각 카드 = image + title + price ($15.99 / $18.99 / $21.99 / $28.99 CAD)
- 모바일 viewport → 2 column grid

---

### 6.1.5 Why Everstory — Media with text section 추가

#### 6.1.5.a Featured collection 다음에 새 section 추가

**작업**:
1. 좌측 트리에서 `Featured collection` 과 `Footer` 사이를 호버.
2. `+ Add section` 클릭.
3. section picker 에서 **Media with text** 선택.

**확인**: 좌측 트리 `Featured collection` 다음에 `Media with text` 항목 추가. preview 에 default 이미지 + 텍스트 노출.

#### 6.1.5.b Section settings

**클릭**: 좌측 트리 `Media with text` 클릭.

| 필드 | 값 |
| --- | --- |
| Media position | `Left` |
| Media width | `50%` |
| Media height | `Medium` |
| Section width | `Page` |
| Color scheme | `Scheme 1` |
| Padding > Block start | `64` |
| Padding > Block end | `64` |

**Media** 영역:
| 필드 | 값 |
| --- | --- |
| Type | `Image` |
| Image | (Select image → 16:9 studio 이미지 업로드) |

#### 6.1.5.c 안의 default text block 정리

**확인**: 좌측 트리 `Media with text` 펼치면 안에 group / text 같은 default block 들이 있음. 구성은 이런 식:
```
▾ Media with text
    ▾ Group (caption 같은 이름 또는 그냥 column)
        Text             ← heading
        Text             ← body
        Button           ← (있을 수도 없을 수도)
```

> 정확한 default 구조는 Horizon 버전에 따라 다름. 핵심: 이 section 안에 text + button block 들을 정리해서 wireframe 의 카피 + 버튼 1개로 만든다.

**작업**:
1. 안의 첫 번째 text block 클릭 → Text 입력 칸:
   ```html
   <p>Why Everstory</p>
   ```
   - Text preset = `Body (Small)`, Case = `Uppercase`, Alignment = `Left`.

2. 두 번째 text block 클릭 → Text:
   ```html
   <h2>Made to keep, not to scroll past.</h2>
   ```
   - Text preset = `Heading (Medium)`, Alignment = `Left`.

3. 세 번째 text block 이 없으면 `+ Add block` → `Text` 추가:
   ```html
   <p>The sticker industry runs on automation. We do the part the algorithm gives up on — hair, ears, paws, the gap between fingers — by hand. Korean premium substrates. Toronto studio. Made to order.</p>
   ```
   - Text preset = `Body`, Alignment = `Left`.

4. Button block 이 없으면 `+ Add block` → `Button`. 있으면 그것 사용.
   | 필드 | 값 |
   | --- | --- |
   | Label | `Read our story` |
   | Link | `/pages/about-everstory-studio` |
   | Style | `Secondary` |
   | Width | `Fit content` |

**Block 순서** (위에서 아래):
1. Text — eyebrow
2. Text — heading
3. Text — body
4. Button

#### 6.1.5.d Save

**클릭**: `Save`.

✅ **Checkpoint 6.1.5** — Preview:
- Featured collection 다음에 새 section
- 왼쪽 절반: studio 이미지
- 오른쪽 절반: eyebrow + heading + body + button
- 모바일 → 이미지 위, 텍스트 아래로 stack

---

### 6.1.6 불필요한 default section 정리

> Horizon default index.json 에는 보통 hero + product-list 만 있어서 추가 section 없을 가능성 큼. 만약 `Featured blog posts`, `Newsletter signup`, `Contact form` 같은 default section 이 좌측 트리에 보이면:

**작업**:
1. 해당 section 호버 → 우측 끝의 `⋮` (kebab) 메뉴 클릭.
2. `Hide section` (다시 보이게 할 수 있음) 또는 `Remove section` (완전 삭제) 선택.
3. MVP 는 블로그 / 추가 contact 미운영 → 삭제 권장.

**클릭**: `Save`.

✅ **Checkpoint 6.1.6** — Home 페이지 좌측 트리에 6 항목만:
1. Header (group)
2. Hero
3. Section (How it works)
4. Featured collection
5. Media with text (Why Everstory)
6. Footer (group)

---

### 6.1.7 Home 페이지 최종 검증

#### 6.1.7.a 데스크톱 미리보기

**클릭**: 우측 상단 viewport 토글에서 💻 (데스크톱) 선택.

**확인**: 위에서 아래로 다음 6 영역:
1. Header — announcement bar + logo + menu + utilities
2. Hero — 이미지 위 흰색 텍스트 + 2 버튼
3. How it works — eyebrow + heading + 3 column
4. Featured collection — heading + view all + 4 product card
5. Why Everstory — image + text + button
6. Footer — jumbo + 4 column + social + copyright

#### 6.1.7.b 모바일 미리보기

**클릭**: 우측 상단 viewport 토글에서 📱 (모바일, 375px) 선택.

**확인**:
- Header 가 햄버거 메뉴로 collapse
- Hero 이미지 위 텍스트 가독성 OK (overlay 가 충분히 어두운지)
- How it works 3 column 이 세로로 stack
- Featured collection 이 2 column grid
- Why Everstory 가 이미지 위 / 텍스트 아래
- Footer 가 accordion 으로 collapse

#### 6.1.7.c Anchor 동작 확인

**작업**:
1. 데스크톱 viewport 로 돌아가서 hero 의 "How it works" 버튼 클릭.
2. preview 가 How it works section 위치로 스크롤.

> Theme Editor 의 preview 에서 anchor 가 100% 작동하지 않을 수 있음 (preview 는 iframe 안). 의심되면 우측 상단 `…` → `Preview` 또는 storefront URL 직접 열어서 확인.

✅ **Checkpoint 6.1.7** — Home 페이지 완료. 6 section 모두 정상.

---

## Step 6.2 — Collection 페이지

### 6.2.0 Collection page 진입

**클릭 1**: 좌측 sidebar 상단 페이지 selector.

**클릭 2**: dropdown 에서 `Collections` → `Photo Sheets` 선택.

> `Collections` 그룹 아래 Photo Sheets 가 보여야 함. 안 보이면 Batch 3 에서 collection 을 만들었는지 확인.

**확인**: 가운데 preview 가 collection 페이지로 바뀜. 좌측 트리에 default 구성:
```
▾ Header
▾ Template
    Collection heading
    Default product grid (또는 main-collection)
▾ Footer
```

✅ **Checkpoint 6.2.0** — Collection 페이지 진입 완료.

---

### 6.2.1 Collection heading section 변경

#### 6.2.1.a Collection heading 클릭

**클릭**: 좌측 트리 `Collection heading` 클릭.

**확인**: 우측 패널 settings, 좌측에 안의 blocks 펼쳐짐:
```
▾ Collection heading
    Title              ← text block
    Description        ← text block
```

#### 6.2.1.b Section settings

| 필드 | 값 |
| --- | --- |
| Content direction | `Vertical` |
| Vertical on mobile | ✅ on |
| Alignment | `Left` |
| Gap | `12` |
| Section width | `Page` |
| Color scheme | `Scheme 1` |
| Padding > Block start | `48` |
| Padding > Block end | `48` |

#### 6.2.1.c Title 위에 Eyebrow text block 추가

**작업**:
1. 좌측 트리 Collection heading 안에 `+ Add block` → `Text`.
2. 새 Text block 의 Text 입력 칸:
   ```html
   <p>Photo sheets</p>
   ```
3. settings:
   - Text preset = `Body (Small)`
   - Case = `Uppercase`
   - Alignment = `Left`
4. drag handle 로 Title 위로 옮김.

#### 6.2.1.d Title text block 변경

**클릭**: `Title` block.

**Text 입력**:
```html
<h1>Photo sheets by count.</h1>
```

| 필드 | 값 |
| --- | --- |
| Text preset | `Heading (Extra large)` |
| Alignment | `Left` |

> 또는 collection title 자동 사용: `<h1>{{ closest.collection.title }}</h1>`.

#### 6.2.1.e Description text block 변경

**클릭**: `Description` block.

**Text 입력**:
```html
<p>A5 die-cut sheets, hand cut at our Toronto studio. Pick the count that fits your story — from a single portrait to a four-photo keepsake set.</p>
```

| 필드 | 값 |
| --- | --- |
| Text preset | `Body` |
| Max width | `Normal` |
| Alignment | `Left` |

#### 6.2.1.f Save

**클릭**: `Save`.

✅ **Checkpoint 6.2.1** — Collection heading 영역에 위에서 아래로:
- "PHOTO SHEETS" (작은 uppercase)
- "Photo sheets by count." (H1)
- 본문 1줄

---

### 6.2.2 main-collection (Default product grid) 설정

#### 6.2.2.a main-collection 클릭

**클릭**: 좌측 트리에서 `Default product grid` (또는 `main-collection`) 클릭.

**확인**: 안에 static blocks:
```
▾ Default product grid
    Filtering and sorting   ← static
    Product card           ← static
```

#### 6.2.2.b Section settings

| 필드 | 값 |
| --- | --- |
| Type | `Grid` |
| Card size | `Medium` |
| Mobile card size | `Small` |
| Width | `Page` |
| Full width on mobile | ✅ on |
| Columns gap horizontal | `16` |
| Columns gap vertical | `24` |
| Color scheme | `Scheme 1` |
| Padding > Block start | `0` |
| Padding > Block end | `32` |

#### 6.2.2.c Filtering and sorting block 설정

**클릭**: 좌측 트리 `Filtering and sorting` block.

| 필드 | 값 |
| --- | --- |
| Filters | ✅ on |
| Filter style | `Horizontal` |
| Filter width | `Page` (centered) |
| Sorting | ✅ on |
| Grid layout control | ✅ on |
| Text labels for swatches | off |
| Text labels for applied filters | off |
| Padding > Block start | `8` |
| Padding > Block end | `8` |

> 4개 상품밖에 없어서 filter 가 의미 작지만, 컬러 swatch / 사이즈 variant 가 있어서 filter UI 가 노출되긴 함.

#### 6.2.2.d Product card block 설정

**클릭**: 좌측 트리 `Product card` block.

**확인**: 안에 sub-block 3개:
```
▾ Product card
    Product card media (Card gallery)
    Product title
    Product price
```

`Card gallery` (또는 `Product card media`) 클릭:
| 필드 | 값 |
| --- | --- |
| Image ratio | `Adapt` |

`Product title` 클릭:
| 필드 | 값 |
| --- | --- |
| Text preset | `Body` |
| Alignment | `Left` |

`Product price` 클릭:
| 필드 | 값 |
| --- | --- |
| Show sale price first | ✅ on |
| Show installments | off |
| Text preset | `Heading (Extra small)` |
| Alignment | `Left` |

#### 6.2.2.e Save

**클릭**: `Save`.

✅ **Checkpoint 6.2.2** — Collection heading 아래:
- 가로 filter bar (Filter ▾ · Sort ▾ · grid density 토글)
- 4 column grid (또는 medium card size 라 columns 자동 결정) 에 4 product card
- 각 카드 = image + title + price

---

### 6.2.3 Sizing/materials guide CTA section 추가

#### 6.2.3.a main-collection 다음에 새 section 추가

**작업**:
1. 좌측 트리에서 main-collection 과 Footer 사이 호버 → `+ Add section`.
2. **Media with text** 선택.

#### 6.2.3.b Section settings

| 필드 | 값 |
| --- | --- |
| Media position | `Right` |
| Media width | `50%` |
| Media height | `Medium` |
| Section width | `Page` |
| Color scheme | `Scheme 1` |
| Padding > Block start | `64` |
| Padding > Block end | `64` |

**Media**:
| 필드 | 값 |
| --- | --- |
| Type | `Image` |
| Image | (16:9 sheet detail 이미지 업로드) |

#### 6.2.3.c 안의 text blocks 정리

**Eyebrow text block** (없으면 `+ Add block` → `Text` 로 생성):
```html
<p>Not sure which to pick?</p>
```
- Text preset = `Body (Small)`, Case = `Uppercase`, Alignment = `Left`.

**Heading text block**:
```html
<h2>Sizing &amp; materials guide.</h2>
```
- Text preset = `Heading (Medium)`, Alignment = `Left`.

**Body text block**:
```html
<p>XS through XXL plus Mixed. Four Korean substrates with LAMat-AF / Oraguard lamination. Pick by surface, by use, by tone.</p>
```
- Text preset = `Body`, Alignment = `Left`.

#### 6.2.3.d Button 1 추가 (Sizing guide)

**작업**: `+ Add block` → `Button`.

| 필드 | 값 |
| --- | --- |
| Label | `Sizing guide` |
| Link | `/pages/sticker-size-guide` |
| Style | `Secondary` |
| Width | `Fit content` |

#### 6.2.3.e Button 2 추가 (Materials guide)

**작업**: `+ Add block` → `Button`.

| 필드 | 값 |
| --- | --- |
| Label | `Materials guide` |
| Link | `/pages/material-guide` |
| Style | `Secondary` |
| Width | `Fit content` |

> Page handle (`sticker-size-guide`, `material-guide`) 은 admin → Online Store → Pages 에서 확인. Batch 3 의 page handle 과 정확히 일치해야 함. 다르면 link 가 404.

**Block 순서**:
1. Text — eyebrow
2. Text — heading
3. Text — body
4. Button — Sizing guide
5. Button — Materials guide

#### 6.2.3.f Save

**클릭**: `Save`.

✅ **Checkpoint 6.2.3** — Collection 페이지 product grid 다음에:
- 왼쪽: text + 2 버튼
- 오른쪽: image
- 모바일 → 이미지 위, 텍스트 아래

---

### 6.2.4 Collection 페이지 최종 검증

#### 6.2.4.a 데스크톱

**확인**: 위에서 아래로 5 영역:
1. Header
2. Collection heading (eyebrow + H1 + description)
3. main-collection (filter bar + 4 product card)
4. Sizing/materials CTA (text + 2 buttons + image)
5. Footer

#### 6.2.4.b 모바일

**확인**:
- Filter bar 가 ☰ 형태 또는 가로 collapse
- Product card 가 1 또는 2 column stack
- Sizing CTA 가 이미지 위 / 텍스트 아래

#### 6.2.4.c 링크 체크

각 product card 클릭 → product page 이동 정상.
"Sizing guide" / "Materials guide" 버튼 클릭 → 해당 page 이동 정상.

✅ **Checkpoint 6.2.4** — Collection 페이지 완료.

---

## ✅ Batch 6 종료 검증 체크리스트

### Home page
- [ ] Hero — 이미지 + eyebrow + H1 + paragraph + Primary "Shop the lookbook" + Secondary "How it works"
- [ ] How it works — anchor (`#how-it-works`) + eyebrow + heading + 3 column (image + heading + body 각 step)
- [ ] Featured collection — Photo Sheets, 4 products, 4 columns desktop / 2 columns mobile, View all 링크 동작
- [ ] Why Everstory — image + text + Read our story 버튼
- [ ] 불필요한 default section 모두 제거 또는 hide
- [ ] Hero 의 "How it works" 버튼 → How it works section 으로 스크롤

### Collection page
- [ ] Collection heading — eyebrow + H1 + description
- [ ] main-collection — Filter / Sort / Grid density / 4 product card grid, 가격 정상 ($15.99 / $18.99 / $21.99 / $28.99 CAD)
- [ ] Sizing/materials CTA — image + text + 2 buttons

### 공통
- [ ] 데스크톱 + 태블릿 + 모바일 viewport 모두 깨짐 없음
- [ ] 모든 link 가 올바른 URL 로 이동
- [ ] Save 후 GitHub bot 자동 commit 확인 (몇 분 후 `github.com/ccho21/everstory-theme` 의 commits 페이지에서 `Update from Shopify for theme everstory-theme/main` 보이면 OK)

---

## 🛟 자주 막히는 지점

| 증상 | 원인 / 해결 |
| --- | --- |
| `+ Add section` 버튼이 안 보임 | section 사이를 정확히 호버해야 함. section 위/아래 가장자리에 마우스. |
| Custom Liquid block 이 picker 에 없음 | 카테고리 펼치기 (Layout / Custom / Apps 등). 모든 카테고리 봐도 없으면 검색 칸에 `liquid` 입력. |
| Heading 이 너무 크게 표시 | Text preset 이 `Heading (Large)` 또는 `Heading (Extra large)` — 한 단계 내림. 아니면 inline 으로 `<h2 style="font-size:2rem;">...` 처리. |
| 모바일에서 3 column 이 가로로 끼임 | row group 의 `Vertical on mobile` ✅ on 인지 확인. |
| Anchor 버튼 클릭해도 스크롤 안 됨 | (1) link 가 정확히 `#how-it-works` 인지 (대소문자, 하이픈), (2) Custom Liquid block 의 `id` 와 일치하는지, (3) preview 가 아닌 실제 storefront URL 에서 테스트. |
| Image ratio 가 `Adapt` 인데도 모든 카드가 늘어남 | 4개 product 의 첫 번째 이미지가 다른 비율이면 `Adapt` 가 첫 이미지 기준. `Square` 로 강제. |
| Save 했는데 GitHub commit 이 안 옴 | Shopify 쪽 GitHub integration 의 token 만료 가능. admin → Online Store → Themes → Live theme `…` → `Manage GitHub` 확인. |
| Button link 칸에 anchor 입력했는데 자동으로 검색 결과로 바뀜 | 입력 후 Enter 또는 입력 칸 밖 클릭 — 그러면 raw 값으로 저장됨. dropdown 선택 강제 아님. |

---

## 다음 batch

→ **`07_product_template.md`** — Product 템플릿 (Solo PDP 기준 + 4 SKU 적용 + Easify app block 위치 + 추천 상품)
