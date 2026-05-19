# Everstory — Photography Direction

> Shopify product / hero / about 이미지 큐레이션. 기존 시트 mockup 활용 + iPhone 추가 촬영 (cream linen 무드). 펫 직접 촬영은 금지 (고객 사진이 hero).

## Shot list (iPhone 추가 촬영)

| # | 샷 | 용도 | 노트 |
|---|-----|------|------|
| 1 | Cream linen 천 위 시트 평면샷 | Home hero, Product hero | 자연광 11AM 동향 창. 섀도우는 부드럽게 spillover, harsh edge 금지. |
| 2 | 손이 시트 모서리 잡고 살짝 들어올림 | Product hero alt, About | 손은 화면 1/4 비율. 손톱 깔끔, 액세서리 없음. |
| 3 | 스티커 1장 backing 에서 떼낸 tactile 컷 | Product detail, "How it works" 2단계 | macro. backing 종이 결이 보일 정도. |
| 4 | 노트북에 붙인 lifestyle | Size Guide (1") | 실내 자연광. 노트북은 silver / space grey. |
| 5 | 저널/다이어리 표지에 붙인 lifestyle | Size Guide (1.25") | 크림/베이지 저널 권장. 펜 옆에 같이. |
| 6 | 폰케이스에 붙인 lifestyle | Size Guide (0.75") | 무광 단색 케이스. |
| 7 | 칼선 + 라미네이션 macro detail | About process strip | 사이드 라이팅으로 lamination 광택 표현. |
| 8 | 작업대 wide shot (PSD 화면 + 시트 + 손) | About hero | studio 분위기. 모니터에 PSD 가 보이되 고객 얼굴 인식 안 되게. |
| 9 | Before→After (원본 사진 → 완성 시트) | Product carousel 상단(2번 슬롯) + Product description | #1 의 SKU 시트 결과 컷 + 이미 소싱한 샘플 피사체 원본 1장을 split frame. 신규 펫 촬영 아님 (원본은 화면/출력물 형태). 커스텀 제품 핵심 설득 컷. |

**총 9 컷, 1 일 촬영 가능.** (#9 는 #1 결과물 + 기소싱 원본 합성이라 추가 촬영 시간 거의 없음.) 자연광 의존이라 맑은 날 11AM-2PM 박스 잡기.

## 컬러 그레이딩

- **WB**: 5400K (warm white). cool / blue 톤 금지.
- **Highlights**: slight desat (-10), 흰색 시트가 푸르스름하지 않게.
- **Shadows**: lift +5, 디테일 보존하되 회색이 너무 어둡지 않게.
- **Saturation**: -5 to -10 (전체 약간 desat — luxury 톤 보존).
- **Contrast**: 원본 ±0. 대비 강하게 주지 않음 (인쇄 시트 톤이 원래 부드러워서).

iPhone 기본 사진 앱의 "Mellow" 또는 Lightroom 의 "Modern 04" 가 출발점으로 가까움. 그대로 쓰지 말고 위 4개 축 미세조정.

## 배경 / 소품 (Do)

- Cream linen, off-white cotton, raw wood (oak / ash) 표면
- 베이지 / 크림 / 무광 화이트 저널, 연필, 손
- 자연광 (11AM-3PM, indirect)
- 자유로운 여백 (시트가 화면 30-50% 만 차지)

## 배경 / 소품 (Don't)

- **펫 / 사람 직접 촬영** — 고객 사진이 hero 이므로 우리 측 촬영본은 *시트와 환경* 만. 펫 모델 컷 금지.
- 형광 / 네온 / 컬러풀 배경
- harsh flash, 직접 햇빛 (정오 직사광)
- 한국 전통 소품 (한지, 도자기, 한복 일부) — Toronto local craft 앵글과 톤 충돌
- 너무 차가운 monitor / metal 표면 (warm 톤 깨짐)
- 필터 무드 (Instagram 80년대 분위기 / 비비드 / 흑백)
- 펫 dad/mom 미는 hashtag 식 소품 (귀여움 과잉)

## 출력 스펙

| 슬롯 | 비율 | 사이즈 (px) | 포맷 | 품질 |
|------|------|-----------|------|------|
| Home hero | 16:9 | 2400×1350 | JPG | 90% |
| Product hero | 1:1 | 2000×2000 | JPG | 90% |
| Before→After | 1:1 | 2000×2000 | JPG | 90% |
| Product gallery | 4:5 | 1600×2000 | JPG | 90% |
| Lifestyle / detail | 3:4 | 1500×2000 | JPG | 90% |
| About hero (wide) | 21:9 | 2520×1080 | JPG | 90% |
| Open Graph | 1.91:1 | 1200×630 | JPG | 85% |
| Instagram 1:1 | 1:1 | 1080×1080 | JPG | 85% |

원본은 ProRAW (iPhone Pro 모델) 또는 HEIF, 편집 후 JPG export.

## 보관

- 원본 (raw) : `assets/photo_raw/{YYYYMMDD}_{shotN}.heic`
- 편집본 (export) : `assets/photo/{slot_name}.jpg` (예: `home_hero.jpg`, `product_hero_solo.jpg`)
- ZIP 백업: 분기별 외장 SSD
