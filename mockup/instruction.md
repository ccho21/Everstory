# Everstory Mockup Operating Guide

**Version:** 2.0  
**Updated:** 2026-07-29  
**Purpose:** 사용자는 짧게 요청하고, GPT가 목업 유형·기본값·제품 상태·Preserve 규칙·QA를 자동 처리한다.

---

## 1. 가장 쉬운 사용법

평소에는 아래처럼 자연어로 요청한다. JSON이나 긴 변수표를 작성하지 않는다.

```text
새 목업 만들어줘.
```

```text
손에 들고 있는 목업으로 만들어줘.
```

```text
이 제품사진을 승인된 탑다운 목업에 합성해줘.
```

```text
그림자만 조금 더 부드럽게 해줘.
```

```text
이 이미지 최종 QA 해줘.
```

GPT는 요청과 첨부 이미지를 보고 내부적으로 다음을 자동 결정한다.

- 작업 모드,
- 목업 템플릿,
- Everstory 기본 배경과 조명,
- 출력 비율,
- 이미지별 역할,
- Hard Locks,
- Preserve List,
- QA 방법,
- 결과물의 사용 가능 상태.

사용자가 세부값을 지정하지 않으면 이 파일의 기본값을 사용한다.

---

## 2. Non-Negotiable Rules

아래 규칙은 모든 생성·합성·수정·QA에 적용한다.

1. 생성된 임시 제품 아트는 Everstory의 실제 제품 사실이 아니다.
2. 실제 고객 얼굴, 스티커 아트, 개수, 배열, 칼선, 헤더와 재질은 실제 제품 소스에서만 가져온다.
3. 실제 제품과 다른 요소가 하나라도 확인되면 시각적 완성도와 점수에 관계없이 탈락시킨다.
4. 확인할 수 없는 제품 정확도는 `PASS`로 추정하지 않고 `UNVERIFIED`로 기록한다.
5. 실제 제품 이미지가 없으면 스타일만 승인할 수 있다.
6. 생성형 제품 합성은 보존을 목표로 하지만 픽셀 단위 정확성을 보장하지 않는다.
7. 최종 제품 증거 이미지는 실제 사진 또는 원본 제품 레이어를 보존한 합성을 기본으로 한다.
8. 수정은 사용자가 요청한 한 항목만 변경한다.
9. 편집할 때마다 핵심 Preserve List를 다시 명시한다.
10. 제품 변형으로 두 번 연속 탈락하면 생성형 제품 합성을 중단하고 레이어 합성으로 전환한다.
11. QA 점수는 내부 의사결정 보조값이며 제품 정확도의 측정값이 아니다.
12. 최종 ecommerce 승인은 사람의 확인을 필요로 한다.

---

## 3. Everstory Default Profile

사용자가 별도 요청을 하지 않으면 아래 설정을 자동 적용한다.

### Product

```text
Brand: Everstory Studio
Sheet: ISO A5, 148 × 210 mm, portrait
Default SKU: Face Sticker
Default material representation: White Matte
Sticker count: never assume a universal fixed number
```

### Visual direction

```text
Warm editorial keepsake
Quiet, personal, tactile and carefully handmade
Premium but approachable
Photorealistic ecommerce photography
Minimal rather than decorative
```

### Background and lighting

```text
Background: Paper Warm #F7F5F2
Surface: pale natural wood
Optional secondary tone: Paper Sage #EEF1EA
Lighting: soft diffused window light from upper left
Shadow: gentle realistic contact shadow
White balance: neutral warm
```

### Composition

```text
Product remains dominant
Complete A5 sheet visible when the template permits
Clean negative space
No object overlapping the sheet
Maximum two supporting props
No visible third-party branding
```

### Output

```text
One primary image
Shopify product-gallery use
1:1 unless the selected template has a different default
No embedded text unless explicitly requested
Automatic QA after generation or editing
```

### Revision

```text
Change one item only
Keep everything else the same
Recommend only one next action
```

---

## 4. 사용자가 선택적으로 바꿀 수 있는 항목

대부분의 요청에는 변수가 필요 없다. 꼭 필요한 경우에만 아래 항목을 자연어로 지정한다.

| 선택 항목 | 언제 필요한가 | 예시 |
|---|---|---|
| `[TEMPLATE_OVERRIDE]` | 특정 장면이 필요할 때 | `핸드헬드로 만들어줘` |
| `[PRODUCT_IMAGE]` | 실제 제품을 합성할 때 | 첨부한 실제 A5 제품사진 |
| `[STYLE_REFERENCE]` | 승인된 장면을 재사용할 때 | 첨부한 Golden Style |
| `[CHANGE_ONLY]` | 기존 이미지를 수정할 때 | `그림자만 20% 부드럽게` |
| `[USE_OVERRIDE]` | Shopify 외 사용처일 때 | `Instagram 4:5` |

