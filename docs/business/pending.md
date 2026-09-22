# Pending — Business

본 문서는 [`business.md`](business.md) · [`products.md`](products.md) · [`expenses.md`](expenses.md) 가 → `pending.md` 로 위임한 **미확정·측정 대기·결정 보류** 항목의 단일 출처다. 항목이 닫히면 raw 는 원래 SOT 로 이동하고 본 문서에서 삭제한다.

## 두 상품 전환 — 남은 결정

현재 화면 작업은 [Shopify 작업 순서](../shopify/plan.md)를 따른다. 아래 항목은 **관련 기능·정책을 바꿀 때 확인할 사항**이며, 전부 답해야 Draft 테마를 개선할 수 있다는 뜻은 아니다. 상품·앱·채널 변경과 라이브 전환은 Draft 테마 편집과 별개다.

| ID | 남은 확인 | 닫는 조건 / 반영 위치 |
|---|---|---|
| D-1 | Git 비참조 고객 주문 blob과 체크포인트 정리 | GC·백업 범위를 별도로 결정. 이번 보고서 삭제는 Git 객체 정리 승인이 아님 |
| D-2 | Easify가 늦거나 안 뜰 때 빠른 결제가 개인화 입력을 우회하는지 | 실제 구매 경로 확인 뒤 빠른 결제 표시/차단 방식 결정 → 테마·[런북](cutover_runbook.md) §8 |
| D-3 | 두 상품의 Shop 게시·웹스토어 연결 방식 | Shop 경로에서 사진·이름 입력 보존 확인 뒤 채널 정책 결정 → 런북 §0·§8 |
| D-4 | 실측 전 `about 24 stickers` 사용 여부와 스티커 개수 정의 | 실물 재단 후 개수 확정, 또는 숫자 없는 문장 채택 → [카피 정본](../shopify/copy_two_products.md) §1·상품·SEO |
| D-5 | 내구성 연수와 식기세척기 안내 | `Indoor 5+ years / Outdoor 2–3 years` 근거 확보 또는 수치 없는 문장 결정. FAQ의 식기세척기 불가와 Materials의 상단칸 허용도 같은 기준으로 통일 → PDP·FAQ·구조화 데이터 |
| D-6 | 사진 보존 기준과 실제 삭제 절차 | 게시 정책의 fulfillment 후 90일, Easify 업로드 기준, 로컬·보드 캐시·백업 처리 대조 → [정책](../shopify/policies.md) |
| D-8 | WM/SV/GD/TR·라미의 실제 제품명 | [expenses.md](expenses.md) §2.1 매핑 확인 후 Materials Guide와 일치시킴 |
| D-9 | 미사용 한국어 footer 초안의 향후 용도 | 새 두 상품에 맞춰 사용할지 보류할지 결정. 현 초안은 게시용으로 복사하지 않음 → [footer_copy.md](../shopify/footer_copy.md) |
| D-11 | NAME 후보 7장 중 최종 5장 제작 시 보드 진행률 | 원본 수/제작 사진 수 중 분모 정책 결정. 그전에는 런북 §12 수동 대조 |
| D-12 | 시트 헤더 날짜 | 주문일 프리필 또는 제작일 표현 중 결정 → 카피·구성 화면 |
| D-13 | Custom 이름 스티커의 고객 안내 | 현재 제작 코드가 이름 스티커를 포함함을 확인하고 구성품 명시 여부 결정 → 카피 정본 §2 |
| Custom 개수 | 크기별 예상 스티커 수와 이름 스티커 공간 | 이름 블록을 넣으면서 사진 스티커가 빠지는 경우까지 확인한 뒤 PDP의 ≈50/36/20/16/6/4 안내를 맞춤. NAME의 `about 24` 실측과 별개 |
| 요청 충돌 | Crop preference와 Special instructions가 다르거나 특정 사진의 크기·silhouette를 요청한 경우 | 우선순위·보장 범위를 정한 뒤 폼 안내와 제작 절차에 반영 |

D-10(현재 Judge.me 플랜)은 **2026-09-21 Admin에서 Free로 확인 완료**했다. 청구 내역은 확인하지 않았으며 비용은 추정하지 않는다. 현재 사실은 [Shopify 계획](../shopify/plan.md)에 반영한다.

## 원가·실측 (→ expenses.md / business.md 보강)

| 항목 | 출처 | 닫는 조건 |
|------|------|-----------|
| 잉크 장당 잉크비 (Epson 552 5-pack ÷ 인쇄 매수) | [`expenses.md`](expenses.md) §2.2 | 실인쇄 매당 잉크 사용량 측정 |
| 포장재 사양·단가 | [`expenses.md`](expenses.md) §2.3 | 사양(봉투·완충재·라벨) 확정 → 단가 박힘 |
| EMS 해외배송 ≥600매 합산 실측 | [`expenses.md`](expenses.md) §3 | 합산 발주 1회 실측 (방법론은 §3) |
| 결제·플랫폼 수수료 정확 요율 | [`expenses.md`](expenses.md) §3 | Shopify Payments + (필요시 PayPal/Apple Pay) 청구 명세 |
| 관세·HST + Canada Post handling 실측 | [`expenses.md`](expenses.md) §3 | 반입 batch 1회 측정 |
| OPEX 실청구액 (Shopify / Adobe / Claude Max / Codex Plus / 도메인 Monthly) | [`expenses.md`](expenses.md) §4 | 청구서 수령 후 Monthly 칸 채움 |
| "기타" OPEX 항목 발굴 (이메일·회계·폰트·스토리지 등) | [`expenses.md`](expenses.md) §4 | Everstory 실제 사용 도구 목록화 |
| CapEx 내용연수·감가 정책 | [`expenses.md`](expenses.md) §1 | 정책 결정 → 월 감가 → 건당 배부 산출 |
| 인건비 (cutout time) | [`business.md`](business.md) *Pricing And Cost* | first-50 주문 실측 → 모델 안으로 편입 여부 결정 |

## 상품 (→ products.md)

| 항목 | 출처 | 닫는 조건 |
|------|------|-----------|
| Shape Sticker 출시 | [`products.md`](products.md) §Launch SKU | shape 크롭 제작 플로우 확정 → Shopify 상품 공개 |

## 인쇄 디자인

(현재 항목 없음. Phase A/B 자동화 관련 미확정 발생 시 여기에.)
