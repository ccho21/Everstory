# Batch 5 — Theme upload + Global (Header / Footer)

이 문서로 **Horizon 테마를 스토어에 업로드**하고, **Header (announcement / 로고 / 메뉴 / utility) 와 Footer (4 column / email signup / social / copyright)** 를 wireframe 기준으로 셋업한다. 끝나면 모든 페이지가 일관된 헤더/푸터로 감싸진 상태가 된다.

- **소요 시간**: 약 30–60분 (테마 업로드 5–10분 + Header/Footer 20–45분)
- **이전 batch**: `04_easify_options.md`
- **다음 batch**: `06_home_collection.md` (Home + Collection 템플릿)
- **Wireframe 참조**:
  - [`../wireframes/home.html`](../wireframes/home.html) — header / footer 데스크톱 + 모바일

---

## 시작 전 점검

- [ ] Batch 3 종료 — Main menu / Footer · Shop / Footer · Help / Footer · Brand 4개 menu 가 admin 에 등록됨
- [ ] 로고 이미지 준비 (PNG, 투명 배경 권장, 최소 200px 폭)
- [ ] 본인 환경에서 horizon 테마가 어디에 있는지 확인:
  - 옵션 1: 로컬 디렉토리 `Shopify Theme/horizon/` (zip 또는 CLI 업로드 가능)
  - 옵션 2: Shopify Theme Store 에서 직접 설치
  - 옵션 3: 이미 스토어에 업로드되어 있음

---

## Step 5.1 — Horizon 테마 업로드

다음 3 옵션 중 본인 상황에 맞는 것 선택.

### 옵션 1 — Theme Store 에서 직접 설치 (가장 단순)

> Horizon 은 Shopify 공식 무료 테마. 변경 없이 vanilla 로 시작하면 이게 가장 깔끔.

[Action 5.1.1.a] admin → `Online Store` → `Themes`

[Action 5.1.1.b] 페이지 하단 **Theme library** 섹션 → `Visit Theme Store` 링크 클릭 → 새 탭에서 Theme Store 열림

[Action 5.1.1.c] Theme Store 에서 `Horizon` 검색 → Horizon 테마 페이지 진입

[Action 5.1.1.d] `Try theme` (무료 테마는 무료) → 설치할 스토어 선택 → `Add to theme library`

[Action 5.1.1.e] admin → Online Store → Themes 로 돌아옴 → **Theme library** 섹션에 `Horizon` 추가됨

[Checkpoint 5.1.1] ✅ Theme library 에 Horizon 표시. **현재 상태 = Unpublished** (다른 테마가 published 상태이거나 default Dawn 이 활성).

---

### 옵션 2 — 로컬 horizon 디렉토리를 zip 으로 업로드

> 사용자가 받은 `Shopify Theme/horizon/` 디렉토리를 그대로 업로드 (커스터마이징한 horizon 인 경우).

[Action 5.1.2.a] **로컬 zip 만들기**:

```bash
cd "/Users/heatherchung/Desktop/EVERSTORY/Shopify Theme"
zip -r horizon.zip horizon -x "horizon/.git/*" -x "horizon/.DS_Store" -x "*/.DS_Store"
```

> `.git` 폴더와 `.DS_Store` 는 zip 에서 제외 (Shopify 가 reject 함).

[Action 5.1.2.b] zip 파일 크기 확인 — Shopify 업로드 한도 50 MB. 보통 horizon 테마는 5–15 MB.

```bash
ls -lh "/Users/heatherchung/Desktop/EVERSTORY/Shopify Theme/horizon.zip"
```

[Action 5.1.2.c] admin → `Online Store` → `Themes` → **Theme library** → `Add theme` → `Upload zip file`

[Action 5.1.2.d] zip 파일 선택 → `Upload` → 처리 1–3분 대기

[Checkpoint 5.1.2] ✅ Theme library 에 새 테마 (`horizon` 또는 `Untitled-1`) 표시. Unpublished 상태.

---

### 옵션 3 — Shopify CLI 로 push (개발자 향상)