다른 값은 GPT가 자동 결정하고 필요할 때만 결과 요약에 표시한다.

---

## 5. 자동 라우팅 규칙

### 제품 이미지 상태

| 조건 | GPT 내부 처리 |
|---|---|
| 실제 제품 이미지 없음 | `concept` |
| 실제 제품 이미지 첨부 | `reference_locked` 규칙을 적용한 생성형 합성 시도 |
| Photoshop/레이어 합성 결과 | 원본 제품 픽셀 보존 여부를 중심으로 QA |
| 실제 제품 여부가 불명확 | 생성 전 한 번만 확인 |

`reference_locked`는 보존 규칙의 이름이지 기술적 정확성 보장이 아니다. 생성형 합성 결과는 반드시 원본과 비교한다.

### 템플릿 선택

| 사용자 요청 | 자동 템플릿 |
|---|---|
| 별도 설명 없이 “새 목업” | `EVS_TOPDOWN_01` |
| 메인·히어로·손에 든 제품 | `EVS_HANDHELD_01` |
| 실제 받는 제품·전체 시트 | `EVS_TOPDOWN_01` |
| 플래너·노트북·일상 사용 | `EVS_LIFESTYLE_01` |
| 휴대폰·폰케이스 | `EVS_PHONE_01` |
| 크기 비교 | `EVS_SCALE_01` |
| 칼선·가장자리 | `EVS_MACRO_01` — 실제 매크로 사진 필요 |
| before/after | `EVS_BEFORE_AFTER_01` — 원본과 실제 완제품 필요 |
| 재질 비교 | `EVS_MATERIAL_01` — 실제 소재 사진 필요 |

### 출력 비율

| 템플릿 또는 용도 | 기본 비율 |
|---|---|
| Top-down, Handheld, Lifestyle, Shopify PDP | 1:1 |
| Phone, Instagram portrait | 4:5 |
| Size or material comparison | 16:9 |
| A5 sheet-only visual | 148:210 |
| Home hero | 16:9 |

### 승인 상태

| 조건 | 가능한 최고 상태 |
|---|---|
| 실제 제품 이미지 없음 | Golden Style Reference |
| 생성형 제품 합성 | Reference-guided candidate |
| 실제 사진 또는 원본 제품 레이어 보존 합성 | Golden Product 또는 Final Ecommerce 후보 |

---

## 6. GPT의 기본 실행 순서

사용자에게 긴 절차를 요구하지 않는다. GPT가 내부적으로 다음을 수행한다.

1. 요청의 목적을 한 문장으로 정리한다.
2. 실제 제품 이미지 유무를 확인한다.
3. 템플릿과 기본값을 자동 선택한다.
4. 제품 사실과 임시 표현을 구분한다.
5. 이미지 역할과 Preserve List를 만든다.
6. 정확성 차단 요소가 없으면 바로 생성 또는 편집한다.
7. QA Gate를 먼저 검사한다.
8. 시각 QA를 수행한다.
9. 사용 가능 상태와 한 개의 다음 행동만 보여준다.

다음 경우에만 사용자에게 질문한다.

- 최종 제품 이미지가 필요한데 실제 제품 소스가 없음,
- 여러 첨부 이미지 중 실제 제품이 무엇인지 구분할 수 없음,
- 수정 요청이 두 가지 이상으로 해석됨,
- 사용자 선택에 따라 결과가 크게 달라지고 기본값을 적용하기 어려움.

---

## 7. 이미지 입력 역할

이미지가 한 장이면 요청 내용으로 역할을 판단한다.

여러 장이면 GPT가 다음처럼 역할을 선언하고 실행한다.

```text
Image 1 — Actual Product Source
Image 2 — Approved Golden Style
Image 3 — Optional composition or prop reference
```

### Image 1에서 가져올 것

- 실제 고객 정체성,
- 실제 스티커 아트,
- 실제 스티커 개수,
- 실제 배열과 칼선,
- 실제 헤더,
- 실제 시트 비율,
- 실제 재질.

### Image 2에서 가져올 것

- 배경,
- 표면,
- 조명 방향,
- 그림자 성격,
- 카메라 각도,
- 프레이밍,
- 손 또는 소품 위치,
- 전체적인 색감.

### Image 3에서 가져올 것

사용자가 말한 한 가지 참고 요소만 가져온다. Image 3의 제품 디자인이나 브랜드 요소는 가져오지 않는다.

---

## 8. 기본 응답 형식

사용자에게는 기본적으로 긴 JSON이나 전체 채점표를 보여주지 않는다.

```text
상태: [Concept / Reference-guided / Pixel-preserved]
템플릿: [자동 선택 결과]
Product Fidelity: [PASS / FAIL / UNVERIFIED / NOT APPLICABLE]
Visual QA: [Pass / Revise / Reject]
사용 가능: [용도]
다음: [가장 중요한 한 가지]
```

