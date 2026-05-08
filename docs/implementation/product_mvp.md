# Everstory MVP Photo Sticker Sheet

## 상품 정의

Everstory 의 첫 주력 상품은 고객 사진을 중심으로 만드는 **A5 커스텀 사진 다이컷 스티커 시트** 다.

핵심 원칙:
- 사진이 85~90% 를 차지한다.
- 고객 이름은 상단 production header 의 주문 정보로 표기한다.
- 별도 이름 스티커는 현재 Name Included 시트에 넣지 않는다.
- 미니 데코는 후순위 보조 요소다.
- 문구 스티커는 MVP 에서 제외한다.
- 자유배치가 아니라 자동화 가능한 구조를 유지한다.

## 참고 분류

스크립트가 직접 다루는 영역은 **모양 (Shapes)** — 다이컷 칼선과 A5 시트 레이아웃. 재질·대상은 입력 단계 컨텍스트로만 기록한다.

### 재질 (Materials)
- **일반**: 흰색 (다이어리, 패키징용)
- **방수**: 흰색 / 펄그레이 / 은색 / 금색 (텀블러, 폰케이스, 야외용)
- **반투명**: 답례품, 유리병 (은은한 비침)

### 대상 (Subjects)
- **인물/생물**: 사람, 반려동물
- **텍스트**: 캘리그라피, 네임택
- **그래픽**: 로고, 아이들 그림, 애착 사물, 풍경/건물

### 모양 (Shapes)

칼선 (per-sticker) + 시트 레이아웃 두 축으로 분해.

**Cutline 종류** (개별 스티커):

| 종류 | 설명 | 현재 지원 | 확장 시 접근 |
|------|------|-----------|--------------|
| **다이컷** | 피사체 외곽선 따라 자름 — PNG trace | ✓ 현재 기본 (`_traceAndUnite`) | — |
| **기본도형** | 원·하트·사각형 등 고정 도형 | ✗ | 템플릿에 도형 path 라이브러리 + 셀 크기로 스케일 (PNG trace 우회) |
| **프레임 (가운데 타공)** | 폴라로이드형, 외곽 + 내곽 compound path | ✗ | template 에 외곽+내곽 정의된 도형, 사진은 PrintData 에 그대로 |

**시트 레이아웃**:

| 레이아웃 | 설명 | 현재 지원 | 확장 시 접근 |
|----------|------|-----------|--------------|
| **A5 스티커 시트** | A5 판형 (body 142×175mm), 11인치 롤 폭 활용 | ✓ `Everstory_mixed_v2.jsx` (운영 메인) | — |

**현재 파이프라인 범위**: 다이컷 × A5 스티커 시트 자동화. 기본도형/프레임 칼선 확장은 추후 단계. PhotoStrip 은 MVP 외.

## 상품 모드

### Name Included

대표 MVP 모드. 사진 중심 배치를 유지하면서 상단 production header 에 고객 이름과 주문 정보를 표기한다.

이름은 스티커 아이템이 아니라 header metadata 로만 사용한다. 헤더 아래 영역은 사진 스티커로만 채운다.

**운영 메인은 `Everstory_mixed_v2.jsx`** (v2 브랜드 템플릿용, v20). packing 알고리즘은 [packing_internals.md](packing_internals.md) 참조.

### Name + Mini Decor

후순위 확장 모드. 미니 데코 소량을 추가한다.

미니 데코는 사진보다 중요하지 않으며, 빈 공간을 보완하는 정도로만 사용한다.

## 운영 규칙

- A5 한 시트 상품으로 운영한다.
- 넘치는 사진은 자동 분할하지 않고 디자인 cap (사이즈별 auto-cap) 으로 입력 단계에서 제한한다.
- 스티커 크기는 **긴 변 기준 인치 6단계 + Mixed**: XS 0.75" / S 1" / M 1.25" / L 1.5" / XL 1.75" / XXL 2.5" / Mixed (1.75/1.5/1.25/1in 4 사이즈, 1.25" 두 배 비중). 기본 S (1"). 칼선/사진간격은 mm 유지 (인치 환산 시 0.0394" 같은 숫자가 어수선해서).
- 파일명 `_NNmm` 사이즈 override 는 폐지. 다이얼로그 dropdown 으로 사이즈 통일 선택.
- 디자인 cap (auto-cap): XS 13 / S 7 / M 5 / L 3 / XL 3 / XXL 1 / Mixed 1. 사이즈 변경 시 ListBox 선택이 cap 초과면 자동 trim.
- 칼선 여백 0/0.5/1/2mm 는 고객 선택지가 아니라 내부 제작 옵션 (기본 1mm).

## 제외 항목

- phrase / 문구 스티커
- 이름 스티커 (단독 아이템)
- PhotoStrip / 인생네컷 배치 상품
- 다중 시트 자동 분할 상품

## 구현 상태

- **`Everstory_mixed_v2.jsx` (운영 메인, v20)**: v2 브랜드 템플릿 (`template_cutout_v2.ait`). 폴더 → 페어 ListBox multiselect → 단일 사이즈 (XS/S/M/L/XL/XXL) 또는 Mixed → 시트 생성 → `03_output/` 자동 저장. `info > body` 142×175mm + `info > header > header_right` TextFrame `.contents` 만 inplace 주입 (브랜드 로고/라벨/푸터는 .ait 정적). 우측 정렬 2줄: `{N} photos * {sizeLetter} / {inch} / {cut}mm  *  {material}` / `Name add-on * Order date {date}`. 고객명/주문번호는 다이얼로그에 남겨두고 파일명·메타용으로만 사용.
- **`Everstory_CleanOffsetPath.jsx`**: 수동 Offset Path 검수 중 생긴 내부 조각 제거 보조 도구.
- Mini Decor: 후순위 확장.
