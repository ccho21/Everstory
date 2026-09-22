# Shopify — Draft 테마 작업

**여기서 시작한다.** 현재 목표는 `Copy of everstory-theme/main` Draft 테마(**165897306368**)를 두 상품에 맞게 개선하고 문서를 정리하는 것이다. [Draft 미리보기](https://q3gj59-am.myshopify.com?preview_theme_id=165897306368)

**2026-09-22 Draft 반영:** 테마 13파일에 다음을 적용했다. 라이브 전환은 아직 하지 않았다.

- **홈·카트·404:** Package Full → Face 순서로 두 상품을 직접 선택하고 데스크톱 2열·모바일 1열로 배치. 홈 상품 목록을 How it works 앞으로 이동했다.
- **PDP·FAQ·About:** Name & Photo의 후보 5–7장/최종 5장, Custom의 선택한 사진 수, 사진 대체 연락과 Special instructions 위치를 통일했다. 근거 없는 “most popular” 표시를 제거했다(D-7 완료).
- **접근성·이미지:** Easify 이름·메모·드롭다운에 읽을 수 있는 이름을 연결했다. 앞서 반영한 PDP 하단 이미지 8개의 지연 로딩을 유지한다.

**확인:** 홈 1280px/390px, FAQ·카트·404 390px에서 가로 넘침·Liquid 오류 없이 표시됐다. 카트·404 추천도 같은 두 상품이다. Face PDP의 Photos to include를 1→2→1로 바꾸며 선택값이 접근성 이름에 반영되는 것을 확인했다. FAQ 본문/구조화 데이터 21개가 일치하고 템플릿 JSON 검사를 통과했다. Theme Check는 기존 Judge.me 오류 3개·경고 33개가 남아 있으며 신규 지적은 0개다.

**남은 확인:** Draft 상품의 admin preview가 새 테마 선택을 유지하지 않아 Name & Photo 전체 흐름을 실제 화면에서 검증하지 못했다. 사진 업로드·장바구니 담기·결제·출력 시험도 미실행이다. 상품명·가격·카드 부제·메뉴에는 공유 데이터의 기존 값이 표시되며 컷오버 때 함께 전환한다.

상품 제목·가격·메타필드·Easify·메뉴·채널은 **테마 밖의 공유 데이터**다. Draft 테마 편집과 별도로 다루며, 라이브 전환은 [컷오버 런북](../business/cutover_runbook.md)을 따른다. 내부 제작 스크립트 추가 개발과 새 종합 보고서 작성은 중단한다.

고객 문장의 정본은 [두 상품 카피](copy_two_products.md), 사업상 미결정은 [pending.md](../business/pending.md)다. 미결정 전체가 Draft 화면 개선의 선행조건은 아니다. 작업할 때는 바뀐 화면·확인 결과·남은 결정만 짧게 공유한다.

이번 조사에서 만든 보고서·로그·일회성 검증 스크립트 134개(9,210,993바이트)는 필요한 내용을 기존 문서에 합친 뒤 삭제했다. 운영 코드·운영 테스트와 이전의 별도 자동화 점검 문서는 유지했다. 새 보고서는 만들지 않는다.

## Priority Model

| Priority | 의미 | 처리 기준 |
|----------|------|-----------|
| P0 | admin 실행이나 고객-facing 정책을 헷갈리게 하는 충돌 | 다음 정리 단계에서 반드시 먼저 해결 |
| P1 | 두 상품을 이해하고 주문하는 데 필요한 개선 | Draft에서 반영·확인한 뒤 전환 |
| P2 | 현재 구매 흐름과 직접 관계없는 자동화·채널 확장 | 두 상품 전환 이후 검토 |

## Shopify Scope

Shopify 문서는 다음 질문에 답해야 한다.

- admin에서 어떤 순서로 무엇을 설정하는가
- 결제, 세금, 배송, 픽업, 마켓, 계정 설정은 어떤 값인가
- 기존 4상품을 Name & Photo / Custom 두 상품으로 어떻게 전환하는가
- Easify로 사진·이름·Crop preference·Special instructions를 어떻게 받는가
- 정책/페이지/상품 카피는 어디에서 복사해 붙이는가
- 테스트 주문은 어떻게 통과시키는가

Shopify 문서에서 제외한다.

- 사업 원가와 장기 채널 전략
- 브랜드 스타일 원칙과 디자인 토큰 설명
- Illustrator/Photoshop 운영 코드 상세
- Customily 전환, Translate & Adapt 등 이번 Draft 개선과 관계없는 앱 확장

## Document Purpose Table

| 문서 | 역할 | 중요도 | 상태 |
|------|------|--------|------|
| `plan.md` | 현재 Draft 작업의 진입점과 화면별 다음 순서. | P0 | 유지 |
| `settings_checklist.md` | Shopify admin 실행 SOT. Settings 1A-1J 입력값과 통합 smoke test. | P0 | 유지 |
| `copy_two_products.md` | Name & Photo / Custom 고객 카피 정본. | P0 | Draft·상품·SEO에 같은 문장 적용 |
| `product_descriptions.md` | 전환 전 4상품의 설명·옵션 기록. | P0 | 현재 게시본 복원 원본으로 사용하지 않음 |
| `policies.md` | Refund, Shipping, Privacy, Terms policy SOT. | P0 | 유지 |
| `pages_copy.md` | About, FAQ, Sizing, Materials page copy SOT. | P1 | 유지 |
| `footer_copy.md` | 옛 4상품 한국어 footer 초안. | P2 | 미사용 관측, 게시용 복사 금지 |

## Remaining Work

다음은 실제 Name & Photo 입력·주문 흐름과 상품 전환 뒤 컬렉션·메뉴 확인이다. 실물 사진·개수, 소재·내구성 근거, 보존·채널 정책은 [pending.md](../business/pending.md)의 해당 항목을 확인한다. 실제 주문·출력·복구 시험은 [런북 §8](../business/cutover_runbook.md#8-검증)에 남아 있다.

- 배송 설정 확인 때 `settings_checklist.md`의 밴쿠버 차단 기대값과 `expenses.md`의 Ontario 표현을 전국 배송 기준과 맞추고, 실제 checkout에서 BC 배송·유료 추적 요금을 확인한다.
- Shopify Customer privacy의 지역별 동의 설정과 GA/Meta 작동을 확인한다. 사진 보존 정책 확인과는 별개이며 새 추적 도구는 추가하지 않는다.

## P2 Later

- 현재 Draft 개선에 필요하지 않은 추가 섹션·대규모 테마 확장.
- Shopify Flow 자동 태그 고도화.
- Translate & Adapt 한국어 전체 페이지 전환.
- Customily 또는 live preview 앱 전환.
- Meta Pixel, newsletter, 리뷰 앱 교체, Etsy sync.

### 외부 피드백 반영 (2026-05, 지인 피드백)

2026-05 외부 사용자 피드백이다. 사이즈 이해·소재 정합성은 현재 PDP 개선 때 함께 보고, 채널 확장은 P2로 둔다. 반영한 내용은 해당 정본에 합치고 이 표에서 뺀다.

| 묶음 | 항목 | 메모 |
|------|------|------|
| 사이즈 직관성 | PDP 미리보기에 아이폰 대비 목업 + mm/in 사이즈 표기. 이미지별 사이즈 게시로 주문 직관성 확보 | 아이폰 비교가 가장 직관적. 목업 에셋 1회 제작 → 다수 SKU 재사용 |
| 소재 정합성 | 종이재질(소재) 이미지 ↔ 설명 불일치 정리 | **우선** (고객 혼동). product_descriptions.md / pages_copy(Materials) ↔ 라이브 이미지 정합성 점검 |
| 채널 품질 | 인스타 업로드 시 사진 깨짐 해결 (export 해상도·비율) | **빠른 수확**. 사진 export 해상도·비율 정리 |
| 채널 확장 | FB/IG shop 등 세일즈 채널 업데이트 | 위 "Meta Pixel … Etsy sync" 와 연계 |
| 리뷰·UGC | 프로덕트별 리뷰 + 고객 실사용 사진 노출 | 위 "review app" 구체화 — UGC 사진 수집·전시 포함 |

#### 리뷰·UGC 앱 후보 (리서치 2026-05)

아래 요금·기능은 **2026-05 당시 비교 자료**이며 현재 구매 판단에는 재확인이 필요하다. 현재 사용하는 앱은 Judge.me이며 교체 작업은 이번 범위에 없다.

| 앱 | 요금(시작) | 특징 | 현 단계 적합성 |
|----|-----------|------|----------------|
| **Judge.me** | 무료 ~ $15/mo | 사진 리뷰 + UGC 갤러리 + 구조화 스니펫, 가장 저렴 | **런칭 추천** |
| Loox | $9.99 ~ $34.99/mo | 사진·비디오 리뷰 특화, 캡처율 높음 | Meta 사진광고 본격화 시 재검토 |
| Okendo / Yotpo | $19 / 엔터프라이즈+ | 통합 깊이(Klaviyo·Meta 카탈로그·로열티) | 고 GMV 단계 — 현재 과함 |

- **결정 (2026-05-29): Judge.me Forever Free** 로 런칭 (사진 리뷰·UGC·rich snippet 충족). 현재 설정은 운영몰을 기준으로 관리하고, 사진 기반 Meta 광고 본격화 시 Loox를 재검토한다.
  - **2026-09-21 확인:** Admin의 현재 플랜은 **Free Plan**. Cards Carousel은 [공식 안내](https://judge.me/help/en/articles/12930379-cards-carousel)에서도 Free 기능이며 라이브 홈에서 렌더됐다. 과거의 캐러셀·비디오 리뷰 유료 전용 단정은 사용하지 않는다. 청구 내역은 확인하지 않았고 청구액을 추정하지 않는다.

#### FB/IG shop 셋업 순서 (리서치 2026-05)

- **앱**: "Facebook & Instagram by Meta" 세일즈 채널 — 전 Shopify 플랜 무료. 위 "Meta Pixel … Etsy sync" 와 동일 인프라(Pixel) 공유.
- **선행조건**: Meta Business + Commerce Manager 계정, Meta Pixel/Conversions API, IG 프로페셔널 계정, 비즈니스+도메인 인증, 상품 카탈로그.
- **순서**: 채널 설치 → Start setup → FB 비즈니스 페이지·IG 비즈니스 연결 → Commerce Manager 카탈로그 자동 생성/동기화 → shop 심사 제출 → 승인 후 게시물 제품 태깅.
- **비고**: shop 심사 최대 4주 → 일찍 시작. Toronto(캐나다) 지원됨. 2026-03 기준 Instagram 이 정식 세일즈 채널로 전환됨.
