# Everstory 사업 전략 정리

마지막 업데이트: 2026-05-03

이 문서는 Everstory 의 가격·채널·원가·셋업 시퀀스 등 *비즈니스 레이어* 결정을 한 곳에 모은다. 상품·생산 파이프라인 규칙은 `AGENTS.md` 와 `docs/product_mvp_photo_sheet.md` 를 본다. 결정이 바뀔 때마다 이 문서를 업데이트하고 하단 변경 이력에 한 줄 남긴다.

## 1. 사업 정체성

**Everstory** — 토론토(Brampton) 기반 커스텀 사진 다이컷 스티커 브랜드.

- 타겟: 토론토 GTA + 한인 디아스포라 + 펫맘/MZ 감성 굿즈 시장
- 차별화 포인트:
  1. Korean premium substrate (잉크젯 레이블 + LAMat-AF/Oraguard 라미네이션)
  2. 사람이 손으로 누끼 (펫 털·다리 사이까지) — Etsy 빅셀러는 자동/AI
  3. 모크업 승인 워크플로우 (인쇄 전 PDF 컨펌)
  4. 토론토 로컬 (며칠 내 도착, 픽업 가능)
  5. 자체 ExtendScript 파이프라인 (운영 효율 = 가격 경쟁력)

→ Etsy 평균 셀러 ($18–25 CAD) 와 직접 비교 안 당하는 카테고리로 포지셔닝.

## 2. 상품 정의 — Shelf-style mix 기반

스티커 N개를 파는 게 아니라, **A5 시트 한 장 분량의 다이컷 면적**을 판다. bin packing 결과는 사진 비율과 사이즈 mix 에 따라 8–14개 사이로 변동.

**프레이밍**: "Guaranteed minimum mix + bonus"

> "1 large + 4 medium + 6 small = 11 stickers from your photo, plus bonus stickers in the leftover space"

**SKU 4종**:

| SKU | 정의 |
|------|------|
| Solo | 1 design, A5 시트, 사이즈 mix |
| Duo (Hero) | 2 designs, A5 시트 |
| Trio | 3 designs, A5 시트 |
| Memory Pack | 4+ designs, 2 시트 (한계비용 낮음, AOV 부스트) |

문구 스티커·PhotoStrip 은 MVP 범위 외. Mini Decor 는 후순위.

## 3. 가격 구조 (CAD)

기본 원칙: **너 손에 떨어지는 net 을 기준으로 채널별 표시가 역산**.

| | Solo | Duo | Trio | Memory Pack |
|---|---|---|---|---|
| **Net** | $12.99 | $15.99 | $18.99 | $24.99 |
| **Shopify 표시가** | $15.99 | $18.99 | $21.99 | $28.99 |
| **Etsy 표시가** | $18.99 | $21.99 | $24.99 | $32.99 |
| **로컬 픽업** | $13.99 | $16.99 | $19.99 | $25.99 |

모두 *free shipping 포함* 표시. 첫 50건은 "Launch price" 명목으로 박아두고, 후기 쌓이면 +$3–5 인상 명분 확보.

## 4. 원가 구조

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

## 5. 마진 시나리오 (Solo $12.99 net 기준)

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

## 6. 채널 전략

**Shopify 메인** — 인스타 우선이 아니라 Shopify 우선. 전문성 인지가 차별화의 일관성을 유지한다.

- **인스타**: 디스커버리 채널로만 사용. 모든 콘텐츠 → bio link → Shopify
- **Etsy**: 일단 보류. 첫 5–10건 후기 쌓인 후 추가 (USD 트래픽 보조)
- **로컬 픽업**: 한인 커뮤니티·KakaoTalk 그룹 대상

## 7. 6주 셋업 시퀀스

| 주차 | 작업 |
|------|------|
| Week 1 | 도메인 + Shopify 가입 + Payments 활성화 + 테마 선택 |
| Week 2 | 로고 + 샘플 시트 사진 + 상품 카피 |
| Week 3 | SKU 4종 등록 + 가격 셋업 + Customily 사진 업로드 앱 |
| Week 4 | About / Shipping / Refund / FAQ 페이지 |
| Week 5 | Order tag 자동화 + 이메일 템플릿 + production calendar |
| Week 6 | Soft launch (친구 5–10명) + 인스타 개설 + 한인 커뮤니티 첫 포스팅 + Meta 광고 $5–10/일 |

## 8. 핵심 워크플로우 결정

- **모크업 승인**: 모든 주문에 PDF 모크업 → 고객 승인 → 인쇄. `Everstory_mixed.jsx` 끝의 `_saveAi` 옆에 PDF export 추가 필요 (현재 .ai 만 자동 저장).
- **Bin packing 보장**: minRepeat 룰로 해결됨 — `Everstory_mixed.jsx` 가 디자인당 정확히 minRepeat 회 등장 강제 (`floor(slots / designCount)` 동적 + `MIN_REPEAT_OVERRIDE` lookup), leftover 0 일 때만 round-robin filler. Mixed 모드는 1디자인 + 19슬롯 (1.75×3+1.5×3+1.25×8+1×5, 1.25" 두 배 비중) 인치 통일 패턴.
- **누끼 워크플로우 단축**: 인건비를 30분/건으로 줄이는 게 마진의 진짜 레버 (PSD 액션·키보드 매크로·재구매 시 PSD 캐시).

## 9. 인정해야 할 trade-off

- 부업 시작 = 인건비 0 가정 — 의식적 선택
- 첫 50건 = 유료 R&D — 마진보다 데이터·후기·UGC 산출
- launch price → 후기 50개 후 인상 — 미리 박아둔 가격 인상 경로
- 자체 디자인 자산 부족 — Mini Decor 는 multi-photo 번들로 우회, 후일 일러스트 외주($150–400)로 본격화
- 트래픽은 직접 끌어와야 — Shopify 는 빈 가게. 한인 커뮤니티 + 인스타 오가닉 + Meta 광고 조합

## 10. 미해결 / 다음 결정 포인트

| 항목 | 상태 |
|------|------|
| 자재 #1 (LAMat-AF) 정확한 단가 | 미확정 — anysheet.co.kr 가격 확인 필요 |
| 라미네이션 워크플로우 — `AGENTS.md` 반영 | 미반영 (모든 SKU 에 라미네이션 들어감) |
| 모크업 PDF export — `Everstory_mixed.jsx` 수정 | 미구현 |
| Bin packing minimum guarantee 로직 | 구현 완료 (`Everstory_mixed.jsx` minRepeat) |
| 로고 / 브랜드 비주얼 정체성 | 미정 |
| 상품 사진 촬영 컨셉 | 미정 |
| 상품 카피 / About 페이지 | 미정 |
| HST/GST 등록 (연 매출 $30k 도달 시점 대비) | 추적 필요 |

## 변경 이력

- **2026-05-03** — 초기 버전. 가격 ($12.99 / $15.99 / $18.99 / $24.99 net) lock, Shopify 메인 채널 결정, 6주 셋업 시퀀스, COGS $6.40 lock.