> Shopify CLI 는 코드 수정 시 즉시 push 가능 (zip 다시 만들 필요 없음). 추후 코드 변경 빈도 높으면 권장.

[Action 5.1.3.a] CLI 설치 (한 번만):

```bash
npm install -g @shopify/cli @shopify/theme
```

[Action 5.1.3.b] 로그인:

```bash
cd "/Users/heatherchung/Desktop/EVERSTORY/Shopify Theme/horizon"
shopify theme push --unpublished
```

[Action 5.1.3.c] 브라우저에서 스토어 인증 → CLI 가 새 unpublished theme 으로 push

[Checkpoint 5.1.3] ✅ Theme library 에 새 테마 표시.

---

## Step 5.2 — Theme Editor 진입

> ⚠️ **반드시 unpublished theme 에서 작업**. published theme 직접 수정 시 storefront 즉시 반영 (사고 위험).

[Action 5.2.a] admin → `Online Store` → `Themes` → **Theme library** 섹션에서 본인이 업로드한 Horizon 의 `Customize` 버튼 클릭

[Action 5.2.b] Theme Editor 진입. URL 이 `xxx.myshopify.com/admin/themes/{id}/editor`. 화면 구성:
- 좌측: section / block 트리
- 중앙: 미리보기
- 우측: 선택한 section / block 의 settings

[Checkpoint 5.2] ✅ Theme Editor 정상 진입. 좌측 트리에서 `Header`, `Template`, `Footer` 영역이 보임.

---

## Step 5.3 — Theme settings (high-level, 정확한 토큰은 별도)

> 색상 / 폰트 / 간격은 high-level 만 잡고, 정확한 토큰은 launch 전 별도 단계에서 정밀 조정.

[Action 5.3.a] Theme Editor 좌측 하단 ⚙ 또는 `Theme settings` 클릭

[Action 5.3.b] **Logo / Brand assets**:
- Logo → 준비된 로고 이미지 업로드
- Logo width → 80–140 px (모바일에서 너무 크지 않게)
- Favicon → 32×32 px

[Action 5.3.c] **Colors / Color schemes**:
- Horizon 은 default 6개 color scheme (`scheme-1` ~ `scheme-6`) 제공
- MVP 는 default 유지, launch 전 색상 토큰 정밀 조정

[Action 5.3.d] **Typography**:
- Default 유지. 폰트 결정 후 별도 조정.

[Action 5.3.e] `Save`

[Checkpoint 5.3] ✅ 로고 표시. 이후 모든 페이지 미리보기에 로고 노출.

---

## Step 5.4 — Header group 셋업

**경로**: Theme Editor 좌측 트리 → `Header` 그룹 클릭

> Horizon Header group 은 default 로 다음 2개 section 포함:
> - `Announcement bar` (header-announcements)
> - `Header` (header section)

### 5.4.1 Announcement bar

[Action 5.4.1.a] 좌측 트리에서 `Announcement bar` 클릭 → 펼치면 `Announcement` block 1개

[Action 5.4.1.b] `Announcement` block 클릭 → 우측 settings:
- Text → `MADE TO KEEP · Free Ontario shipping`
- Link → 비움 (또는 `/collections/photo-sheets`)
- Font → default 또는 `Subheading`
- Font size → `0.75rem`
- Case → `none`

[Action 5.4.1.b 옵션] Announcement 가 여러 개 필요하면 `+ Add block` → `Announcement` 추가 → 텍스트별 입력 (slideshow 처럼 회전)

[Action 5.4.1.c] Announcement bar section settings (block 이 아니라 section 선택):
- Color scheme → `scheme-1` (default) 또는 brand 검정/흰 대비 scheme
- Section width → `page-width`
- Padding (block-start / block-end) → 15 / 15
- Speed (slideshow 사용 시) → 5

[Checkpoint 5.4.1] ✅ Announcement 텍스트 미리보기에 노출. wireframe 기준 한 줄 메시지.

---

### 5.4.2 Header section

