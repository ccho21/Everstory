# Everstory Studio 사업 전략 정리

마지막 업데이트: 2026-05-06

이 문서는 **Everstory Studio** 의 가격·채널·원가·셋업 시퀀스 등 *비즈니스 레이어* 결정을 한 곳에 모은다. 상품·생산 파이프라인 규칙은 `CLAUDE.md` 와 `docs/implementation/product_mvp.md` 를 본다. 결정이 바뀔 때마다 이 문서를 업데이트하고 하단 변경 이력에 한 줄 남긴다.

## 1. One-liner

**Everstory Studio 는 토론토 GTA + 한인 디아스포라를 위한 A5 커스텀 사진 다이컷 스티커 브랜드다** — 한국 프리미엄 substrate + 손 누끼 + 빠른 제작 (1영업일 안 작업 시작) + 자체 ExtendScript 운영 파이프라인으로 Etsy 자동/AI 셀러와 다른 카테고리에 포지셔닝.

외부 (지인·디자이너·세무사·투자자) 에게 한 문장으로 설명할 때 그대로 인용한다.

## 2. 사업 정체성

**Everstory Studio** (브랜드 표기는 Everstory 단독도 가능, 공식 사업체·도메인·법인 등록 시점 표기는 Everstory Studio) — 토론토 기반 커스텀 사진 다이컷 스티커 브랜드.

- 타겟: 토론토 GTA + 한인 디아스포라 + 펫맘/MZ 감성 굿즈 시장
- 차별화 포인트:
  1. Korean premium substrate (잉크젯 레이블 + LAMat-AF/Oraguard 라미네이션)
  2. 사람이 손으로 누끼 (펫 털·다리 사이까지) — Etsy 빅셀러는 자동/AI
  3. 빠른 제작 — 주문 후 1영업일 안 작업 시작, 2–5영업일 안 발송 (Etsy 자동/AI 셀러 평균 1–3주 대비 우위)
  4. 토론토 로컬 (며칠 내 도착, 픽업 가능)
  5. 자체 ExtendScript 파이프라인 (운영 효율 = 가격 경쟁력)

→ Etsy 평균 셀러 ($18–25 CAD) 와 직접 비교 안 당하는 카테고리로 포지셔닝.

## 3. 상품 정의 — Shelf-style mix 기반

스티커 N개를 파는 게 아니라, **A5 시트 한 장 분량의 다이컷 면적**을 판다. bin packing 결과는 사진 비율과 사이즈 mix 에 따라 8–14개 사이로 변동.

**프레이밍**: "Guaranteed minimum mix + bonus"

> "1 large + 4 medium + 6 small = 11 stickers from your photo, plus bonus stickers in the leftover space"

**상품 모드 (현 운영)**:

| 모드 | 정의 | 운영 상태 |
|------|------|----------|
| **Name Included** | 사진 중심 + 상단 production header 에 고객 이름·주문 정보 (별도 이름 스티커 없음) | **대표 MVP 모드** — `Everstory_mixed.jsx` (NameIncluded v15 superset) |
| Mini Decor | 미니 데코 소량 추가 — 사진 보조 | 후순위 확장 |

**SKU 4종**:

| SKU | 정의 |
|------|------|
| Solo | 1 design, A5 시트, 사이즈 mix |
| Duo (Hero) | 2 designs, A5 시트 |
| Trio | 3 designs, A5 시트 |
| Memory Pack | 4+ designs, 2 시트 (한계비용 낮음, AOV 부스트) |

**MVP 제외**: 문구 스티커, PhotoStrip/인생네컷 배치 상품, 다중 시트 자동 분할.

(원천: `docs/implementation/product_mvp.md:15-35,76-80`)

## 4. 사이즈·재질·옵션

운영자가 `Everstory_mixed.jsx` 다이얼로그에서 직접 입력하는 항목들. 고객 표시 vs 내부 제작 옵션을 명확히 구분한다.

### 사이즈 (긴 변 기준 인치 6단계 + Mixed)