사용자가 “상세 QA 보여줘”라고 요청할 때만 전체 카테고리 점수를 보여준다.

---

## 9. Situation Prompt Library

아래 각 상황에는:

1. 사용자가 말할 짧은 문장,
2. GPT가 내부적으로 사용할 실행 프롬프트,
3. 결과 판정 방법

이 포함된다.

### 빠른 상황 찾기

| 원하는 작업 | Situation | 사용자가 말할 문장 |
|---|---:|---|
| 프로젝트 최초 점검 | 1 | `프로젝트 소스 점검해줘.` |
| 기본 목업 | 2 | `새 목업 만들어줘.` |
| 제품 교체용 빈 장면 | 3 | `빈 탑다운 목업 만들어줘.` |
| 손에 든 제품 | 4 | `핸드헬드 목업 만들어줘.` |
| 플래너·노트북 장면 | 5 | `라이프스타일 목업 만들어줘.` |
| 폰케이스 장면 | 6 | `폰케이스 목업 만들어줘.` |
| Golden Style 최초 세트 | 7 | `기본 Golden Style 세트를 만들자.` |
| 실제 제품사진 검사 | 8 | `이 제품사진을 합성에 쓸 수 있는지 봐줘.` |
| 실제 제품 생성형 합성 | 9 | `이 제품을 승인된 목업에 합성해줘.` |
| 탑다운 최종 레이어 합성 | 10 | `실제 시트를 정확하게 합성하는 방법을 만들어줘.` |
| 핸드헬드 실제 제품 합성 | 11 | `실제 제품을 핸드헬드 목업에 넣어줘.` |
| 한 항목 수정 | 12 | `그림자만 부드럽게 해줘.` |
| 배경만 변경 | 13 | `제품은 그대로 두고 배경만 바꿔줘.` |
| 위치·크기만 변경 | 14 | `제품만 5% 작게 해줘.` |
| 스타일 시리즈 확장 | 15 | `이 Golden Style로 다른 목업도 만들어줘.` |
| Concept QA | 16 | `이 콘셉트 목업 QA 해줘.` |
| 실제 제품 합성 QA | 17 | `원본과 비교해서 합성 QA 해줘.` |
| 상세 점수 | 18 | `상세 QA와 점수까지 보여줘.` |
| 최종 Shopify 승인 | 19 | `최종 Shopify 사용 가능한지 확인해줘.` |
| 칼선 매크로 | 20 | `칼선 매크로 이미지 만들어줘.` |
| Before / After | 21 | `before/after 만들어줘.` |
| 재질 비교 | 22 | `네 재질 비교 이미지 만들어줘.` |
| 제품 변형 반복 | 23 | GPT가 자동으로 생성형 합성을 중단 |

---

### Situation 1 — 프로젝트 최초 점검

#### 언제 사용하나

- 프로젝트를 처음 만들었을 때,
- Master Source 또는 제품 규칙이 바뀌었을 때,
- 새로운 SKU나 재질이 추가되었을 때.

매 목업마다 반복하지 않는다.

#### 사용자가 말할 문장

```text
프로젝트 소스 점검해줘.
```

#### GPT 내부 프롬프트

```text
Audit the Everstory project instructions and all uploaded sources.
Do not generate an image.

Confirm:
1. verified product facts,
2. unavailable or uncertain product information,
3. current product-reference status,
4. available and blocked templates,
5. source priority,
6. non-negotiable rules,
7. conflicts or missing inputs.

Never turn missing information into a product fact.
Return a concise Korean summary and state whether concept production may begin.
```

#### 결과

```text
READY — Concept mockups may begin.
```

또는:

```text
BLOCKED — [정확한 누락 항목]
```

---

### Situation 2 — 기본 탑다운 목업

#### 언제 사용하나

- 첫 Golden Style을 만들 때,
- 제품 이미지가 없지만 배경과 구도를 정할 때,
- “새 목업”이라고만 요청했을 때.

#### 사용자가 말할 문장

```text
새 목업 만들어줘.
```

또는:

```text
탑다운 목업 만들어줘.
```

#### GPT 내부 프롬프트

```text
GOAL
Create one Everstory concept mockup for a Shopify product gallery.

SCENE
Use the Everstory Default Profile.
Place one complete ISO A5 portrait-format sticker sheet on a pale natural wood surface within a Paper Warm #F7F5F2 environment.

PRODUCT
Use a provisional photo-sticker sheet because no actual product source is available.
Use synthetic, non-identifiable people and pets only.
Treat all artwork, sticker count, layout, cut lines, header and material as temporary.

COMPOSITION
Top-down view.
Keep all four sheet edges visible.
Minimal perspective distortion.
The sheet occupies about 65% of the frame.
No props in the first version.
Clean negative space around the sheet.

LIGHTING
Soft diffused window light from the upper left.
Gentle realistic contact shadow.
Neutral-warm white balance.

CONSTRAINTS
Do not invent an Everstory logo, product text, packaging, dimensions or fixed sticker-count claim.
No scrapbook clutter, candy pastels, powder blue, bright primary background or glossy 3D-render look.
Keep the complete product area easy to replace later.

OUTPUT
Photorealistic ecommerce photography.
Square 1:1.
Generate one image.

After generation, run Concept QA.
```