[Action 5.4.2.a] 좌측 트리 `Header` 클릭 → 우측 settings 의 핵심 항목:

**Layout**:
- Logo position → `left` (또는 `center`)
- Menu position → `left` (logo 가 left 면 menu 도 left, 또는 menu = `right`)
- Section width → `page-width`
- Section height → `standard`
- Enable sticky header → `always` (스크롤 시 header 고정)

**Search**:
- Show search → ✅ on
- Search position → `right`

**Country / Language selector**:
- Show country → ❌ off (single locale)
- Show language → ❌ off (single locale)

> wireframe 의 utility = 검색 / 계정 / 카트 3개. Horizon header section 은 default 로 search / cart / account 자동 노출. country / language 는 끄기.

**Color scheme**:
- Color scheme top → `scheme-1`
- Enable transparent header on home → ❌ off (MVP 는 단순)

[Action 5.4.2.b] **Header logo block** (header-logo, static):
- Hide logo on home page → ❌ off

[Action 5.4.2.c] **Header menu block** (header-menu, static):
- Menu → `Main menu` (Batch 3 에서 만든 menu)
- Menu style → `Default` 또는 `Featured products` (취향)
- Type font primary size → `0.875rem`

[Checkpoint 5.4.2] ✅ Header 미리보기에 logo + Shop/About/FAQ 메뉴 + 검색 / 계정 / 카트 아이콘 표시. country / language 아이콘 없음.

---

## Step 5.5 — Footer group 셋업

**경로**: Theme Editor 좌측 트리 → `Footer` 그룹 클릭

> Horizon Footer group default = `Footer` section + `Footer utilities` section. 기존 default content (Email list 텍스트) 정리하고 wireframe 기준으로 재구성.

### 5.5.1 기존 default 정리

[Action 5.5.1.a] `Footer` section 펼치기 → 기본 block 들 (`Group · Join our email list`, `Email signup`) 그대로 두고 텍스트만 변경

> Horizon footer 는 default 로 group + email signup 2개 block 만. wireframe 의 4 column (Shop / Help / Brand / Newsletter) 구조를 위해 group / menu / text block 추가.

---

### 5.5.2 Jumbo tagline 추가

[Action 5.5.2.a] `Footer` section 안에서 `+ Add block` → **Text** 선택 (또는 **Heading**)

[Action 5.5.2.b] Text block settings:
- Text → `<h2>MADE TO KEEP &nbsp;|&nbsp; MOMENTS THAT MATTER</h2>`
- Type preset → `Display` 또는 `h1` (가장 큰 사이즈)
- Alignment → `center`
- Font size → 큰 사이즈 (default 또는 `2.5rem` 이상)
- Color → 본문 색

[Action 5.5.2.c] Text block 을 footer 맨 위로 드래그

[Checkpoint 5.5.2] ✅ Footer 미리보기 맨 위에 큰 jumbo 텍스트 노출.

---

### 5.5.3 4 column group 추가

> Wireframe footer 는 4 column (Shop / Help / Brand / Newsletter). Horizon 은 기본 group 1개만 있어서 4 column 을 만들려면 outer group (row 방향) 안에 inner group 4개 (column 방향) 또는 menu block 4개 직접 배치.

가장 단순한 방법:

[Action 5.5.3.a] `+ Add block` → **Group** 선택. 새 group 의 settings:
- Content direction → `row` (가로)
- Vertical on mobile → ✅ on (모바일에서 세로로 stack)
- Gap → `32`
- Width → `fill`

[Action 5.5.3.b] 새 row group 안에 `+ Add block` 4번:

#### Column 1 — Shop
- **Group** (column 방향) 추가:
  - Content direction → `column`
  - Gap → `8`
- 그 안에:
  - **Text** block → `<h4>Shop</h4>`
  - **Menu** block (또는 `Footer menu`) → Menu = `Footer · Shop`

#### Column 2 — Help
- 같은 방식. Heading = `Help`, Menu = `Footer · Help`

#### Column 3 — Brand
- Heading = `Brand`, Menu = `Footer · Brand`

