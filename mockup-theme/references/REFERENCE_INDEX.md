# Reference Index

이 폴더의 이미지는 모두 사용자가 제공한 입력 자료다. 외부 스타일 레퍼런스가 아니라 제품 사실과 규격을 확인하는 용도로 사용한다.

## 제품 자료

| ID | 파일 | 크기 | 상태 | 역할 | 금지 |
|---|---|---:|---|---|---|
| `REF_FACE_SHEET_01` | [`product/face-sticker-a5-sheet.png`](product/face-sticker-a5-sheet.png) | 1254×1254 | user-approved input | Face Sticker A5 시트, 얼굴, 4×5 배열, White Matte 표현 | 얼굴 재생성, 배열 변경, 빈 구멍 생성 |
| `REF_FULL_BODY_SHEET_01` | [`product/full-body-sticker-a5-sheet.png`](product/full-body-sticker-a5-sheet.png) | 3000×3000 | user-approved input | Full Body Sticker A5 시트, 전신, 5×4 배열, 1.5in/38mm | 포즈·옷·신체 변경, 배열 변경 |
| `REF_FULL_BODY_SCALE_01` | [`product/full-body-fingertip-scale.png`](product/full-body-fingertip-scale.png) | 1254×1254 | supporting input | 전신 외곽, 흰색 칼선, 사용 크기 보조 | 손가락 구도 복제, 배경 재사용 |

## 규격 자료

| ID | 파일 | 크기 | 상태 | 역할 | 금지 |
|---|---|---:|---|---|---|
| `REF_FACE_SPEC_01` | [`spec/face-sticker-product-page.png`](spec/face-sticker-product-page.png) | 2880×1800 | user-approved input | Face Sticker 크기 옵션과 White Matte 제품 형태 확인 | 웹 UI, 가격, 버튼 또는 상품 페이지를 결과에 포함 |

## 우선순위

1. Face 얼굴 및 시트: `REF_FACE_SHEET_01`
2. Full Body 전신 및 시트: `REF_FULL_BODY_SHEET_01`
3. Face 크기 옵션: `REF_FACE_SPEC_01`
4. Full Body 물리 표현 보조: `REF_FULL_BODY_SCALE_01`

## 체크섬

```text
c47b148f107d2c7f1a36c09ef4fc0198cb203340d38799ba6bcf813cc30ecec4  face-sticker-a5-sheet.png
85a569fe7867fdb4b64195098f085d3500bc3dd2290a02c6b923d65669538c28  full-body-fingertip-scale.png
5881eb2778ff4ada0dc28cde73d37e120fcb517d6c3cde5c87b3b65d983d4faf  full-body-sticker-a5-sheet.png
cb6b5eedb70fbaf669478dc7645be1b39caff256c651e6428291467701636d47  face-sticker-product-page.png
```

## ChatGPT 첨부 순서

1. `face-sticker-a5-sheet.png`
2. `full-body-sticker-a5-sheet.png`
3. `full-body-fingertip-scale.png`
4. `face-sticker-product-page.png`

첨부한 뒤 [`../prompts/00_REFERENCE_LOCK.md`](../prompts/00_REFERENCE_LOCK.md)를 실행한다.