| 사이즈 | 인치 | mm | 디자인 cap (auto) |
|--------|------|------|-------------------|
| XS | 0.75" | 19.05 | 13 |
| **S (기본)** | **1"** | **25.4** | **7** |
| M | 1.25" | 31.75 | 5 |
| L | 1.5" | 38.1 | 3 |
| XL | 1.75" | 44.45 | 3 |
| XXL | 2.5" | 63.5 | 1 |
| Mixed | 2.5/1.75/1.25/1" 4 사이즈 | 혼합 | 1 |

디자인 cap = 시트당 디자인당 최소 4–5회 등장 보장 + uniform grid 슬롯 기준. 사이즈 변경 시 ListBox 선택이 cap 초과면 자동 trim.

### 재질 (고객 노출, 4종)

White / Pearl Grey / Silver / Gold — 모두 한국 프리미엄 잉크젯 레이블 + LAMat-AF/Oraguard 라미.

### 칼선 여백 (내부 제작 옵션, 고객 노출 X)

0 / 0.5 / **1** (기본) / 2 mm — 운영자가 사진에 따라 선택.

### 헤더 메타 (운영 메인 v2)

`info > header > header_right` TextFrame 에 우측 정렬 2줄 주입:

- line 1: `{N} photos · {sizeLetter} / {inch} / {cut}mm · {material}` — e.g., `7 photos · S / 1in / 0.5mm · White matte`
- line 2: `Name add-on · Order date {date}` — e.g., `Name add-on Yes · Order date 05 May 2026`

라벨/로고/푸터 (`Finish Matte`, 4-chip, QR 등) 는 `template_cutout_v2.ait` 의 정적 디자인. 고객명/주문번호는 다이얼로그 입력으로만 받고 파일명·메타에만 사용 (헤더에 직접 노출 X).

v1 (`Everstory_mixed.jsx`, 안정성 백업) 은 `info > header` PathItem 안에 6쌍 ORDER DETAIL grid (TYPE / SPEC / ORDER / MATERIAL / PHOTOS / DATE) 를 직접 그린다.

(원천: `Everstory_mixed_v2.jsx:639-660` (v2 inline), `Everstory_mixed.jsx:547-564` (v1 grid), `docs/implementation/packing_internals.md`, `assets/illustrator_template_*.png`)

## 5. 가격 구조 (CAD)

기본 원칙: **너 손에 떨어지는 net 을 기준으로 채널별 표시가 역산**.

| | Solo | Duo | Trio | Memory Pack |
|---|---|---|---|---|
| **Net** | $12.99 | $15.99 | $18.99 | $24.99 |
| **Shopify 표시가** | $15.99 | $18.99 | $21.99 | $28.99 |
| **Etsy 표시가** | $18.99 | $21.99 | $24.99 | $32.99 |
| **로컬 픽업** | $13.99 | $16.99 | $19.99 | $25.99 |

모두 *free shipping 포함* 표시. 첫 50건은 "Launch price" 명목으로 박아두고, 후기 쌓이면 +$3–5 인상 명분 확보.

## 6. 원가 구조

### 변동원가 (COGS) — 가격 결정 시 이것만 본다 (1 주문 = 1 Solo 시트 기준)

| 항목 | 단가 |
|------|------|
| 자재 (Korean substrate + 라미 + 잉크 + 한국 import 분할) | $1.45 |
| 포장 (rigid mailer + 백커 + 글라신 + thank-you 카드 + 브랜드 스티커) | $0.75 |
| 도메스틱 배송 (lettermail) | $2.00 |
| 장비 감가 (ET-8550 + Summa D75 + 컴퓨터/Adobe ÷ 3년 ÷ 1,000건) | $1.20 |
| 분실/재제작 버퍼 (lettermail 추적無, 2–3%) | $1.00 |
| **변동원가 소계** | **$6.40** |

### 고정 운영비 (OpEx) — 단가에 끼우지 않고 손익분기 계산에만 사용

| 항목 | 월 비용 |
|------|---------|
| Shopify Basic (yearly billing) | $29 |
| 도메인 분할 | $1.25 |
| Customily Personalizer (사진 업로드 앱) | $25 |
| Adobe CC | $40 |
| Claude / Codex | $30–60 |
| 인터넷 분할 (사업 30%) | $30 |
| **월 OpEx** | **$155–185** |

