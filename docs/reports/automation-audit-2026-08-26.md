# Everstory 자동화 전수 감사

- 감사일: 2026-08-26
- 범위: 로컬 제작 저장소 전체 + 운영 사이트 `https://everstorystudio.ca`
- 방식: 읽기 전용 구조·코드·문서·테스트·라이브 UI 감사
- 제외: Shopify Admin 설정 변경, 주문/폼 제출, 결제, Adobe 실제 출력, 파일 삭제

## 결론

현재 프로젝트는 이미 다음 핵심 구간을 상당히 자동화했다.

`Shopify/Easify → 주문 인입 → Photoshop 산출 → Illustrator 시트·칼선 → 주소 라벨`

이제 가장 큰 효과는 누끼 알고리즘 자체를 더 자동화하는 데 있지 않다. 다음 다섯 구간을 안전하게 연결하는 것이 우선이다.

1. 고객 사진의 보존·백업·삭제 약속
2. 주문 적격성·변경·취소·다운로드 실패
3. Package 후보 사진의 누끼 전 사람 선별
4. 인쇄·컷·포장·발송의 실제 상태
5. 라이브 Shopify와 로컬 문서·코드의 드리프트 방지

추천 첫 구현은 삭제를 바로 실행하는 기능이 아니라, **읽기 전용 `Everstory Doctor`**다. 사진 보존기한, 백업 노후도, 불완전 다운로드, 원본↔누끼↔출력 불일치, 상품 규칙 드리프트를 한 번에 보고하게 한 뒤 각 자동화를 붙이는 편이 안전하다.

## 현재 시스템 지도

### 로컬 저장소

- `projects/`: 약 8.0GB. 고객 원본·누끼·출력·주문 매니페스트가 있는 운영 데이터다.
- `.git/`: 약 1.4GB. 현재 추적 파일 규모에 비해 크므로 별도 이력 감사가 필요하다.
- `templates/`: 약 58MB.
- 작업 폴더 집계: 19개 중 원본 18, 누끼 17, AI 15, PDF 13.
- 기술 스택:
  - Python 3.9 표준 라이브러리: Shopify 인입·로컬 주문 보드
  - Photoshop UXP JavaScript: clean PSD + silhouette PNG 저장
  - Illustrator ExtendScript: 시트 배치·칼선·AI 저장·주소 라벨
  - Node.js: 패킹 시뮬레이션·회귀 테스트
  - Swift/AppKit/WKWebView: 주문 보드 macOS 프로토타입

핵심 진입점:

- 주문 인입: [`scripts/order_intake/intake.py`](../../scripts/order_intake/intake.py)
- 주문 보드: [`scripts/order_intake/webui.py`](../../scripts/order_intake/webui.py)
- Photoshop 저장 패널: [`plugins/everstory_save/main.js`](../../plugins/everstory_save/main.js)
- 운영 Illustrator 시트: [`Everstory_mixed.jsx`](../../Everstory_mixed.jsx)
- 주소 라벨: [`Everstory_address_labels.jsx`](../../Everstory_address_labels.jsx)
- 상품 SOT 문서: [`docs/business/products.md`](../business/products.md)
- Shopify 운영 문서: [`docs/shopify/`](../shopify/)

### 운영 사이트

라이브 카탈로그는 현재 4개 상품이다.

| 상품 | 가격 | Shopify variant |
|---|---:|---:|
| Face Sticker | CA$18.99 | 28 |
| Full Body Sticker | CA$18.99 | 28 |
| Package Mini | CA$24.99 | 4 |
| Package Full | CA$34.99 | 4 |

확인된 앱·외부 신호에는 Shopify, Easify 업로드 폼, Judge.me, Google Tag Manager, Meta, Shop Pay, PayPal, Google Pay가 있다.

## 라이브 사이트에서 확인된 자동화 근거

1. **Package Full 규칙 드리프트**
   - 라이브 폼: Big 4장 중 2장, Medium 4장 중 2장, Small 6장 중 4장 선택 — 후보 최대 14장.
   - 로컬 상품 SOT: 5/5/7 — 후보 최대 17장.
   - Package Mini는 라이브와 문서가 3/3/4, 최대 10장으로 일치한다.