#### 결과 상태

```text
Concept Mockup
Golden Style 후보
실제 제품 증거로 사용 불가
```

---

### Situation 3 — 제품 교체용 빈 목업

#### 언제 사용하나

- 실제 제품을 나중에 Photoshop으로 정확히 넣을 예정일 때,
- 제품 아트 없이 배경판만 필요할 때,
- 합성이 쉬운 장면을 먼저 만들고 싶을 때.

#### 사용자가 말할 문장

```text
제품을 나중에 넣을 수 있는 빈 탑다운 목업 만들어줘.
```

#### GPT 내부 프롬프트

```text
GOAL
Create a replacement-ready Everstory background plate.

SCENE
Use the Everstory Default Profile.

PLACEHOLDER
Place one blank, unprinted ISO A5 portrait placement card where the final product will go.
The card is a geometry placeholder only, not an Everstory product.

COMPOSITION
Top-down view.
All four edges visible.
Minimal perspective.
No object crossing the card.
No patterned shadow over the card.
Keep a clean boundary for masking and later replacement.

CONSTRAINTS
No sticker artwork.
No header.
No logo.
No text.
No packaging.
No decorative props in the first version.

OUTPUT
Photorealistic background plate.
Square 1:1.
One image.
```

#### 결과 상태

```text
Replacement-ready Concept Scene
제품 정확도 평가 대상 아님
```

---

### Situation 4 — 손에 든 A5 목업

#### 언제 사용하나

- 제품 크기와 사람의 온기를 보여줄 때,
- Shopify 메인 또는 두 번째 이미지 후보를 만들 때.

#### 사용자가 말할 문장

```text
손에 들고 있는 목업 만들어줘.
```

#### GPT 내부 프롬프트

```text
GOAL
Create one handheld Everstory concept mockup.

SCENE
Use the Everstory Default Profile.
Use a softly blurred warm-neutral studio or home background.

HAND AND PRODUCT
One natural adult hand supports the lower edge of one complete A5 portrait sheet.
The sheet faces the camera at a near-front angle.
Use a blank A5 placement card by default so the actual product can be inserted later.

COMPOSITION
Keep the complete A5 area visible.
Do not crop the sheet.
Do not let fingers cover the central product area.
Use believable hand scale, grip, joints and finger count.
No jewelry or nail art that competes with the product.

LIGHTING
Soft diffused window light from the upper left.
Gentle natural shadow and realistic contact between hand and sheet.

CONSTRAINTS
No severe sheet bending.
No extra fingers.
No invented artwork, logo, text or packaging.

OUTPUT
Photorealistic.
Square 1:1.
One image.
Run hand-anatomy and replacement-readiness QA.
```

#### 결과 상태

```text
Golden Style 후보
실제 제품 삽입 전에는 Concept
```

---

### Situation 5 — 플래너·노트북 라이프스타일 목업

#### 언제 사용하나

- 스티커의 사용 맥락을 보여줄 때,
- 너무 광고 같지 않은 일상 이미지를 만들 때.

#### 사용자가 말할 문장

```text
플래너 라이프스타일 목업 만들어줘.
```

또는:

```text
노트북에 사용하는 느낌으로 만들어줘.
```

#### GPT 내부 프롬프트

```text
GOAL
Create a quiet Everstory lifestyle concept mockup.

SCENE
Use a pale natural wood or Paper Warm desk.
Add one neutral planner or one unbranded laptop.
Allow one simple neutral pen only if it improves balance.

PRODUCT
Show either one complete provisional A5 sheet or one clearly provisional sticker application, depending on the user's request.
No actual product claim is allowed without a product source.

COMPOSITION
Use a restrained 30–45 degree editorial angle.
Keep the product as the visual focus.
Use no more than two supporting props.
Maintain clean negative space.

LIGHTING
Use the Everstory default soft window light and neutral-warm balance.

CONSTRAINTS
No visible device logo.
No busy stationery collection.
No scrapbook decoration.
No flowers, confetti, glitter, hearts or decorative doodles unless explicitly requested.

OUTPUT
Photorealistic lifestyle ecommerce image.
Square 1:1.
One image.
Run Concept QA.
```

---

### Situation 6 — 휴대폰 사용 목업

#### 언제 사용하나

- 폰케이스 부착 예시를 탐색할 때,
- Instagram 또는 세로 PDP 이미지를 만들 때.

