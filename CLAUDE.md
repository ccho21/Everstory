# Everstory 스티커 제작 파이프라인

Adobe CC 2026 기반 스티커 시트 자동화. PSD 누끼/실루엣 → A5 그리드 배치 + 칼선 분리 → ET-8550 출력 + Summa D75 컷팅.

## MVP

첫 주력 상품은 **A5 커스텀 사진 다이컷 스티커 시트**. 대표 모드는 **Name Included** (사진 + 상단 헤더에 고객/주문 정보). 운영 메인은 **`Everstory_mixed.jsx`** (v23 multi-sheet, v2 브랜드 템플릿). 단일·전 사이즈는 한 시트 정책 — A5 한 시트만 생성, 넘치는 입력은 사이즈별 디자인 cap (auto-cap, 시트 물리 슬롯 수 기준) 으로 입력 단계에서 제한. **Package 만 다중 시트** — 넘치는 분을 버리지 않고 다음 시트로 배분한다 (기본 2장). 칼선 여백 (0/0.5/1/2mm) 은 고객 옵션이 아니라 내부 제작 옵션.

상품/운영 정책은 [docs/business/business.md](docs/business/business.md).

## 디렉토리 구조

```
.
├── Everstory_mixed.jsx            # 운영 메인 (v23 multi-sheet). 단일/Package/전 사이즈, v2 브랜드 템플릿용, info > header > header_right TextFrame 주입
├── sim/                           # node 시뮬 하니스 — .jsx 에서 패커/배분층을 추출해 배치를 미리 검증 (sim/README.md)
├── Everstory_CleanOffsetPath.jsx  # offset/compound path 내부 조각 제거 유틸
├── SHOPIFY_ORDER_DOWNLOAD.command   # Phase -1 런처 — 더블클릭하면 브라우저에 주문받기 화면. 이름은 바꿔도 됨
├── scripts/order_intake/          # Phase -1 — Shopify 주문 사진 다운로드·리네임 (scripts/order_intake/README.md)
├── plugins/everstory_save/        # Phase A — UXP 패널 플러그인 (PS)
├── templates/
│   └── template_cutout_v2.ait     # v2 브랜드 템플릿 (운영 메인). info > body 142×175mm + info > header > header_right (TextFrame, 값만 주입)
├── assets/                        # 브랜드 로고·QR·템플릿 미리보기 PNG
├── projects/{고객명 주문번호}/     # 예: `Naekyung Seong EVS-1007`. 구 폴더는 이름만 (`하린`) — 혼재 정상
│   ├── _order.json                # 주문 매니페스트 — 고객·SKU·옵션·사진 원본URL + `job`(제작 잡티켓) + `shipping`(배송지). 인테이크가 생성, Phase B 가 읽어 다이얼로그를 채움. **개인정보 · gitignore**
│   ├── 01_original/               # 원본 PSD/JPG/TIF
│   ├── 02_cutout/                 # Phase A 산출 (_clean.psd + _sil.png 페어)
│   │   └── _cutcache/             # 칼선 트레이스 디스크 캐시 (.evcut). 지워도 안전 — 다시 트레이스함
│   └── 03_output/                 # Phase B 산출 (.ai 시트)
└── docs/
    ├── business/                  # 사업·전략
    └── shopify/                   # 웹 스토어 — 어드민·카피·정책
```

## 파이프라인 요약

0. **Phase -1 — 주문 인테이크 · 주문 보드** (`scripts/order_intake/`): Shopify 주문 JSON → 프로젝트 폴더 생성 + Easify 사진 다운로드 + `{NN}_{BUCKET}_{원본명}` 리네임 + `_order.json`. 같은 화면이 **주문 보드**다 — 주문별 진행(받음 / 누끼 / 시트)을 **폴더만 보고** 표시한다 (별도 상태 파일 없음, 2초마다 네트워크 없이 자동 갱신). 인쇄·발송은 디스크에 흔적이 없어 표시하지 않는다. **Easify CDN(`cdn.tigren.com`)은 업로드 90일 후 사진을 삭제한다** — 이 단계가 유일한 아카이브 경로다.
1. **Phase 0 — 수동 (Photoshop)**: `layers[0]` = 실루엣, `layers[1..N]` = 누끼+보정.
2. **Phase A — UXP 패널** (`plugins/everstory_save/`): `_sil.png` + `_clean.psd` 저장, longest 1800px. `자동` 버튼이 원본 파일명의 `_BIG/_MED/_SML` 을 읽어 그대로 출력명에 넣는다 — 버킷은 주문에서 온 값이라 손으로 다시 정하지 않는다. 버킷이 없으면 멈추고 수동 버튼을 요구한다.
3. **Phase B — Illustrator** (`Everstory_mixed.jsx`): 폴더 → 페어 ListBox multiselect → 사이즈 (XS/S/M/L/XL/XXL · Package · 전 사이즈) → 시트 생성 → `03_output/` 자동 saveAs. 다이얼로그 5단계 (폴더 / 고객 정보 / 페어 / 사이즈+시트수 / 칼선 여백) — **고객 이름·주문번호·재질·사이즈·시트수·스티커 이름은 `_order.json` 의 `job` 블록에서 자동으로 채워지고 운영자는 확인만 한다** (SKU 해석은 인테이크가 한 번만 한다 — `job` 이 없는 구 매니페스트는 스크립트가 직접 해석하고, `intake.py --backfill-job` 으로 채울 수 있다). 받는 사람이 주문자와 다르면 (선물) 경고를 띄우되 헤더 이름은 자동으로 바꾸지 않는다. 값이 한 개로 안 좁혀지면 (매니페스트 없음, line item 마다 재질 다름 등) 그 칸은 기본값으로 두고 다이얼로그 상단에 이유를 띄운다 — 추측하지 않는다. **Package 입력은 파일명 `_BIG/_MED/_SML` 3버킷** — 정확한 인치는 스크립트가 시트 구성을 보고 배정한다 (레거시 6티어 토큰도 계속 읽음). Shopify `Mixed` 옵션 주문은 **전 사이즈 모드로 제작**.

