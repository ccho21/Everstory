# Everstory Doctor v1

상품 규칙, 주문 매니페스트, 원본/누끼 페어, 출력물, 90일 보존 후보, 백업,
디스크, 회귀 테스트를 한 번에 읽어 stdout으로 보고한다. Doctor 자체는 프로젝트 파일을
생성·수정·삭제하지 않으며 Shopify에도 접속하거나 쓰지 않는다.

## 실행

```bash
# 전체 검사: SHA-256 + 임시 샌드박스 회귀 테스트 포함
python3 scripts/doctor.py

# 자동화가 읽기 쉬운 동일 리포트
python3 scripts/doctor.py --json

# 빠른 상태 확인: 테스트와 원본 해시만 생략
python3 scripts/doctor.py --skip-tests --skip-hash

# Doctor 합성 회귀 테스트만 실행
python3 -B scripts/doctor_test.py
```

리포트는 파일로 저장하지 않는다. 필요하면 호출자가 명시적으로 stdout을 리다이렉트한다.

종료 코드는 다음과 같다.

| 코드 | 의미 |
|---:|---|
| `0` | `FAIL` 없음 |
| `1` | 한 개 이상의 `FAIL`; `--strict`에서는 `WARN`/`UNKNOWN`도 포함 |
| `2` | 잘못된 CLI 인자 |

`--json` 출력에는 `schema_version: 1`이 있다. 화면 메시지 대신 `sections[].key`,
`findings[].code`, `findings[].status`를 자동화 계약으로 사용한다.

## 상태 의미

| 상태 | 의미 |
|---|---|
| `FAIL` | 파일 손상, half-pair, 해시/job 불일치, 테스트 실패처럼 제작을 막아야 하는 문제 |
| `WARN` | 확인·정리가 필요하지만 정보가 충분한 문제 |
| `UNKNOWN` | 판단에 필요한 provenance, fulfillment, marker 등이 없음 |
| `OK` | 검사한 범위에서 일치 |
| `SKIP` | 의도적으로 검사하지 않았거나 로컬에서 증명할 수 없는 항목 |

기본 모드는 `WARN`과 `UNKNOWN`만 있을 때 exit `0`이다. 운영 게이트나 CI처럼 미확정도
실패로 다뤄야 하는 곳에서는 `--strict`를 사용한다.

## 검사 범위

### 상품 규칙 드리프트

- 상품 SOT인 `docs/business/products.md`와 Shopify PDP 문서의 런칭 상품 4종, 가격,
  사이즈 7종, 재질 4종, Package 업로드/pick/선택 수/시트 수를 비교한다.
- `scripts/order_intake/intake.py`와 `Everstory_mixed.jsx`의 SKU, 재질, 사이즈,
  Package 시트, 버킷 상수를 비교한다.
- 알려진 상품 수, 세척 카피, 배송 설정 문서 충돌을 보고한다.
- Easify의 실제 업로드 개수 설정은 공개 상품 JSON으로 확인할 수 없으므로
  `LIVE_EASIFY_NOT_CHECKED`로 남긴다. 이 값은 별도 브라우저 계약 테스트 대상이다.

### 주문 매니페스트와 산출물

- `_order.json`의 핵심 컨테이너 타입, 사진 순번/경로/line item, file/unavailable 상태,
  원본 크기와 SHA-256, 미참조·중복 원본을 확인한다.
- 매니페스트의 `job`을 현재 `intake.build_job()`으로 다시 계산해 저장값과 비교한다.
- `_clean.psd`와 `_sil.png`의 basename 페어, PSD/PNG signature, 픽셀 크기를 확인한다.
- 원본과 누끼 사이에는 현재 영구 provenance가 없다. 순번과 개수가 모두 맞아도
  `SOURCE_PAIR_MAPPING_INFERRED=UNKNOWN`, 그 외에는 `SOURCE_PAIR_MAPPING=UNKNOWN`으로
  보고하며 둘 다 검증된 매핑으로 취급하지 않는다.
- 최신 timestamp batch의 AI 시트 번호/수와 job을 비교하고, 매니페스트나 누끼가 AI보다
  새로우면 stale 경고를 낸다. 과거 batch까지 포함한 전체 `.ai` 개수를 기대 시트 수로
  오인하지 않는다.

### 90일 후보

- fulfillment 시각이 있을 때만 정확한 90일 후보(`RETENTION_OVERDUE_CANDIDATE`)로 분류한다.
- fulfillment가 없으면 어떤 파일도 삭제 가능하다고 판정하지 않는다. 모든 최근 산출물
  mtime이 90일을 넘긴 프로젝트는 수동 확인용 `AGE_REVIEW_CANDIDATE`일 뿐이다.
- `retention_hold` 또는 `privacy_hold`가 있으면 자동 삭제 대상이 아니라고 경고한다.
- Doctor는 어떤 경우에도 파일을 삭제하지 않는다.

### 백업 노후도

백업 폴더의 최근 파일 mtime은 마지막 성공을 뜻하지 않는다. 백업 작업이 완전히 성공한
뒤에만 갱신하는 marker 파일을 명시한다.

```bash
python3 scripts/doctor.py --backup-marker /absolute/path/.everstory-backup-ok

# 여러 marker는 경로 구분자(`:` on macOS)로 전달할 수도 있다.
EVERSTORY_BACKUP_MARKERS=/path/local-ok:/path/offsite-ok python3 scripts/doctor.py
```

기본값은 24시간 초과 `WARN`, 72시간 초과 `FAIL`이다. 각각
`--backup-warn-hours`, `--backup-fail-hours`로 조정한다. marker는 백업 작업의 heartbeat일
뿐 복원 성공을 증명하지 않으므로 정기 restore test는 별도로 필요하다.

### 디스크와 테스트

- 디스크는 여유가 **20GiB 미만 또는 10% 미만**이면 `WARN`, **5GiB 미만 또는 5% 미만**이면
  `FAIL`이다. APFS purgeable 공간은 구분하지 않는다.
- 기존 Node/Python 회귀 테스트와 Doctor 자체 테스트까지 14개를 시스템 임시 폴더에 복사해
  실행한다. 저장소의 generated `sim/packer*.js`는 만들거나 덮어쓰지 않는다.
- 실행 전후 root의 파일·디렉터리 size/mtime snapshot을 비교해 변경이 있으면
  `ROOT_MUTATED=FAIL`로 보고한다.

## 개인정보 경계

텍스트와 JSON 리포트에는 주문번호 또는 익명 `project-xxxxxxxx`만 표시한다. 고객명,
이메일, 주소, 사진 URL, 파일명, 원본 warning/error 문자열, 백업 경로는 출력하지 않는다.
검사기가 예외를 내도 예외 타입만 기록하고 원본 메시지는 숨긴다.

## 주요 옵션

```text
--projects-dir PATH          기본 ROOT/projects 대신 점검할 경로
--retention-days N          기본 90일
--backup-marker PATH        여러 번 지정 가능
--disk-warn-gb N            기본 20
--disk-fail-gb N            기본 5
--disk-warn-percent N       기본 10
--disk-fail-percent N       기본 5
--skip-tests                회귀 테스트 생략
--skip-hash                 원본 SHA-256 재계산 생략
--json                      JSON stdout
--strict                    WARN/UNKNOWN도 exit 1
```