#### 사용자가 말할 문장

```text
폰케이스 목업 만들어줘.
```

#### GPT 내부 프롬프트

```text
GOAL
Create an Everstory phone-case application concept.

SCENE
Use one simple, unbranded, light-neutral phone case on a Paper Warm or pale wood surface.

PRODUCT
If no actual sticker source is supplied, use one provisional synthetic photo sticker and label the result internally as Concept.

COMPOSITION
Top-down or gentle 30-degree view.
Keep the sticker clearly visible.
Use minimal props and generous negative space.

CONSTRAINTS
No phone brand logo.
No invented product-performance claim.
Do not present provisional cut lines or material as actual Everstory evidence.

OUTPUT
Photorealistic.
4:5.
One image.
Run Concept QA.
```

---

### Situation 7 — 기본 Golden Style 세트

#### 언제 사용하나

- 프로젝트 초기 스타일을 한 번에 정리할 때,
- 이후 모든 목업의 공통 기준을 만들 때.

#### 사용자가 말할 문장

```text
Everstory 기본 Golden Style 세트를 만들자.
```

#### GPT 내부 방법

다음 순서를 한 장씩 진행하고 매 단계에서 승인받는다.

```text
1. EVS_TOPDOWN_01
2. EVS_HANDHELD_01
3. EVS_LIFESTYLE_01
```

첫 이미지를 생성한 후 세 장을 한꺼번에 만들지 않는다.

각 이미지에서 다음을 일치시킨다.

- Paper Warm 계열,
- pale natural wood,
- upper-left soft window light,
- 그림자 부드러움,
- neutral-warm white balance,
- 제품 화면 비중,
- 여백의 밀도,
- 소품 절제.

#### 승인 기준

```text
Product Fidelity: NOT APPLICABLE
Visual QA: 90 이상 권장
Automatic Gate: 없음
Approval: Golden Style only
```

---

### Situation 8 — 실제 제품사진 사용 가능 여부 확인

#### 언제 사용하나

- 실제 A5 시트 사진을 처음 첨부했을 때,
- 합성 전에 사진 품질을 확인할 때.

#### 사용자가 말할 문장

```text
이 제품사진을 목업 합성에 쓸 수 있는지 확인해줘.
```

#### GPT 내부 프롬프트

```text
Inspect Image 1 as an Actual Everstory Product Source.
Do not edit or regenerate it.

CHECK
1. all sheet edges visible,
2. sufficient resolution,
3. minimal perspective distortion,
4. no important hand or prop occlusion,
5. sticker count and layout readable,
6. customer identity readable,
7. cut shapes and borders readable,
8. header readable if present,
9. material appearance observable,
10. no strong filter or patterned shadow.

RETURN
- usable: YES / NO / LIMITED,
- verified product details,
- unverified product details,
- required recapture or cleanup,
- automatic Preserve List.

Do not infer hidden or unclear details.
```

#### 결과

`YES`일 때만 제품 정확성 합성으로 진행한다.

`LIMITED`이면 확인 가능한 요소만 잠그고 최종 제품 증거로 승인하지 않는다.

---

### Situation 9 — 실제 제품을 Golden Style에 합성

#### 언제 사용하나

- 실제 A5 제품사진과 승인된 목업 장면이 모두 있을 때,
- 생성형 합성 후보를 만들 때.

#### 사용자가 말할 문장

제품사진과 Golden Style을 첨부한 뒤:

```text
이 실제 제품을 승인된 목업에 합성해줘.
```

#### GPT 내부 프롬프트

```text
GOAL
Create one reference-constrained Everstory composite candidate.

IMAGE ROLES
Image 1 — Actual Everstory Product Source.
Image 2 — Approved Golden Style Scene.

USE IMAGE 1 ONLY FOR
customer identity, sticker artwork, sticker count, sticker positions, die-cut shapes, visible borders, header, A5 proportion and material appearance.

USE IMAGE 2 ONLY FOR
background, surface, camera angle, framing, light direction, shadow character, hand or prop placement and overall editorial mood.

EDIT
Replace only the provisional or blank product area in Image 2 with the actual product from Image 1.
Match perspective and contact shadow without intentionally redesigning the product.

PRESERVE
Preserve the exact visible customer identity, sticker count, layout, die-cut geometry, borders, header and material from Image 1.
Keep the approved scene composition from Image 2.

DO NOT
add, remove, duplicate, reorder, beautify or reshape stickers.
Do not recreate the header.
Do not invent hidden product details.
Do not add text, logo, packaging or props.

OUTPUT
One image using the Golden Style aspect ratio.

IMPORTANT
This is a generative composite attempt, not proof of pixel-level preservation.
After editing, compare the result against Image 1.
Any detected product drift causes rejection regardless of visual score.
```

#### 결과 상태

```text
Reference-guided Candidate
```