## 고정 컨벤션 (변경 시 파이프라인 깨짐)

- **AI 레이어**: `PrintData` (raster), `KissCut` (cutline), `info` (템플릿 디자인). z-order 위→아래 = `KissCut` → `info` → `PrintData` (+ trace 중 hidden `TraceStash` 임시 레이어).
- **TextFrame (template_cutout_v2.ait)**: `info > header > header_right` (필수, **TextFrame** — PathItem 아님). 폰트/사이즈/우측 정렬은 .ait 가 보유, 스크립트는 `.contents` 만 inplace 교체.
- **PathItem (template_cutout_v2.ait)**: `info > body` (사진 pack 영역, 142×175mm, 필수).
- **Spot color**: `CutContour` — M=100, SPOT (Summa/Roland 표준).
- **파일명**: 주문 인테이크 산출 `01_original/{NN}_{TOKEN}_{원본명}.{ext}`. 토큰은 Package 면 버킷(`01_BIG_IMG_6425.jpg`, 속성 `Big/Medium/Small print` 에서), 그 외 상품이면 티어(`01_XS_IMG_1242.jpg`, SKU `EVS-FACE-19-WM` 에서). `Mixed` 는 전 사이즈 모드라 토큰 없음. 이어서 `01_original/cute_pet.psd` → `02_cutout/{folderName}_NN_clean.psd` + `{folderName}_NN_sil.png` (예: `로운_01_clean.psd`, `로운_01_sil.png`) → `03_output/{YYYYMMDD_HHMMSS}_1in_sheet01.ai` (Package `PKG` · 전 사이즈 `ALL` 태그). 다중 시트는 같은 timestamp prefix 에 `_sheet01`, `_sheet02` … 로 이어진다.
- **폴더명**: 영어 (`01_original` 등) — macOS NFD vs JS NFC 비교 실패 회피.

## 작업 원칙

- **방어 코드 추가 금지**: RGB 강제 변환, face crop, 빈 PNG 검증, 클립보드 경합 처리 등은 추가하지 않음. 사용자가 입력·환경을 수동 통제.
- **Phase A 액션 호출 없음**: 레이어 visibility 토글 + 저장만. Select Subject / Levels 같은 PS 액션 호출 안 함.
- **외곽선 그대로 사용**: offset/simplify 는 v4 에서 제거. cutline 품질은 Image Trace 파라미터로만 조정. cutline offset/smooth 는 수동 작업 (스크립트는 1mm/2mm 만큼 이미지 inset 만 함).
- **Make Work Path / SVG 경로 명시적 기각**: noise/분리 패스 문제로.
- **AI 자동화는 ExtendScript** (`.jsx` + DOM + `executeMenuCommand`), **PS 자동화는 UXP** (`.js` + batchPlay).

## 하드웨어

- **프린터**: Epson ET-8550 (염료 잉크)
- **컷터**: Summa D75 — CutContour 스폿 인식, 노드 500-1500개 선호 (Image Trace 2.0px tolerance 기준)

## 문서 인덱스

각 디렉토리는 역할로 분리한다 — **business**: 사업·전략 / **shopify**: 웹 스토어 운영 문서 (어드민·카피·정책).

- [**비즈니스**](docs/business/) — 사업·전략 (의존 계층: Fact → Plan → Open)
  - [products.md](docs/business/products.md) — Layer 1 Fact. Launch SKU·Package 규칙·사이즈·가격·사진 QC (상품 SOT)
  - [expenses.md](docs/business/expenses.md) — Layer 1 Fact. 영수증·인보이스·운임·구독 raw (비용 SOT)
  - [business.md](docs/business/business.md) — Layer 2 Plan. 사업 정의·원가/마진 모델·채널·배송·런칭 목표. raw 는 products/expenses 인용
  - [pending.md](docs/business/pending.md) — Layer 3 Open. 미확정·측정·결정 보류 항목 SOT
  - [plan.md](docs/business/plan.md) — Layer 0 Meta. 문서 목적·중요도·계층
- [**구현**](plugins/everstory_save/) — Phase A UXP 패널 플러그인 설치/사용
- [**Shopify**](docs/shopify/) — 웹 스토어
  - [plan.md](docs/shopify/plan.md) — Shopify 문서 목적·중요도·정리 계획
  - **셋업·어드민**
    - [settings_checklist.md](docs/shopify/settings_checklist.md) — 1A–1J 설정 체크리스트와 통합 smoke test
  - **카피·콘텐츠**
    - [pages_copy.md](docs/shopify/pages_copy.md) — About/FAQ/가이드/Contact 페이지 카피
    - [product_descriptions.md](docs/shopify/product_descriptions.md) — 운영 상품 설명
    - [footer_copy.md](docs/shopify/footer_copy.md) — 한국어 footer 카피
    - [photo_shotlist.md](docs/shopify/photo_shotlist.md) — 촬영 체크리스트
  - **정책**
    - [policies.md](docs/shopify/policies.md) — 환불/배송 정책 본문
