# order_intake — 주문 사진 인테이크

Shopify 주문의 Easify 업로드 사진을 `projects/{고객명 주문번호}/01_original/` 로
내려받고 리네임한다. 표준 라이브러리만 쓴다 (시스템 `python3` 3.9).

## ⚠ 왜 이게 급한가

Easify CDN(`cdn.tigren.com`) 은 업로드 **90일 후 객체를 삭제**한다.
응답 헤더로 확인됨:

```
x-amz-expiration: expiry-date="...", rule-id="ExpireAllObjectsAfterNinetyDays"
```

주문 데이터에는 URL 만 남고 사진 자체는 남의 서버에 세 들어 있다.
실제로 `#1001`·`#1002` 사진은 이미 **403** 이다.
**이 스크립트가 유일한 아카이브 경로다.**

## 클릭으로 쓰기

**프로젝트 루트의 `.command` 파일을 더블클릭하면** 브라우저에 화면이 뜬다
(현재 이름: `SHOPIFY_ORDER_DOWNLOAD.command`).

런처는 **이름이 아니라 자기 위치**로 `webui.py` 를 찾는다 — 그래서 **이름은 마음대로 바꿔도 되고**,
`포토샵누끼/` 와 `scripts/order_intake/` 둘 다에서 동작한다. 그 밖으로는 옮기지 말고,
다른 곳에서 쓰고 싶으면 **별칭(alias)** 을 만들 것. 못 찾으면 어디를 찾아봤는지 알려주고 멈춘다.

- **표**: 최근 주문 25건 + 상태(안 받음 / 완료 / 일부 유실) + **진행**(누끼 · 시트).
  안 받은 건 주황색 배경, 지금 손볼 칸은 주황 글씨
- **진행 열**은 폴더만 보고 만든다 — 별도 상태 파일이 없으니 손으로 갱신할 일도, 실제와
  어긋날 일도 없다. `누끼` = `02_cutout` 의 `_clean.psd`+`_sil.png` 페어 / `01_original` 사진,
  `시트` = `03_output` 의 `.ai` 개수. **네트워크 없이 2초마다 알아서 갱신**되므로 포토샵에서
  누끼를 저장하면 브라우저를 봤을 때 이미 반영돼 있다 (새로고침 버튼은 Shopify 재조회 담당)
- 맨 위 한 줄에 **지금 손볼 것**이 뜬다 — `주문 25건 · 안 받음 2 · 누끼 대기 3 · 시트 대기 1`.
  한 주문은 **가장 앞선 미완 단계 하나만** 센다 (누끼가 덜 끝났으면 시트 대기로 안 센다)
- **안 받은 주문 전부 받기** = `--all-new`
- **선택한 주문 받기** = 체크박스로 골라서
- **주소 라벨** = 체크한 주문으로 `--labels` 를 돌려 `projects/_labels.txt` 를 만들고
  `Everstory_address_labels.jsx` 를 Illustrator 로 연다 (파일 칸이 채워진 채 뜬다).
  **라벨 칸 순서 = 표에 보이는 순서.** 시작 칸은 실물 시트를 보고 손 입력 — 파일로 추적하지 않는다
- **폴더 열기** = 체크한 주문 폴더를 Finder 로
- **행별 작업 버튼** — 보드가 다음 단계 앱을 대상까지 챙겨서 열어준다. 작업 자체는 앱 안에서 수동:
  - `누끼` = 그 주문의 **누끼 안 된 원본만** Photoshop 으로 연다 (페어 있는 사진은 건너뜀.
    순번 `NN` 을 못 읽는 옛 파일명은 판정 불가라 전부 연다 — 빠뜨리는 쪽보다 낫다)
  - `시트` = `Everstory_mixed.jsx` 를 Illustrator 로 열되 **폴더 선택 다이얼로그를 건너뛰고**
    그 주문의 `02_cutout` 이 이미 골라져 있다. 페어가 0장이면 앱을 띄우지 않고 로그로 알린다.
    폴더 전달은 osascript 가 `$.global.__EVERSTORY_LAUNCH__` 에 넣는다 — .jsx 가 읽자마자
    지우므로(consume-once) 다음 수동 실행이 옛 폴더로 열리는 일이 없다