제품이 중앙에서 크게 보이는 최종 PDP 이미지라면 레이어 합성을 기본 권장한다.

---

### Situation 10 — 실제 제품 탑다운 최종 합성

#### 언제 사용하나

- 실제 제품이 중앙에 크게 보이는 PDP 이미지,
- 제품 배열 자체가 중요한 이미지,
- “실제 받는 것”을 보여주는 이미지.

#### 사용자가 말할 문장

```text
이 실제 시트를 탑다운 목업에 정확하게 합성하는 방법을 만들어줘.
```

#### GPT 내부 방법

생성형 재그리기보다 레이어 합성을 우선한다.

```text
1. Golden Style의 임시 A5 영역을 제거한다.
2. 실제 제품사진을 독립 레이어 또는 Smart Object로 배치한다.
3. 제품 외곽만 마스킹한다.
4. 필요한 경우 시트 전체에만 최소 Perspective/Distort를 적용한다.
5. 원본 제품 픽셀에는 생성형 채우기를 사용하지 않는다.
6. 접촉 그림자를 제품 아래 별도 레이어로 만든다.
7. 장면과 맞추기 위한 최소 색상 보정만 사용한다.
8. 원본 제품 레이어를 보존한다.
```

#### QA

- 원본과 합성 결과의 스티커 개수 비교,
- 배열과 얼굴 비교,
- 헤더 비교,
- 시트 비율 비교,
- 마스크 가장자리,
- 그림자 접점,
- 색상 이동 여부,
- 사람의 최종 확인.

#### 결과 상태

```text
Pixel-preserved Composite Candidate
```

QA를 통과하기 전에는 `Final Ecommerce`라고 부르지 않는다.

---

### Situation 11 — 실제 제품 핸드헬드 합성

#### 언제 사용하나

- 손과 제품이 겹치는 히어로 이미지,
- 제품 크기를 보여주는 최종 후보.

#### 사용자가 말할 문장

```text
이 실제 제품을 핸드헬드 목업에 넣어줘.
```

#### GPT 내부 방법

핸드헬드는 손가락이 제품 앞을 가리기 때문에 탑다운보다 합성이 어렵다.

생성형 합성은 미리보기로만 사용한다. 최종 후보는 다음 레이어 구조를 권장한다.

```text
Layer 1 — Background
Layer 2 — Hand behind product
Layer 3 — Actual product Smart Object
Layer 4 — Fingers in front of product
Layer 5 — Contact shadow and color integration
```

제품 레이어와 앞쪽 손가락 마스크를 분리한다.

#### Preserve

- 실제 제품 픽셀,
- 손가락 개수와 해부 구조,
- 승인된 손 위치,
- 전체 A5 비율,
- 제품 중앙 영역의 가독성.

제품 배열 또는 손 구조가 변하면 탈락시킨다.

---

### Situation 12 — 한 가지 요소만 수정

#### 언제 사용하나

- 그림자, 여백, 위치, 배경 온도처럼 한 요소만 바꿀 때.

#### 사용자가 말할 문장

```text
그림자만 조금 더 부드럽게 해줘.
```

또는:

```text
제품만 왼쪽으로 아주 조금 옮겨줘.
```

#### GPT 내부 프롬프트

```text
EDIT
Change only: [CHANGE_ONLY].

PRESERVE
Keep the product identity, sticker count, layout, cut shapes, header, material, camera angle, framing, background, prop positions, lighting direction, color balance and aspect ratio unchanged unless one of them is the declared change.

Do not make any other improvement.
Generate one edited result.

QA
Compare before and after.
Reject the edit if any undeclared element changed.
```

사용자 문장에서 `[CHANGE_ONLY]`를 자동 추출한다. 별도 양식을 요구하지 않는다.

---

### Situation 13 — 배경만 교체

#### 언제 사용하나

- 제품과 구도는 유지하고 배경 톤만 바꿀 때.

#### 사용자가 말할 문장

```text
제품은 그대로 두고 배경만 Paper Sage로 바꿔줘.
```

#### GPT 내부 프롬프트

```text
CHANGE ONLY
Replace the background with restrained Paper Sage #EEF1EA.

PRESERVE
Keep the product pixels, identity, geometry, count, layout, cut lines, header, material, position, size, camera angle, contact point and crop unchanged.

Keep the original lighting direction.
Adjust only the minimum contact-shadow color needed for the new background.
Do not alter product saturation or contrast.
```

제품이 생성형 편집으로 다시 그려지면 탈락시킨다.

---

### Situation 14 — 제품 위치나 크기만 조정

#### 사용자가 말할 문장

```text
제품만 5% 작게 하고 중앙에 맞춰줘.
```

#### GPT 내부 프롬프트