2. **사진 삭제 약속과 로컬 보존의 충돌**
   - 라이브 폼은 원본을 fulfillment 후 90일 이내 삭제한다고 안내한다.
   - 로컬 `projects/`에는 원본·PSD·PNG·AI·주문 매니페스트를 만료 없이 보존한다.
   - 이는 법률 판단이 아니라, 고객에게 공개한 운영 약속과 실제 시스템 상태의 불일치다.

3. **주문 폼은 지연 로딩된다**
   - 상품 페이지의 첫 DOM 상태에는 Easify 필드가 없었고, 대기 후 업로드·이름·메모 필드가 나타났다.
   - 메인 Add to cart는 필수 입력 전 비활성화되지만 sticky quick-add 버튼은 활성 상태로 관찰됐다.
   - 실제 우회 가능성은 클릭 없이 확정하지 않았으므로 자동 계약 테스트가 필요하다.

4. **문의 폼의 라우팅 정보가 부족하다**
   - 페이지는 주문 문의 시 subject에 주문번호를 쓰라고 안내한다.
   - 실제 폼에는 Name / Email / Phone / Comment만 있고 subject, 문의 유형, 주문번호 필드가 없다.

5. **문서·정책 드리프트가 이미 존재한다**
   - 상품 문서는 4종인데 Shopify 설정 체크리스트에는 5 products가 남아 있다.
   - 설정 문서는 무료 lettermail + pickup만 정의하지만 라이브 FAQ·배송 페이지는 유료 Expedited Parcel을 약속한다.
   - FAQ는 dishwasher 사용 불가, Materials Guide 문구는 top rack occasional 가능으로 충돌한다.

6. **SEO·콘텐츠 자동 점검 후보**
   - Privacy와 Terms 페이지에는 meta description이 없었다.
   - Refund 페이지의 meta description은 본문을 길게 끌어와 과도하게 길다.
   - 홈은 로고와 hero가 각각 H1으로 잡혀 H1이 2개다.
   - 홈의 alt 공백 이미지는 21개였지만 장식 이미지일 수 있으므로 자동 실패보다 분류 리포트가 적합하다.
   - 상품 페이지에는 Organization, ProductGroup, Product 구조화 데이터가 있고 FAQ에는 FAQPage가 있다.
   - `robots.txt`와 `sitemap.xml`은 이번 브라우저 환경에서 차단되어 확인하지 못했다.

## 우선순위 백로그

### P0 — 먼저 안전하게 만들 것