- 아래 검은 칸에 진행 상황이 실시간으로 흐른다

같이 뜨는 **터미널 창이 서버다. 닫으면 화면도 멈춘다.** 끝내려면 그 창을 닫거나 `Ctrl+C`.

### 왜 웹인가 (tkinter 를 버린 이유)

이 맥은 **macOS 26.5.2 인데 시스템 Tk 는 8.5.9(2010년)** 다. 이 조합에서 tkinter 창은
**제목만 뜨고 내용이 하얗게 비어 나온다** — 예외도, 오류 메시지도 없다. 다른 파이썬이 없어
Tk 8.6 을 쓸 방법이 없고, 새 파이썬 설치는 의존성 추가라 피했다.
`http.server` 는 표준 라이브러리이고 렌더링은 브라우저가 하므로 이 문제가 없다.
**tkinter 로 되돌리지 말 것.**

`.app` 번들도 시도했다가 버렸다 — 위 Tk 문제에 더해 **TCC** 에 막힌다. 직접 만든 `.app` 은
Desktop 안의 파일을 못 읽고, 프롬프트도 안 뜨고 조용히 죽는다
(`[Errno 1] Operation not permitted`). ad-hoc 서명을 붙여도 마찬가지고,
정공법은 Full Disk Access 수동 추가다. `.command` 는 Terminal 이 책임 프로세스라
그 권한을 상속받으므로 이 문제가 없다 — 그래서 `.command` 를 쓴다.

### 구조

`webui.py` 는 `intake.py` 를 **모듈로 불러** 그대로 쓴다 — 로직 사본이 없으므로 CLI 와 화면이
갈라질 수 없다. 인증도 같은 키체인 항목을 읽는다. 서버는 **127.0.0.1 에만 바인딩**하고
매 실행 임의 포트 + 임의 토큰을 쓴다 (토큰 없는 요청은 403). 다른 로컬 페이지가 두드릴 수 없다.

## 쓰는 법 (터미널)

```bash
python3 intake.py --check              # 토큰·도메인·API 버전·스코프 확인
python3 intake.py --list               # 최근 20건의 아카이브 여부 + 진행(누끼·시트)
python3 intake.py --order EVS-1008     # 단건 인테이크
python3 intake.py --all-new            # 매니페스트 없는 주문 전부
python3 intake.py --all-new --dry-run  # 위를 계획만
python3 intake.py --labels             # 배송지 → 주소 라벨 텍스트 (전부)
python3 intake.py --labels EVS-1007,EVS-1006   # 인쇄할 순서대로만
```

| 옵션 | 뜻 |
|---|---|
| `--check` | 토큰·도메인·API 버전·**부여된 스코프**를 확인만. 주문 조회 안 함 |
| `--backfill-job` | 이미 받아둔 `_order.json` 전부에 `job` 블록을 채운다. **토큰·네트워크 불필요** |
| `--list [N]` | 최근 N건(기본 20)의 아카이브 여부 + 진행(누끼·시트). 다운로드 안 함 |
| `--labels [ORDERS]` | 배송지를 주소 라벨 텍스트로 뽑는다. 주문번호를 쉼표로 나열하면 **그 순서대로**, 생략하면 전부. **토큰·네트워크 불필요** |
| `--labels-out PATH` | `--labels` 출력 경로. 기본 `projects/_labels.txt` (개인정보라 `.gitignore` 안쪽) |
| `--order NAME` | 주문번호로 Admin API 에서 가져와 인테이크 |
| `--all-new` | 매니페스트가 없는 주문을 전부 인테이크 |
| `--order-json PATH` | 주문 JSON 파일에서 읽음 (**토큰 불필요** — 폴백 경로) |
| `--folder` | 프로젝트 폴더명 직접 지정. 기본 `{고객명} {주문번호}`. 단건에서만 |
| `--projects-dir` | `projects/` 경로. 기본 = 이 스크립트 기준 상대경로 |
| `--dry-run` | 다운로드 없이 파일명·용량·만료일만 출력 |
| `--force` | 이미 받은 파일도 다시 받음 |
| `--shop` / `--api-version` | 기본 `q3gj59-am.myshopify.com` / `2026-07`. env `SHOPIFY_SHOP`·`SHOPIFY_API_VERSION` 로도 지정 |
| `--scan N` | `--all-new` 이 훑을 최근 주문 수 (기본 50) |

