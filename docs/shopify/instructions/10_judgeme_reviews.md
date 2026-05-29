# Batch 10 — Judge.me Product Reviews (Forever Free)

Judge.me Forever Free 플랜으로 상품 리뷰 + 고객 실사용 사진(UGC) 수집을 켠다. 결정 근거·대안은 [`../plan.md`](../plan.md) "외부 피드백 반영" 참조 (피드백 #6 — 프로덕트별 리뷰 + UGC 사진).

- **Previous batch**: [`09_qa_launch.md`](09_qa_launch.md)
- **Next batch**: —
- **Reference**: Judge.me Shopify App Store listing, Judge.me Help Center.
- **Plan basis**: Forever Free.

**무료 티어 범위 (이 batch 가 다루는 것)**

| 포함 (Forever Free) | 제외 (= $15/mo Awesome) |
|---------------------|--------------------------|
| 무제한 리뷰·리뷰요청 이메일 | 비디오 리뷰 |
| 사진 리뷰 (고객 UGC 사진) | Q&A (상품 질문) |
| SEO rich snippet (별점 구조화 데이터) | 리뷰 캐러셀 위젯 |
| CSV import, 기본 위젯 커스텀 | 풀 CSS 제어, 리뷰 그룹핑, AI 요약 |
| Review Widget · Preview Badge · All Reviews | "Powered by Judge.me" 배지 제거 |

> 이 walkthrough 는 제외 항목(비디오/Q&A/캐러셀)을 켜지 않는다. 나중에 Awesome 으로 올리면 그 항목만 추가하면 된다.

## ⚠️ 시작 전

- 이 스토어 Horizon 테마는 **GitHub sync 켜짐** (Theme Editor Save = 자동 commit). Step 10.4 의 테마 편집은 **Unpublished theme** 에서 진행하고, 동시에 다른 곳에서 테마를 편집 중이면 충돌 주의.
- 시작 전 점검:
  - [ ] Shopify admin 접근 권한
  - [ ] 스토어 기본 언어 = English (리뷰 요청 이메일 언어와 맞춤)
  - [ ] 작업 대상 = Unpublished theme (라이브 아님)

## Step 10.1 — 앱 설치

1. Shopify admin → 좌측 **Apps** → **Shopify App Store** 검색창.
2. `Judge.me Product Reviews` 검색 → 공식 앱 (Judge.me ⭐ Product Reviews & UGC) 선택.
3. **Install** 클릭 → 권한 승인.
4. 설치 후 plan 선택 화면에서 **Forever Free** 선택 (유료 플랜 권유 화면에서 "Continue with Free" / "Stay on Free" 경로).

✅ **Checkpoint**: Judge.me 대시보드가 열리고, 상단/Settings 의 현재 플랜이 **Forever Free** 로 표시.

## Step 10.2 — 핵심 설정 (Settings)

Judge.me 대시보드 → **Settings** 에서:

| 설정 | 값 |
|------|----|
| Plan | `Forever Free` |
| Review requests (자동 이메일) | `On` |
| Request timing | 주문 **fulfillment 후 7일** (배송 도착 즈음) |
| Photo in reviews | `Enabled` — 고객이 사진 첨부하도록 |
| Star rating + photos 강조 | `On` |
| Reply / new-review notification | `On` (관리자 알림) |
| Email language | `English` |
| Video reviews | `Off` (무료 미포함) |
| Q&A | `Off` (무료 미포함) |

✅ **Checkpoint**: Settings 저장 후 "Review requests: On", "Photo reviews: Enabled" 상태 확인.

## Step 10.3 — 리뷰 요청 이메일 카피

Judge.me → **Settings → Review requests → Email content** 에 아래 카피 붙여넣기. 사진 첨부를 명시적으로 권유한다 (UGC 가 목표). 톤 SOT = [`../../design/voice.md`](../../design/voice.md).

**Subject**

```
How did your Everstory stickers turn out?
```

**Body**

```
Hi {{ customer_name }},

Thanks for ordering from Everstory. We'd love to see how your photo stickers turned out.

Leave a quick review — and if you can, add a photo of your stickers in real life. Real photos help other customers picture their own keepsakes.

It takes less than a minute. Thank you for being part of the story.
```

✅ **Checkpoint**: 미리보기에서 별점 선택 + "Add a photo" 업로드 버튼이 이메일/리뷰 폼에 보임.

## Step 10.4 — Horizon 상품 페이지에 위젯 배치

Judge.me 설치 시 테마에 **app embed + app blocks** 가 추가된다. Theme Editor 에서 노출 위치를 잡는다.

> ⚠️ 아래 작업은 **Unpublished theme** 에서. Save 시 GitHub 자동 commit.

**(a) App embed 활성화**

1. Online Store → Themes → (작업 theme) → **Customize**.
2. 좌측 하단 **App embeds** (콘센트/퍼즐 아이콘) 클릭.
3. **Judge.me** 토글 → `On`.

**(b) 별점 배지 (제목/가격 근처)**

1. 상단 페이지 선택 드롭다운 → **Products → Default product** 템플릿.
2. 우측 product information 영역에서 제목/가격 블록 아래 **Add block** → **Apps** → `Judge.me Preview Badge` 선택.
3. 드래그해서 가격 바로 아래로 이동.

**(c) 리뷰 위젯 (상품 정보 하단)**

1. 같은 product 템플릿에서 product 섹션 하단 **Add block** → **Apps** → `Judge.me Review Widget` 선택.
2. 상품 설명 아래, 추천/관련 상품 위로 배치.

> `Judge.me Reviews Carousel` 은 Awesome 전용 → 무료에서는 추가하지 않는다.

3. **Save**.

✅ **Checkpoint**: 상품 페이지 preview 에서 — 가격 아래 별점 배지(리뷰 0개면 "No reviews yet" 또는 빈 별), 상품 설명 아래 리뷰 위젯 영역이 보임.

## Step 10.5 — 시딩 / 임포트 (선택)

- **기존 리뷰 이전**: Judge.me → **Import** → CSV 업로드 (무료 플랜 CSV import 지원).
- **런칭 시 리뷰 0개**: 첫 실주문 fulfillment 후 자동 요청 이메일로 자연 수집. 초기엔 샘플을 받은 지인/베타 고객에게 **사진 포함 리뷰**를 요청해 갤러리를 비우지 않게 한다.

## 종료 검증 체크리스트

- [ ] 앱 플랜 = Forever Free
- [ ] Review requests = On, 타이밍 = fulfillment 후 7일
- [ ] Photo reviews = Enabled
- [ ] 요청 이메일 subject/body 가 사진 첨부를 권유
- [ ] App embed (Judge.me) = On
- [ ] 상품 페이지: 가격 아래 Preview Badge + 하단 Review Widget 노출
- [ ] 테스트 주문 1건 fulfill → 7일 후(또는 수동 트리거) 요청 이메일 수신 확인
- [ ] 테스트 리뷰 1건(사진 포함) 작성 → 위젯·별점 배지에 반영

## 🛟 자주 막히는 지점

| 증상 | 원인 · 해결 |
|------|-------------|
| 위젯이 상품 페이지에 안 보임 | App embeds 에서 Judge.me 토글 Off → On. 그래도 안 보이면 product 템플릿에 Review Widget 블록이 실제로 추가됐는지 확인 |
| 별점 배지가 가격에서 멀리 떨어짐 | Preview Badge 블록을 가격 블록 바로 아래로 드래그. Horizon 의 블록 순서는 좌측 트리에서 이동 |
| 요청 이메일이 안 나감 | Settings → Review requests = On 인지, 주문이 **fulfilled** 상태인지 확인 (fulfillment 기준 타이밍). 수동으로 "Send now" 로 테스트 |
| 리뷰에 사진 업로드 칸이 없음 | Photo reviews = Enabled 확인. 무료 플랜은 사진 OK, 비디오는 미지원 |
| "Powered by Judge.me" 배지 노출 | 무료 플랜 사양 (제거 = Awesome). 런칭 단계에선 그대로 둔다 |
| 캐러셀 위젯이 안 보임 | 캐러셀은 Awesome 전용. 무료에서는 Review Widget + Preview Badge 만 사용 |