| ID | 자동화 | 근거·기대 효과 | 난이도 | 첫 구현과 안전장치 |
|---|---|---|---:|---|
| P0-01 | 사진 보존·삭제 수명주기 | 라이브의 90일 삭제 약속과 무기한 로컬 보존이 충돌한다. 개인정보 리스크를 가장 먼저 닫는다. | 중 | fulfillment 기준일과 삭제 대상을 먼저 확정한다. `report-only → quarantine → 승인 삭제` 순서로 만들고 UGC 동의본·법정 보존 데이터는 분리한다. |
| P0-02 | 암호화 백업·복원 점검 | `projects/` 약 8GB가 로컬 유일 아카이브다. 디스크 장애 시 주문 원본을 잃는다. | 중 | 일일 증분 백업, 백업 나이·디스크 여유 알림, 월간 임의 복원+SHA-256 검증. 백업에도 P0-01과 같은 TTL을 적용한다. |
| P0-03 | 제품 카탈로그 단일 SOT + 드리프트 리포트 | Package Full 14장/17장, 4/5 products, 배송·세척 문구가 갈라져 있다. 잘못된 자동화를 막는 기반이다. | 중 | machine-readable JSON/YAML에 SKU·재질·사이즈·가격·업로드 quota·Package pick 수를 정의하고 Python/JSX/폼 기대값/문서 표를 검증한다. 자동 수정은 하지 않고 차이만 보고한다. |
| P0-04 | 주문 인입 재시도·페이지네이션·원자 저장 | 현재 최근 N건 조회, cursor 없음, timeout/429/5xx도 영구 `unavailable`로 굳을 수 있다. 누락 주문과 사진 유실을 막는다. | 중 | 지수 백오프, `complete/incomplete/gone` 분리, cursor+checkpoint, 임시 파일→해시 검증→rename, 재실행 멱등성 테스트를 추가한다. |
| P0-05 | 결제·취소·환불·주문 변경 적격성 | 조회 필드에 updated/cancelled/financial/fulfillment 상태가 없다. 취소 주문 제작이나 교체 사진 누락을 막는다. | 중 | 미결제·취소·환불은 제작 큐 차단, 변경 주문은 버전 보존 후 재검토. 애매하면 자동 판단하지 않고 `검토 필요`로 둔다. |
| P0-06 | Package 누끼 전 큐레이션 보드 | 현재 모든 후보 원본을 Photoshop으로 연다. Mini는 최대 60%, Full은 라이브 14→8 기준 약 43%의 불필요 누끼를 줄일 수 있다. | 중 | BIG/MED/SML 썸네일, quota 기반 사람 선택, source seq+SHA-256 저장, 선택본만 Photoshop 오픈. P0-03의 quota 확정이 선행돼야 한다. |
| P0-07 | Easify 주문 폼 계약 테스트 | 지연 로딩, 필수 업로드, 옵션 가격, sticky quick-add 경로가 회귀하기 쉽다. 주문 데이터가 인테이크 계약을 깨지 않게 한다. | 중 | 4개 상품의 upload 개수·tier·필수 Name·추가 사진 가격·variant·cart attribute 보존을 preview/test 상품에서 자동 smoke test한다. 실제 주문은 만들지 않는다. |
| P0-08 | 원본→누끼→출력 Project Doctor | 진행률은 개수 기반이고 UXP 출력 번호가 원본 번호를 보존하지 않는다. clean-only 1개, sil-only 1개가 관찰됐다. | 중 | source seq/hash 매핑, half-pair/orphan/duplicate/stale-AI/선택 제외를 읽기 전용으로 진단한다. 레거시는 오류 대신 경고로 분류한다. |
| P0-09 | 로컬 주문 보드 출력 안전화 | 고객 입력을 `innerHTML`로 렌더링하고 일부 경로를 `os.system`으로 연다. 로컬이어도 주문 데이터 기반 XSS/명령 경로 위험이 있다. | 낮음 | `textContent`/escape와 argv 기반 `subprocess`로 변경하고 특수문자 fixture로 회귀 테스트한다. |
| P0-10 | 신뢰 가능한 단일 검증 명령 | 일부 Node 테스트는 실패를 출력해도 exit 0이고, 전체 runner·CI·hook이 없다. 자동화가 잘못돼도 초록색이 될 수 있다. | 낮음–중 | 모든 실패를 nonzero로 바꾸고 `make check` 또는 `scripts/check.sh` 하나에 Python/Node/추출 일치/PII·secret·대용량 gate를 묶는다. |

### P1 — 반복 시간을 크게 줄일 것