`--dry-run` 없이 두 번 돌려도 안전하다 — 같은 순번 파일이 이미 있으면 건너뛴다.

### 아카이브 상태 3단계 (`--list`)

| 표시 | 뜻 |
|---|---|
| ✅ | 사진 전부 확보 |
| ⚠ N장 유실 | 받기 전에 CDN 에서 만료됨. **재시도해도 안 된다** — 매니페스트에 URL·오류만 기록 |
| ❌ 미아카이브 | 아직 안 받음 → `--all-new` |

유실을 ❌ 와 구분하는 이유: 해결 불가능한 ❌ 가 목록에 상주하면 **진짜 놓친 주문이 잡음에 묻힌다.**
같은 이유로 사진이 0장인 주문(전부 유실)은 진행 열에서 `—` 로 두고 "누끼 대기" 로 세지 않는다.
못 받은 사진도 매니페스트에 `"unavailable": true` 로 남겨서 "이 URL 에 사진이 있었고
받기 전에 사라졌다"는 사실을 보존한다.

## 셋업 — Dev Dashboard 앱 (2026-01-01 이후 방식)

> **2026-01-01 부터 Shopify 어드민에서 커스텀 앱을 만들 수 없다.** Dev Dashboard 로 만들고,
> 영구 `shpat_` 토큰 대신 **Client ID/Secret 으로 24시간짜리 토큰을 교환**한다.
> ([changelog](https://changelog.shopify.com/posts/legacy-custom-apps-can-t-be-created-after-january-1-2026))

**전제:** 공식 요구사항이 **최신 Chrome 또는 Firefox** 다. Dev Dashboard 는 개발자 도구라
모바일 브라우저는 지원 대상이 아니다.

**1. 앱 만들기**
**https://dev.shopify.com/dashboard/** (어드민 → Settings → Apps → Develop apps →
**Build apps in Dev Dashboard** 로도 감)
→ 좌측 **Apps** → 우상단 **Create app** → **Start from Dev Dashboard**
→ 이름(`Everstory Order Intake`) → **Create**

**2. 버전 만들고 스코프 지정 + Release**
앱의 **Versions** 탭에서 App URL(비임베디드면 기본값 `https://shopify.dev/apps/default-app-home`),
Webhooks API version(최신), **Access scopes** 를 채우고 **Release** 를 누른다.
**Release 안 하면 설치가 안 된다** — 버전이 릴리스돼야 설치 가능.

| 스코프 | 왜 |
|---|---|
| `read_orders` | 주문·line item property (사진 URL) |
| `read_customers` | `customer { firstName lastName }` — 폴더명에 쓴다 |
| — | 배송지(`shippingAddress`)는 `read_orders` 로 같이 온다. 추가 스코프 없음 |
| `read_all_orders` | **없으면 최근 60일 주문만 조회된다** (오류 없이 조용히) |

**3. 스토어에 설치**
앱의 좌측 **Home** → 아래로 스크롤 → **Install app** → 스토어 선택 → **Install**

**4. Client ID / Secret 을 키체인에**
앱 → **Settings** → **Credentials** 에서 **Client ID** 와 **Client secret** 을 복사해 각각 넣는다.
(옛 `shpat_` 과 달리 **나중에 다시 볼 수 있고**, 필요하면 **Rotate** 로 재발급도 된다 —
한 번에 다 끝낼 필요 없다.)
(실행하면 값을 대화형으로 물어본다 — 셸 히스토리·파일에 안 남는다):

```bash
security add-generic-password -s 'everstory-shopify-client-id' -a "$USER" -w
security add-generic-password -s 'everstory-shopify-client-secret' -a "$USER" -w
```

환경변수 `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` 도 지원하지만 키체인이 낫다.

**5. 확인**

```bash
python3 intake.py --check
```

부여된 스코프를 실제로 읽어서 빠진 걸 알려준다. 비밀값은 어떤 경로로도 출력하지 않는다.

### 인증 동작

매 실행마다 `POST https://{shop}/admin/oauth/access_token` 으로
`grant_type=client_credentials` 교환 → **24시간짜리** access token 을 받아 그 실행에만 쓴다.
토큰을 디스크에 캐시하지 않으므로 갱신 작업도, 유출될 영구 토큰도 없다.

⚠ **client credentials 는 앱과 스토어가 같은 Shopify organization 일 때만 동작한다.**

**legacy 폴백:** 2026-01-01 이전에 어드민에서 만든 커스텀 앱의 정적 `shpat_` 토큰이 있다면
`security add-generic-password -s 'everstory-shopify-admin' -a "$USER" -w` 로 넣어도 된다.
Client ID/Secret 이 있으면 그쪽이 우선한다.

**어느 것도 스크립트나 리포에 하드코딩하지 말 것.**

## 주문 JSON 폴백 (토큰 없이)

토큰 셋업 전이거나 API 가 막혔을 때 쓴다. Claude 가 Shopify MCP 로 뽑아준 JSON 을 그대로 먹인다:

```bash
python3 intake.py --order-json order.json
```

`{"data":{"order":{…}}}` / `{"data":{"orders":{"nodes":[…]}}}` / bare order 셋 다 받는다.

## 산출물

```
projects/{고객명 주문번호}/
├── 01_original/
│   ├── 01_BIG_IMG_6425.jpg      ← {NN}_{버킷}_{원본명}.{실제확장자}
│   ├── 05_MED_IMG_6843.jpg
│   └── 09_SML_IMG_6807.jpg
├── 02_cutout/                   ← 빈 폴더로 미리 만들어둠 (Phase A 산출지)
├── 03_output/                   ← 빈 폴더로 미리 만들어둠 (Phase B 산출지)
└── _order.json                  ← 매니페스트
```

`_order.json` 은 주문번호·고객·이메일·상품/SKU·비사진 옵션(`Name`,
`Photos to include`, `Special instructions` …)·사진별 원본 URL/sha256/용량/포맷/
다운로드 시각을 담는다. 원본 URL 이 만료된 뒤에도 추적이 가능한 유일한 기록이다.

### `job` — 제작 잡티켓

```json
"job": { "order":"EVS-1007", "customer":"Naekyung Seong", "product":"Package Full",
         "material":"White Matte", "mode":"package", "size_mm":null, "sheets":2,
         "quantity":1, "photos":14, "sticker_name":"", "notes":[] }
```

재질·사이즈는 SKU 문자열 안에 인코딩돼 있다 (`EVS-PACKAGE-FULL-WM`). 그대로 두면 **읽는
쪽마다 SKU 해석기를 한 벌씩** 갖게 되고 (일러스트·포토샵·CLI), 규칙이 바뀔 때 하나만
빠뜨려도 **틀린 재질로 인쇄된다.** 그래서 해석은 인테이크에서 한 번만 하고 결과를 박아둔다.

- `mode` = `single` (그때만 `size_mm`) · `package` (그때만 `sheets`) · `all`(Mixed → 전 사이즈)
- **한 값으로 안 좁혀지면 채우지 않고 `notes` 에 이유를 남긴다.** line item 이 여럿이고
  재질이 엇갈리면 임의로 하나를 고르는 순간 절반이 틀린 재질로 나간다.
- 일러스트(`Everstory_mixed.jsx`)는 `job` 이 있으면 그대로 쓰고, 없으면(구 매니페스트)
  SKU 를 직접 해석한다. 두 경로가 같은 값을 내는지는 `sim/ordertest.js` 가 **python
  `build_job` 을 실제로 호출해 교차 검증**한다.
- 이미 받아둔 주문은 `--backfill-job` 으로 채운다 (매니페스트 안의 값만 쓰므로 토큰 불필요).

### `shipping` — 배송지

```json
"shipping": { "name":"Neuri Park", "address1":"53 Angus Dr", "address2":null,
              "city":"North York", "provinceCode":"ON", "zip":"M2J 2W9",
              "countryCodeV2":"CA", "phone":null, "company":null }
```

`read_orders` 스코프로 같이 온다 (추가 스코프 없음). **개인정보이므로 `.gitignore` 에
`**/_order.json` 으로 못 박아 뒀다.**

**받는 사람이 주문자와 다르면 선물이다** — 실제로 `EVS-1007` 이 그렇다 (주문 Naekyung Seong /
배송 Neuri Park). 인테이크가 콘솔에 `⚠ 주문자와 다름 (선물)` 로 알리고, 일러스트 다이얼로그도
경고를 띄운다. **헤더에 누구 이름을 넣을지는 자동으로 정하지 않는다** — 운영자가 고를 일이다.

`--backfill-job` 은 배송지를 못 채운다 (구 매니페스트에 없던 값이라 API 를 다시 불러야 한다).

### `--labels` — 주소 라벨 텍스트

`shipping` 을 `Everstory_address_labels.jsx` 가 읽는 형식으로 뽑는다. 빈 줄로 구분된
블록 하나가 라벨 한 장, `#` 줄은 주석이다.

```
# EVS-1007
Naekyung Seong
123 Main St W
Unit 4
Toronto ON  M5V 2T6
```

- **캐나다 국내 우편에는 국가명 줄을 넣지 않는다** (Canada Post 권고 — 넣으면 국제 우편으로
  오분류될 수 있다). 국가코드가 `CA` 가 아닐 때만 마지막 줄에 붙는다.
- 우편번호·주(province)는 대문자로 정규화한다. 이름·거리는 원래 대소문자를 지킨다 —
  전부 대문자는 OCR 용 관행이라 수제 브랜드 라벨에는 과하다.
- **주문번호를 나열한 순서가 곧 칸 순서다.** 폴더 정렬로 바꾸지 않는다.
- 배송지가 없거나 거리 주소(`address1`)가 비면 **조용히 빼지 않고 이유를 찍는다.**
  주소 없는 라벨이 인쇄되면 소포가 안 간다.
- 산출 파일은 고객 주소다 — `.gitignore` 에 `**/_labels.txt` 로 못 박아 뒀다.

인쇄 방식(칼선 선 일괄 · 인쇄 후 분할)과 그 위험·완화책은 `../../CLAUDE.md` Phase C 참조.

## 리네임 규칙과 그 이유

`{NN}_{TOKEN}_{원본명}.{ext}`

**토큰은 상품 유형에 따라 두 종류다. 둘 다 주문 데이터에서 나온다.**

| 상품 | 사이즈가 어디에 | 토큰 |
|---|---|---|
| Package Full / Mini | 속성 키 `Big/Medium/Small print` | `BIG` `MED` `SML` |
| Face / Full Body / Shape | **SKU** (`EVS-FACE-19-WM` → 19mm) | `XS` `S` `M` `L` `XL` `XXL` |
| 위 상품의 `Mixed` 옵션 | — (전 사이즈 모드로 제작) | 없음 |
| SKU 없는 초기 주문 | 옵션 라벨 `Photos to include (19mm)` | 위와 동일 |

SKU 사이즈 코드 ↔ 티어: `19`→XS(0.75") · `25`→S(1") · `32`→M(1.25") · `38`→L(1.5") · `51`→XL(2") · `64`→XXL(2.5") · `MIX`→토큰 없음.

우선순위는 **버킷 → SKU → 옵션 라벨**. 어느 것도 없으면 토큰 없이 두고 **추측하지 않는다**.

- **버킷이 파일명에 있다** — `Big print` / `Medium print` / `Small print` 속성 키에서
  온다. 지금은 이 정보가 포토샵 단계에서 버려지고 운영자가 티어 버튼으로
  손수 재발명하고 있다. 파일명에 박아두면 안 잃는다.
- **버킷 순으로 정렬된다** — BIG 먼저, 그 다음 MED, SML. 같은 티어를 몰아서
  처리하게 되니 버튼 오클릭이 준다.
- **원본 파일명을 남긴다** — 고객이 "세 번째 사진 잘못 보냈어요" 할 때 대조용.
- **주문 메타는 파일명이 아니라 매니페스트로** — Easify 기본 이름
  (`EVS-1007 Package Full 48719608938752 Big print 8aeade09-…-IMG_6425.jpeg`, 90자)
  대비 훨씬 짧으면서 추적성은 더 좋다.

단일 사이즈 SKU(Face Sticker 등)는 버킷이 없어 `01_IMG_1242.jpg` 가 된다.

## 실데이터에서 밟은 함정 (되돌리지 말 것)

1. **`_` 접두 속성을 전부 거르면 안 된다.** 초기 주문(`#1001`~`#1004`)은 사진 키가
   `_Photos` 다. `_tpo_add_by` 만 콕 집어 제외한다 (`JUNK_KEYS`).
2. **키 모양이 SKU 마다 다르다.** Package Full = `Big print-N`,
   Face Sticker = `Photos-N`. `KEY_TO_BUCKET` 에 없는 사진 키는 조용히 추측하지 않고
   버킷 없이 받은 뒤 리포트에 올린다.
3. **URL 확장자를 믿으면 안 된다.** 매직바이트로 실제 포맷을 판정해서 저장한다.
   HEIC 면 변환하지 않고 **경고만** 한다 (CLAUDE.md 의 "방어 코드 추가 금지").
4. **URL 형식이 두 가지다.** 신 `uploads/{uuid}-{name}`, 구 `uploads/YYYYMM/{epoch_ms}-{name}`.
   둘 다 접두를 벗겨야 사람이 읽을 이름이 나온다. 퍼센트 인코딩도 푼다.

### 진행 열이 안 보여주는 것

**인쇄·발송(Phase C)은 디스크에 흔적이 남지 않는다.** 시트 `.ai` 가 나온 뒤 실제로 뽑았는지,
컷했는지, 보냈는지는 어디에도 기록이 없고 **추측해서 채우지 않는다.** 진행 열의 마지막
칸이 `시트` 인 이유다. 이걸 표시하려면 손으로 상태를 남기는 단계가 새로 필요한데,
손으로 갱신하는 상태는 반드시 실제와 어긋난다 — 지금은 그 대가를 치르지 않기로 했다.

## 검증

```bash
python3 progress_test.py     # 진행 표시 (임시 폴더에 실파일 생성, 네트워크 없음)
python3 job_test.py          # job 백필 왕복 + 배송지 추출
python3 label_test.py        # 주소 라벨 — 빈 필드 조합·국내/국제·선택 순서
```

`label_test.py` 는 Shopify 배송지에서 자주 비는 필드(`company`·`address2`·`provinceCode`·
`zip`)의 조합을 고정한다. python 이 쓴 파일을 `.jsx` 파서가 그대로 읽는지는
`sim/labeltest.js` 가 **양쪽을 실제로 실행해** 교차검증한다 (`ordertest.js` 와 같은 방식).

`progress_test.py` 는 `project_progress` / `fill_progress` / `summary_note` 를 실제 파일로
검증한다 — 페어 한쪽만 있는 경우, 한글 파일명(NFD), 사진 아닌 파일, 사진 0장 주문 등
**폴더 규약이 어긋나면 보드가 조용히 거짓말하는** 경계들이다.

`intake.py` 의 순수 함수(`original_basename` / `split_key` / `sniff_format`)는
실주문 URL 5종·키 5종·매직바이트 5종으로 확인했다. 네트워크 없이 재현 가능하다.