원칙: *볼륨에 비례하면 COGS, 비례하지 않으면 OpEx*. 구독료(Adobe·Claude·Codex)는 OpEx — 단가에 끼우면 매출 부진 시 단가 인상 → 더 안 팔림 → 죽음의 스파이럴.

## 7. 마진 시나리오 (Solo $12.99 net 기준)

| 시나리오 | 광고비 | 주문당 contribution |
|---------|--------|---------------------|
| 광고 없음 (오가닉, 한인 커뮤니티) | $0 | +$6.59 |
| 광고 $5/건 (Meta 평균) | $5 | +$1.59 |
| 광고 $8/건 (높은 CAC) | $8 | -$1.41 |

→ 인건비는 0 으로 잡음 (부업 컨텍스트). 인건비를 시간당 $30 로 제대로 잡으면 모든 시나리오가 적자가 되는데, 이건 부업 단계의 의식적 선택 — 마진이 산출물이 아니라 *워크플로우 검증·후기 축적·UGC 확보* 가 산출물.

**손익분기 (월 단위)**:

- 광고 0 모드: 월 23–28건이면 OpEx 커버
- 광고 $5/건 모드: 월 100건+ 필요

→ **첫 분기 목표: 월 22건** (광고 없이, 한인 커뮤니티·인스타 오가닉 중심)

## 8. 채널 전략

**Shopify 메인** — 인스타 우선이 아니라 Shopify 우선. 전문성 인지가 차별화의 일관성을 유지한다.

- **인스타**: 디스커버리 채널로만 사용. 모든 콘텐츠 → bio link → Shopify
- **Etsy**: 일단 보류. 첫 5–10건 후기 쌓인 후 추가 (USD 트래픽 보조)
- **로컬 픽업**: 한인 커뮤니티·KakaoTalk 그룹 대상

## 9. 6주 셋업 시퀀스

| 주차 | 작업 | 진행 |
|------|------|------|
| Week 1 | 도메인 + Shopify 가입 + Payments 활성화 + 테마 선택 | ☐ |
| Week 2 | 로고 + 샘플 시트 사진 + 상품 카피 | ☐ |
| Week 3 | SKU 4종 등록 + 가격 셋업 + Customily 사진 업로드 앱 | ☐ |
| Week 4 | About / Shipping / Refund / FAQ 페이지 | ☐ |
| Week 5 | Order tag 자동화 + 이메일 템플릿 + production calendar | ☐ |
| Week 6 | Soft launch (친구 5–10명) + 인스타 개설 + 한인 커뮤니티 첫 포스팅 + Meta 광고 $5–10/일 | ☐ |

진행 칸 표기: `☐` 대기 / `◐` 진행 중 / `✓` 완료. 사용자가 매주 직접 갱신.

## 10. 운영 파이프라인 요약

상세는 `CLAUDE.md` "파이프라인" 섹션 참조. 비즈니스 레이어 의사결정에 영향을 주는 핵심 흐름만 요약:

- **Phase 0 (수동 PS)**: 사용자가 PSD 에 두 레이어 직접 — `[0]` 실루엣, `[1..N]` 누끼 + 보정. 인건비의 핵심 비중 (11번 절 누끼 워크플로우 단축이 마진 레버).
- **Phase A (UXP `everstory_save` 패널)**: 레이어 visibility 토글 + 저장만 (자동화 액션 호출 없음). `_clean.psd` + `_sil.png` 페어 → `02_cutout/`.
- **Phase B+D (`Everstory_mixed.jsx`, Illustrator)**: 폴더 → 페어 ListBox multiselect → 단일 사이즈 (XS–XXL) 또는 Mixed → uniform grid 또는 zone packer → `03_output/{timestamp}_{sizeTag}_sheet01.ai` 자동 저장.
- **하드웨어**: Epson ET-8550 (염료 잉크) + Summa D75 (CutContour 스폿 인식, 노드 500–1500 선호).
- **컨벤션**: AI 레이어 `PrintData` (raster) / `KissCut` (cutline) / `info` (템플릿). 파일명 `01_original/{원본}.psd` → `02_cutout/{folderName}_NN_clean.psd` + `_sil.png` → `03_output/{YYYYMMDD_HHMMSS}_{sizeTag}_sheet01.ai`.

(원천: `CLAUDE.md` "파이프라인" / "고정 컨벤션" / "하드웨어" 섹션)

