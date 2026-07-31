# Everstory Product Gallery — Reference Router

이 파일은 reference 세부 정보를 저장하지 않는다. 현재 작업 SKU에 맞는
Reference Index로 연결하는 역할만 한다.

## Active SKU rule

한 채팅에서는 하나의 SKU만 active로 지정한다.

| Active SKU | Reference Index | Product Brief |
|---|---|---|
| Face Sticker | `FACE_STICKER_REFERENCE_INDEX.md` | `FACE_STICKER_PRODUCT_BRIEF.md` |
| Full Body Sticker | `FULL_BODY_STICKER_REFERENCE_INDEX.md` | `FULL_BODY_STICKER_PRODUCT_BRIEF.md` |

## Isolation rules

- Face Sticker 채팅에서는 Face Sticker의 reference만 제품 자료로 사용한다.
- Full Body Sticker 채팅에서는 Full Body Sticker의 reference만 제품 자료로 사용한다.
- `DSCF0365.jpg`는 Full Body Sticker actual photo다.
- `DSCF0365.jpg`는 Face Sticker의 actual product evidence가 될 수 없다.
- 다만 사용자가 승인한 Face Slot 01 angled 작업에서는 `Physical Scene Base`로
  사용할 수 있다. 이 예외는 구도·원근·곡률·접지 그림자에만 적용되며
  Full Body 인쇄면과 제품 사실은 모두 폐기한다.
- 이 예외로 만든 Face 결과는 `reference_guided_composite`다.
- 다른 SKU reference가 프로젝트에 존재한다는 이유만으로 자동 참조하지 않는다.
- cross-SKU 비교는 사용자가 명시적으로 요청한 merchandising audit에서만 허용한다.

## Shared sources

다음은 두 SKU가 공통으로 사용한다.

- `shared/EVERSTORY_PRODUCT_GALLERY_SOURCE.md`
- `shared/GALLERY_SYSTEM.md`
- `shared/QA_RUBRIC.json`
- `shared/style-references/angled-sheet-warm-gray-v1.png`

마지막 이미지는 `GOLDEN_STYLE_ANGLED_01`이며 구도·배경·조명만 안내한다.
그 안의 Face Sticker artwork, 텍스트, 개수와 QR은 다른 SKU의 제품 사실이 아니다.