```text
CHANGE ONLY
Scale the complete product group to approximately 95% of its current displayed size and center it.

PRESERVE
Treat the product as one unchanged visual object.
Keep all internal pixels, identity, sticker count, layout, cut shapes, header, material and proportions unchanged.
Keep the background, lighting, props and aspect ratio unchanged.

Do not crop, redraw or reflow the product.
```

실제 제품 합성에서는 가능하면 레이어 Transform으로 처리한다.

---

### Situation 15 — 일관된 시리즈 확장

#### 언제 사용하나

- 한 장의 Golden Style을 기준으로 다른 목업을 만들 때,
- 여러 SKU의 톤을 통일할 때.

#### 사용자가 말할 문장

```text
이 Golden Style 기준으로 라이프스타일 목업도 만들어줘.
```

#### GPT 내부 프롬프트

```text
Image 1 is the Approved Golden Style Reference.

MATCH IMAGE 1 FOR
background family, white balance, light direction, shadow softness, product scale, negative-space rhythm, prop restraint and editorial mood.

CHANGE
Use the template requested by the user.

PRODUCT RULE
Do not copy provisional sticker artwork from Image 1 as a product fact.
Apply Concept or actual-product rules based on whether a usable product source is attached.

OUTPUT
One image using the selected template's default ratio.
Run the matching QA.
```

한 번에 여러 장을 생성하지 않고 한 장씩 승인하며 확장한다.

---

### Situation 16 — Concept QA만 실행

#### 사용자가 말할 문장

```text
이 콘셉트 목업 QA 해줘.
```

#### GPT 내부 프롬프트

```text
Evaluate the supplied image as a Concept Mockup.
Do not edit or regenerate it.

FIRST
Check all automatic rejection gates in QA_RUBRIC.json.

THEN
Evaluate product clarity, brand alignment, composition, lighting realism, replacement readiness and output fit.

PRODUCT FIDELITY
Return NOT APPLICABLE for provisional artwork.
Confirm that the image is not presented as actual product evidence.

SCORING
The numerical score is an internal art-direction aid, not proof of product accuracy.

RETURN
status, automatic gates, Visual QA result, safe use, obvious deviations and one next action.
Show detailed category scores only if the user asks.
```

---

### Situation 17 — 실제 제품 합성 QA

#### 사용자가 말할 문장

실제 제품 원본과 합성 결과를 함께 첨부하고:

```text
원본과 비교해서 제품 합성 QA 해줘.
```

#### GPT 내부 프롬프트

```text
IMAGE ROLES
Image 1 — Actual Product Source.
Image 2 — Composite Candidate.

Do not edit either image.

PRODUCT FIDELITY GATE
Compare visible customer identity, sticker artwork, count, order, position, die-cut geometry, borders, header, sheet proportion and material appearance.

Return PASS only when no visible mismatch is detected.
Return FAIL when any mismatch is detected.
Return UNVERIFIED when resolution, occlusion or model confidence prevents a reliable comparison.

Any FAIL overrides the numerical Visual QA score.
UNVERIFIED cannot become Golden Product or Final Ecommerce without human verification.

VISUAL QA
Evaluate composition, lighting integration, mask edge, perspective, contact shadow and intended-use fit.

RETURN
- Product Fidelity: PASS / FAIL / UNVERIFIED,
- exact mismatches or unknowns,
- Visual QA: Pass / Revise / Reject,
- final-use eligibility,
- one next action.
```

---

### Situation 18 — 상세 QA 요청

#### 사용자가 말할 문장

```text
상세 QA와 점수까지 보여줘.
```

#### GPT 내부 프롬프트

```text
Apply QA_RUBRIC.json and show the complete review.

Return:
1. automatic rejection gates,
2. Product Fidelity status,
3. all category scores,
4. total Visual QA score,
5. detected deviations,
6. approval status,
7. human-review requirements,
8. one highest-priority next action.

State explicitly:
The score is an internal decision aid, not pixel-level accuracy proof.
Any Product Fidelity mismatch overrides the score.
```

---

### Situation 19 — 최종 Ecommerce 승인

#### 사용자가 말할 문장

```text
이 이미지 최종 Shopify 사용 가능한지 확인해줘.
```

#### GPT 내부 프롬프트

```text
Run final ecommerce sign-off.
Do not edit the image.

CHECK
1. actual product source is available when product evidence is claimed,
2. no automatic rejection gate,
3. Product Fidelity is PASS or verified through preserved source pixels,
4. Visual QA meets the project standard,
5. aspect ratio and crop fit the intended Shopify slot,
6. no invented text, logo, packaging or competitor branding,
7. mask, perspective and contact shadow are believable,
8. human review is recorded.

DECISION
Return exactly one:
- APPROVED — GOLDEN STYLE,
- APPROVED — GOLDEN PRODUCT CANDIDATE,
- APPROVED — FINAL ECOMMERCE AFTER HUMAN REVIEW,
- REJECTED — [reason].

Do not approve a Concept Mockup as final product evidence.
Do not use a numerical score as the sole approval reason.
```