## 11. 핵심 워크플로우 결정

- **디테일 노트 + 빠른 작업**: Easify special instructions textarea 로 고객 디테일 (특정 얼굴 크롭 금지·선호 톤·강조 부분) 받음. 모크업 컨펌 단계 없이 1영업일 안 작업 시작. 사진 부적합 (저해상도 < 1500px / 심한 흐림) 시만 인쇄 전 이메일 재요청.
- **Bin packing 보장**: minRepeat 룰로 해결됨 — `Everstory_mixed.jsx` 가 디자인당 정확히 minRepeat 회 등장 강제 (`floor(slots / designCount)` 동적 + `MIN_REPEAT_OVERRIDE` lookup), leftover 0 일 때만 round-robin filler. Mixed 모드는 1디자인 + 19슬롯 (1.75×3+1.5×3+1.25×8+1×5, 1.25" 두 배 비중) 인치 통일 패턴.
- **누끼 워크플로우 단축**: 인건비를 30분/건으로 줄이는 게 마진의 진짜 레버 (PSD 액션·키보드 매크로·재구매 시 PSD 캐시).

## 12. 인정해야 할 trade-off

- 부업 시작 = 인건비 0 가정 — 의식적 선택
- 첫 50건 = 유료 R&D — 마진보다 데이터·후기·UGC 산출
- launch price → 후기 50개 후 인상 — 미리 박아둔 가격 인상 경로
- 자체 디자인 자산 부족 — Mini Decor 는 multi-photo 번들로 우회, 후일 일러스트 외주($150–400)로 본격화
- 트래픽은 직접 끌어와야 — Shopify 는 빈 가게. 한인 커뮤니티 + 인스타 오가닉 + Meta 광고 조합

## 13. 미해결 / 다음 결정 포인트

| 항목 | 상태 |
|------|------|
| 자재 #1 (LAMat-AF) 정확한 단가 | 미확정 — anysheet.co.kr 가격 확인 필요 |
| 라미네이션 워크플로우 — `CLAUDE.md` 반영 | 미반영 (모든 SKU 에 라미네이션 들어감) |
| Bin packing minimum guarantee 로직 | 구현 완료 (`Everstory_mixed.jsx` minRepeat) |
| 로고 / 브랜드 비주얼 정체성 | 미정 |
| 상품 사진 촬영 컨셉 | 미정 |
| 상품 카피 / About 페이지 | 미정 |
| HST/GST 등록 (연 매출 $30k 도달 시점 대비) | 추적 필요 |

## 변경 이력

- **2026-05-08** — 차별화 5축 #3 "모크업 승인 워크플로우" → **"빠른 제작"** (1영업일 안 작업 시작, 2–5영업일 안 발송) 으로 교체. Shopify 운영 워크플로우에서 모크업 컨펌 단계 제거 후속 동기화. 모크업 PDF export 미구현 항목 폐기. 11절 핵심 워크플로우의 "모크업 승인" → "디테일 노트 + 빠른 작업" 으로 재작성. One-liner (1) 동기화.
- **2026-05-07** — 토론토 표기 단일화 (Brampton 제거). Photo Only 모드 docs 전반에서 제거 (운영 코드 = Name Included 단일 출력 현실 반영). `design/` 디렉토리 도입 (`brand_identity.md` v1 + `tokens.json` legacy Grid.jsx 매직 넘버 추출 + `storefront.md` / `decisions.md` TODO). AGENTS.md 라우팅 단락 추가.
- **2026-05-06** — 1-13 절 재번호. 정식명 "Everstory Studio" 명시 (브랜드 표기는 Everstory 단독도 가능). One-liner (1) / 사이즈·재질·옵션 (4) / 운영 파이프라인 요약 (10) 신규 절 추가. 6주 셋업 시퀀스에 진행도 칸 추가. 상품 정의에 Photo Only / Name Included / Mini Decor 모드 표 보강. 11·13 절의 `AGENTS.md` 참조를 `CLAUDE.md` 로 통일.
- **2026-05-03** — 초기 버전. 가격 ($12.99 / $15.99 / $18.99 / $24.99 net) lock, Shopify 메인 채널 결정, 6주 셋업 시퀀스, COGS $6.40 lock.