| ID | 자동화 | 근거·기대 효과 | 난이도 | 첫 구현과 안전장치 |
|---|---|---|---:|---|
| P1-01 | 안정화 후 자동 인테이크 + 실패 알림 | `--all-new`는 멱등 기반이지만 실행은 수동이다. CDN 만료 전 확보와 놓친 주문 감지가 쉬워진다. | 낮음–중 | P0-04 이후 launchd로 15–60분 주기 실행. 실패·CDN 만료 임박·API scope·디스크·백업 지연만 macOS 알림한다. |
| P1-02 | 사진 사전검수 엔진 | 업로드 수 부족, 손상, 중복, 낮은 해상도는 Photoshop을 열기 전에 잡을 수 있다. | 중 | format/해상도/파일 크기/중복 hash/quota/SKU를 검사한다. blur·crop은 경고만 하고 자동 거절하지 않는다. |
| P1-03 | 교체 사진 요청 이메일 초안 | 현재 usable 사진 부족 시 사람이 주문을 확인하고 메일을 작성해야 한다. | 낮음 | 부족한 tier·주문번호·교체 방법을 채운 초안만 만든다. 사람이 확인 후 전송하며 자동 발송하지 않는다. |
| P1-04 | Photoshop `저장하고 다음` + 원자적 페어 저장 | 매 문서 버튼 클릭, 파일 선생성, 저장 중간 실패 시 half-pair가 남을 수 있다. | 낮음–중 | 임시 clean/sil 저장→열기/크기 확인→동시 승격. 성공 후 다음 문서를 활성화하고 실패 시 원본 문서는 유지한다. |
| P1-05 | Illustrator preflight + PDF/proof 자동 산출 | AI는 자동 저장되지만 PDF는 반복 수작업이다. 실제 출력에서 AI 95개 대비 PDF 37개였다. | 중 | A5/artboard/layer/CutContour/missing link/material/order 검사 후 표준 PDF, 저해상도 proof PNG, batch manifest를 생성한다. |
| P1-06 | 인쇄·컷·포장·발송 상태 머신 | 현재 보드는 `.ai`에서 끝난다. 지연·재인쇄·분실 대응과 고객 알림 근거가 없다. | 중–상 | 실제 물리 작업 완료 버튼이 immutable event를 남긴다. `발송 완료`를 사람이 명시적으로 누른 경우에만 idempotency key로 Shopify fulfillment/알림을 실행한다. |
| P1-07 | first-50 운영 KPI·원가·재고 | 누끼 시간, 재인쇄율, 재료 소모, 실제 마진이 아직 측정 대기다. | 중 | 주문 수령/누끼/시트/인쇄/발송 타임스탬프, 재인쇄 사유, 재료 사용량을 기록한다. idle time과 작업 시간은 분리한다. |
| P1-08 | Shopify 이미지 파생 파이프라인 | 촬영 가이드의 여러 비율·파일명·압축·alt가 수작업이다. | 낮음–중 | 원본 1회 입력→1:1/16:9/4:5/A5 crop→WebP/AVIF→메타데이터 제거→alt/업로드 manifest 초안을 만든다. 고객 이름은 alt에 넣지 않는다. |
| P1-09 | 주간 웹 품질·SEO·태그 감사 | meta 누락·과장 길이, H1, 장식 alt, 404, 정책 드리프트, 외부 태그가 수동 관리다. | 중 | title/description/canonical/H1/alt/JSON-LD/broken link/sitemap/robots/Core Web Vitals/태그 도메인을 주간 보고한다. 외부 태그 이벤트에 파일명·사진 URL·고객 데이터가 섞이지 않는지도 검사한다. |
| P1-10 | 문의 자동 분류 | Contact 폼에 subject·문의 유형·주문번호가 없다. 수동 triage 시간을 줄인다. | 낮음 | `Order help / Photo replacement / Pickup / Wholesale / Press`와 조건부 order number를 추가하고, inbox label·접수 회신을 만든다. |
| P1-11 | 리뷰·재주문·픽업 후속 흐름 | Judge.me와 Shopify 알림 기반은 있으나 제작 상태와 연결되지 않았다. | 낮음–중 | fulfillment+예상 도착일 기준 리뷰/관리법/재주문 안내. pickup은 `ready` 후 비공개 예약 링크만 보내고 주소를 공개 자동화하지 않는다. |
| P1-12 | Shopify 테마 소스 관리·배포 | 저장소에 Liquid/theme 소스가 없어 라이브 변경을 diff·preview·rollback하기 어렵다. | 중 | 별도 theme repo 또는 이 저장소의 명확한 하위 경로로 가져오고 preview→승인→publish→rollback 절차와 콘텐츠 드리프트 테스트를 만든다. |
| P1-13 | macOS 앱·UXP 빌드/릴리스 자동화 | 앱 plist 지원 버전과 바이너리 target이 다르고, UXP 메타데이터·도구 버전이 고정되지 않았다. | 중 | deployment target/architecture/signature 검사, Git tag 버전 주입, manifest/package 버전 동기화, 클린 artifact 빌드를 만든다. |

### P2 — 기반이 안정된 뒤 실험할 것