#### Column 4 — Newsletter
- Heading = `Newsletter`
- **Text** block → `<p>Get 10% off your first order.</p>`
- **Email signup** block (기존 default email signup 을 여기로 드래그 또는 새로 추가)
  - Heading → 비움 (위 Text block 이 헤딩 역할)
  - Label / button → `Sign up`

> Horizon Theme Editor 의 menu block 이 **footer-utilities** section 에만 있고 일반 footer section 에 없으면, **Custom Liquid** block 또는 다른 방식 필요. 그 경우 막혔다고 알려주면 sections/blocks 코드 보고 안내.

[Action 5.5.3.c] 모든 column 추가 후 row group 의 horizontal alignment / spacing 조정.

[Checkpoint 5.5.3] ✅ Footer 미리보기에 4 column 표시 (데스크톱). 모바일 미리보기 (좌측 모바일 토글) 에서 세로 stack.

---

### 5.5.4 Social links

[Action 5.5.4.a] `Footer utilities` section → `Social links` block 클릭

[Action 5.5.4.b] Settings — 사용하는 채널만 URL 입력:
- Instagram URL → 본인 IG 계정
- Facebook URL → 비움 (안 쓰면 비워두면 자동으로 안 노출)
- TikTok URL → 비움
- YouTube URL → 비움
- Twitter URL → 비움

> KakaoTalk 은 Horizon social-links 가 지원하지 않음. wireframe 의 KT 아이콘은 MVP 에서 생략 (또는 별도 custom snippet, Batch 9 이후).

[Checkpoint 5.5.4] ✅ Footer utilities 에 Instagram 아이콘 노출. 다른 채널 아이콘 없음.

---

### 5.5.5 Footer copyright + policy list

[Action 5.5.5.a] `Footer utilities` section → `Footer copyright` block:
- Show "Powered by Shopify" → ❌ off
- Font size → `0.75rem`
- Case → `none`

[Action 5.5.5.b] `Footer policy list` block:
- Font size → `0.75rem`
- Case → `none`

> Footer policy list 는 1I 에서 등록한 4개 정책 (Refund / Shipping / Privacy / Terms) 자동 노출. 추가 작업 없음.

[Checkpoint 5.5.5] ✅ Footer 하단에 `© 2026 Everstory Studio` (또는 본인 store name) + 정책 4개 링크 노출.

---

## Step 5.6 — Save + 미리보기 검증

[Action 5.6.a] Theme Editor 우측 상단 `Save` 클릭

[Action 5.6.b] 좌측 상단 페이지 선택 dropdown → `Home page` / `Product page` / `Collection page` / `Page` 등 다양한 페이지로 미리보기 확인 — 모든 페이지가 같은 header / footer 로 감싸짐

[Action 5.6.c] 우측 상단 데스크톱 / 태블릿 / 모바일 토글 → 모든 viewport 에서 깨지지 않는지 확인

[Checkpoint 5.6] ✅ Header (announcement + logo + menu + utility), Footer (jumbo + 4 column + social + copyright) 가 모든 미리보기 페이지에 일관되게 표시.

---

## Batch 5 종료 검증

다음 모두 ✅ 면 Batch 5 완료:

- [ ] **Step 5.1**: Horizon 테마 업로드, Unpublished 상태로 Theme library 에 존재
- [ ] **Step 5.2**: Theme Editor 진입 가능
- [ ] **Step 5.3**: 로고 표시, 색상/폰트는 default (정밀 조정 별도)
- [ ] **Step 5.4**: Announcement 텍스트 / 로고 / Main menu / 검색 · 계정 · 카트 utility 노출
- [ ] **Step 5.5**: Jumbo tagline / 4 column (Shop · Help · Brand · Newsletter) / Instagram / copyright / policy list
- [ ] **Step 5.6**: 데스크톱 + 모바일 미리보기 모두 정상

---

## 다음 batch

→ **`06_home_collection.md`** (Home + Collection 템플릿 조립 — hero / how-it-works / product-list / collection grid / sizing-materials guide)