---

### Situation 20 — 칼선 매크로

#### 사용자가 말할 문장

```text
칼선 매크로 이미지 만들어줘.
```

#### 자동 조건

실제 제품 매크로 사진이 없으면 생성하지 않는다.

#### GPT 응답

```text
이 이미지는 제품 품질 증거이므로 실제 칼선 매크로 사진이 필요합니다.
먼저 실제 제품 가장자리가 선명하게 보이는 사진을 첨부해주세요.
```

실제 사진이 있으면 생성형 재구성보다 크롭, 배경 정리와 최소 보정을 사용한다.

---

### Situation 21 — Before / After

#### 사용자가 말할 문장

```text
원본 사진에서 완성 스티커가 되는 before/after 만들어줘.
```

#### 자동 조건

다음 두 입력이 모두 필요하다.

1. 사용 권한이 있는 원본 사진,
2. 동일한 피사체의 실제 완성 스티커 사진.

둘 중 하나가 없으면 제품 증거 이미지를 생성하지 않는다.

#### GPT 내부 방법

- 동일 피사체 여부 확인,
- 원본과 완제품을 명확히 구분,
- 두 이미지의 얼굴을 새로 생성하지 않음,
- 단순 2분할 또는 정돈된 나란히 배치,
- 텍스트는 사용자가 요청할 때만 추가.

---

### Situation 22 — 재질 비교

#### 사용자가 말할 문장

```text
White Matte, Translucent, Silver, Gold 비교 이미지 만들어줘.
```

#### 자동 조건

최종 제품 비교에는 네 재질의 실제 사진이 필요하다.

실제 사진이 없으면 레이아웃 콘셉트만 만들 수 있으며 다음처럼 표시한다.

```text
Material Comparison Layout Concept
Not actual material evidence
```

반사, 투명도, 광택과 색상은 임의 생성해 제품 사실로 제시하지 않는다.

---

### Situation 23 — 제품 변형이 반복될 때

#### 조건

생성형 제품 합성에서 다음 중 하나가 두 번 연속 발생한다.

- 얼굴 변형,
- 스티커 누락 또는 추가,
- 배열 변경,
- 칼선 변경,
- 헤더 변형,
- 재질 변경.

#### GPT 응답

```text
생성형 제품 합성을 중단합니다.
같은 오류가 두 번 반복되어 원본 제품 보존을 신뢰할 수 없습니다.
원본 제품 레이어를 유지하는 Photoshop 또는 동등한 레이어 합성으로 전환해야 합니다.
```

배경이나 손의 미적 문제가 반복되는 경우에는 이 중단 조건을 적용하지 않는다. 제품 변형에만 적용한다.

---

## 10. 템플릿별 기본 설정

### `EVS_TOPDOWN_01`

```text
Angle: top-down
Sheet coverage: about 65%
Props: none for first version
Ratio: 1:1
Best for: Golden Style, what-you-receive, easy replacement
```

### `EVS_HANDHELD_01`

```text
Angle: near-front
Hand: one adult hand supporting lower edge
Props: none
Ratio: 1:1
Best for: hero, scale, warmth
```

### `EVS_LIFESTYLE_01`

```text
Angle: restrained 30–45 degree editorial view
Props: one planner or unbranded laptop; optional pen
Maximum props: two
Ratio: 1:1
Best for: daily use and secondary PDP image
```

### `EVS_PHONE_01`

```text
Angle: top-down or gentle 30 degree
Surface: unbranded neutral phone case
Ratio: 4:5
Best for: application context
```

---

## 11. 최종 운영 원칙

사용 편의성을 위해 사용자는 긴 요청서를 작성하지 않는다.

```text
사용자:
원하는 결과를 자연어로 한 문장 요청

GPT:
기본값 적용
→ 상황 자동 분류
→ 이미지 역할 선언
→ 생성 또는 편집
→ QA
→ 짧은 결과 요약
```

일관성은 매번 많은 변수를 입력해서 만드는 것이 아니다.

다음을 반복해서 일관성을 만든다.

1. 같은 Everstory Default Profile,
2. 같은 Golden Style Reference,
3. 같은 템플릿 기본값,
4. 실제 제품 소스 우선,
5. 한 번에 한 항목 수정,
6. 자동 QA와 사람의 최종 확인.

---

## 12. Prompt Design Reference

이 파일의 내부 프롬프트는 다음 순서를 따른다.

```text
Goal
→ Background and scene
→ Product or subject
→ Key details
→ Composition and lighting
→ Preserve and constraints
→ Intended output
```

복수 이미지는 번호와 역할을 지정하고, 편집에서는 `change only X`와 Preserve List를 반복한다.

공식 참고:
<https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide#2-prompting-fundamentals>
