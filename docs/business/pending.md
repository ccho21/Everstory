# Pending — Business

`docs/business/` 영역의 미해결·미구현·결정 대기 항목. 해결되면 한 줄씩 지운다. 확정 결정은 `strategy.md` 본문 또는 `docs/design/brand.md` 에 lock.

## 사업

- [ ] 잉크 장당 단가 실측 — Epson 552 5-pack C$145.29, 20장 풀컬러 출력 후 병 무게 전/후 차이로 보정 (first-50). 임시 C$0.20–0.40/매
- [ ] 구독 실청구액(CAD)·플랜·Everstory 전용 비중 — Claude Max 5x · Codex Plus · Shopify 기본+Easify Premium · Adobe(PS+AI)
- [ ] 관세 / HST 반입분 + Canada Post handling fee — 300매 기준 장당 C$0.10–0.15 버퍼 추정, 실측 필요
- [ ] 장비 취득가·내용연수 — Epson ET-8550 · Summa D75 → `business.md` Cost Model 건당 감가 도출
- [ ] EMS ≥600매 합산수입(라벨+라미) 실측 — 현 300매 ≈ C$0.35–0.37/매
- [ ] 월 예상 물량 확정 — `business.md` 22건 목표 vs Cost Model 100/300/600 시나리오 정합
- [ ] 기타 OPEX 실항목 정리 — 이메일·회계·폰트·스토리지 등 (→ `business.md` Cost Model §3)
- [ ] (후속·선택) Sample Pack 개념 정의·리서치 — 런칭 프로모는 first-order 20% 로 결정(`products.md`). 별도 샘플 SKU 는 추후 탐색: 무엇을 파는지 불명확(재질/라미 질감 체험? 커스텀 없음?), 학습 필요
- [ ] (후속·선택) loss-leader SKU 가격 산정 — Sample/Starter/번들 도입 시 `business.md` Cost Model 원가 + `products.md` 가드레일로 확정
- [ ] 라미네이션 워크플로우 — 모든 SKU 에 라미네이션 들어감, `CLAUDE.md` 반영 필요
- [ ] 패키징 사양 확정 (클리어 슬리브 / backing board 포함 여부·구성) — photography.md #9·패키징 컷, PDP "What's included" 이미지의 선행조건
- [ ] 로고 / 브랜드 비주얼 정체성
- [ ] 상품 사진 촬영 컨셉
- [ ] 상품 카피 / About 페이지
- [ ] HST/GST 등록 — 연 매출 $30k 도달 시점 대비 추적
- [ ] 누끼 워크플로우 단축 — 인건비 30분/건 목표 (PSD 액션·키보드 매크로·재구매 시 PSD 캐시)
- [ ] 일러스트 외주 본격화 — Mini Decor 자체 디자인 자산 ($150–400/건)
- [ ] MVP 외 카테고리 — 문구 스티커, 다중 시트 자동 분할

## 인쇄 디자인

- [ ] 푸터 chip 2 카피 교체 — `.ait` 의 `PRINTED IN THE USA WITH CARE` → `MADE IN TORONTO WITH CARE` (`.ait` 직접 수정 필요)
- [ ] Divider hairline stroke 진짜 색 측정 — 현재 PNG anti-alias artifact 만 잡힘 (`.ait` swatch 또는 Eyedropper 확인)
- [ ] mockup 헤더 "White matte · Finish Matte" 중복 노출 정리
- [ ] 칼선 default 1mm 유지 vs 0.5mm 변경 검토 — mockup 은 0.5mm 출력
- [ ] body 142×175 (v2) 결정 근거 정리 — 왜 v1 의 148×195 에서 줄었는지
- [ ] header_right TextFrame 분리 (v2) 결정 근거 정리

## 웹 디자인 (Shopify)

- [ ] Editorial display 폰트 lock — Cormorant Garamond 600 vs Playfair Display 700 시안 비교 (Phase A 끝)
- [ ] Shopify 테마 lock — Sense vs Dawn 30분 비교 (Phase B Day 1)
- [ ] `assets/wordmark.svg` 생성 — Illustrator 에서 outline → SVG export. MVP 는 PNG 사용, 출시 후 교체