| ID | 자동화 | 기대 효과 | 난이도 | 제한 |
|---|---|---:|---:|---|
| P2-01 | 보조 AI 마스크 초안 | 단순 사진의 첫 마스크 시간을 줄일 수 있다. | 높음 | 별도 opt-in PoC로 두고 사람이 refine/approve한다. 브랜드의 hand-refined 약속을 대체하지 않는다. |
| P2-02 | 동의 기반 UGC·소셜 큐 | 후기 사진에서 게시 후보와 캡션·UTM 초안을 만든다. | 중 | 사진 후기 동의와 마케팅 재사용 동의를 분리하고 자동 게시하지 않는다. |
| P2-03 | 도매 문의·견적 초안 | 20+ sheets 문의의 원가·납기 계산을 줄인다. | 중 | 수량별 단가·납기·최소 마진 정책 확정 후 시작한다. |
| P2-04 | 한국어/영어 콘텐츠 중앙화 | 상품·정책 footer의 수동 복제를 줄인다. | 중 | locale/snippet SOT와 번역 누락 검사. 고객-facing 의미 변경은 승인한다. |
| P2-05 | JSX 공통 helper·실험 기능 격리 | `_saveAi`, CutContour, 템플릿 helper 복제로 인한 드리프트를 줄인다. | 중–상 | 운영 main과 Shape/Calligraphy 등 실험군을 catalog로 분리하고 공통 코드는 codegen 또는 테스트 가능한 단일 소스에서 배포한다. |

## 자동화하지 않는 편이 좋은 영역

- 최종 누끼 품질·머리카락·손가락·귀·발 같은 디테일 판단
- Package의 최종 사진 선택 자체 — UI는 도와도 결정은 사람에게 둔다
- 확인 없는 영구 삭제 — dry-run, quarantine, 승인 단계가 필요하다
- 실제 인쇄·컷·포장 확인 없이 Shopify fulfillment를 자동 완료하는 것
- 주소 라벨 시트의 시작 칸 추론 — 현재처럼 실물 시트가 상태인 편이 안전하다
- 별도 동의 없는 고객 사진의 리뷰·광고·소셜 재사용
- local pickup 주소의 공개 자동화

## 권장 실행 순서

### 0단계 — 결정 잠금

1. Package Full 후보 quota를 라이브 4/4/6으로 둘지 문서 5/5/7로 둘지 결정한다.
2. “fulfillment 후 90일 삭제”의 대상과 예외를 확정한다.
3. Expedited Parcel이 실제 checkout에 활성인지 확인한다.
4. dishwasher 안내의 최종 기준을 하나로 정한다.

### 1단계 — 안전 기반

1. P0-03 카탈로그 SOT·드리프트 리포트
2. P0-01/P0-02 보존·백업 `report-only`
3. P0-04/P0-05 인입 신뢰성·주문 적격성
4. P0-08/P0-09 Project Doctor·보드 안전 수정
5. P0-10 단일 검증 명령

### 2단계 — 가장 큰 시간 절감

1. P0-06 Package 큐레이션 보드
2. P1-02/P1-03 사전검수·교체 메일 초안
3. P1-04 Photoshop 저장하고 다음
4. P1-05 Illustrator preflight·PDF/proof

### 3단계 — 주문 끝까지 연결

1. P1-06 인쇄·컷·포장·발송 상태
2. Shopify fulfillment 연결
3. P1-07 KPI·원가·재고
4. P1-10/P1-11 문의·후기·재주문·픽업 흐름

### 4단계 — 웹·성장 운영

1. P0-07 주문 폼 계약 테스트
2. P1-08/P1-09 이미지·SEO·태그 감사
3. P1-12 테마 소스 관리·배포
4. P2 실험군

## 검증 상태

- 읽기 전용 로컬 감사에서 Node 6개 그룹과 Python 3개 그룹의 기존 테스트가 통과했다.
- fresh extraction과 현재 packer 구현의 일치를 확인했다.
- 감사 시작 시 Git 작업 트리는 clean이었다.
- 라이브 사이트는 홈, 컬렉션, 상품 4개, About, FAQ, Contact, Shipping, Refund, Privacy, Terms를 확인했다.
- 결제·폼 제출·cart 변경·Shopify Admin·Adobe GUI 출력은 실행하지 않았다.
- `robots.txt`와 `sitemap.xml`은 사용한 브라우저/웹 조회 환경에서 차단되어 미검증이다.

## 다음 작업 제안

첫 구현 티켓은 다음 범위가 적합하다.

> `Everstory Doctor v1`: 파일을 변경하지 않고 상품 규칙 드리프트, 주문 매니페스트 상태, 원본/누끼 half-pair, 90일 초과 후보, 백업 노후도, 디스크 여유, 테스트 결과를 한 리포트로 출력한다.

이 도구가 생기면 삭제·예약 인입·fulfillment처럼 위험한 자동화를 붙이기 전에 현재 상태를 매번 확인할 수 있다.
