# Personal Planning — Strategy

본 문서는 [`facts.md`](facts.md) 의 raw 를 input 으로 하는 의사결정 + 메커니즘 + 계산 방법론. 구체 시뮬레이션 숫자는 회계사 상담 후 facts 정확값으로 본인이 계산.

## 1. 핵심 결정 — 권장 path

### 1.1 콘도 처분: 임대 + Section 45(2) election ★

**Why:**
- 콘도 시세 < 매수가 (loss 상태) → PRE 보존 가치 없음 (gain 이 없으니 면제할 게 없음)
- 매각 시 Personal Residence loss 는 비공제 (ITA 40(2)(g)(iii)) — 영구 손실
- 임대 시: 모기지 이자 100% rental expense + T4 income 상계 + 4년간 PRE 자격 유지

**Why not 매각:**
- Loss 영구 손실
- 다운페이먼트 거의 다 잃음
- 회복 가능성 옵션 포기

**Why not 임대 + election 없이:**
- Change in use 시 deemed disposition at FMV → 새 ACB = 임대 시점 FMV
- 이후 회복분 전액 rental capital gain 으로 과세 (ITA 45(1)(a))

### 1.2 새 집: 렌트 + 큰 2+1 또는 3-bed + Sheppard 권역

**Why:**
- ITA 54.1 자영업자 적용 불가 → 새 집 위치는 세금 무관
- 진짜 변수: 두 사람 통근 합 + 가족 편의 + 한인 커뮤니티 + 콘도 관리 거리
- Sheppard 권역이 통근·임대료·한인 네트워크 균형

### 1.3 사업 공간: 베드룸 1 전용 (마스터 권장)

**Why:**
- 사업 *전용* 공간이면 시간 비율 적용 X, 면적 비율만
- 마스터 = 큰 면적 → BUOH 공제 비율 ↑
- Summa D75 + ET-8550 + 자재 박스 다 들어갈 공간 필요

### 1.4 Tesla 사업 전환: 조건부 — Business use % 측정 후

**Why:**
- 실제 사업 사용 (자재 픽업, drop-off, 미팅) 있음 → 자격 충족
- 단 Business % 5–7% 면 ROI borderline, 10%+ 면 가치 명확
- 우선 Tesla 앱 trip history 확인 후 결정

## 2. 메커니즘 — Section 45 (Change in Use)

### 2.1 ITA 45(1)(a) — Deemed Disposition (default 룰)

용도 변경 시 (PR → rental):
- CRA 가 그 시점 FMV 로 매도 + 재매수 처리
- PR loss 는 deductible 아님 (ITA 40(2)(g)(iii))
- 새 ACB = FMV at change

→ Loss 상태에서 election 없이 전환 시: loss 비공제 + 새 ACB 가 낮아져 회복분 100% 과세 함정

### 2.2 ITA 45(2) Election — Deemed Disposition 회피

**효과:**
- "Change in use shall be deemed not to have occurred"
- ACB 그대로 유지 (사용자 케이스: 매수가 그대로)
- PR 자격 최대 4 tax years 추가 유지

**Letter 양식 (영문, T1 첨부):**

```
Date: [임대 전환 날짜]

Re: Election under Subsection 45(2) of the Income Tax Act

To the Canada Revenue Agency,

I, [Full Name], SIN [XXX-XXX-XXX], hereby elect under
subsection 45(2) of the Income Tax Act that the change in
use of the following property from a principal residence
to an income-producing use, which occurred on [Date], be
deemed not to have occurred:

Property address: [주소]

Signature: ___________________
[Name]
```

**제출:**
- 용도 변경 발생한 해의 T1 에 letter 첨부
- Late filing 가능하나 penalty 있을 수 있음 (ITA 220(3.2))

**효력 유지 조건:**
- CCA 청구 안 함 (한 번이라도 청구하면 election 무효)
- 다른 부동산을 PR 로 지정 안 함 (렌트는 PR 못 지정이라 OK)
- 매각·재입주 시 election 자동 종료

### 2.3 4년 Limit 의 정확한 의미

| 항목 | 4년 Limit 적용? |
|---|---|
| Deemed disposition 회피 | ❌ 영구 (election 활성 동안) |
| PRE (capital gain 면세) 자격 | ✅ 최대 4 tax years |

→ 5년+ 임대 가능. 단 5년차부터 그 해 발생 gain 분은 PR 카운트 제외.

### 2.4 PRE 비율 공식

```
PRE 면세 비율 = (1 + PR years) / Total ownership years
```

+1 bonus year 덕분에 5년 임대까지 사실상 100% 면세 가능.

### 2.5 ITA 54.1 (4년 무기한 연장) — 사용자 케이스 적용 불가

**조건:**
- (a) Change in use 가 employment relocation 으로 인한 것 (arm's length employer)
- (b) 직전 PR
- (c) 기존 집 ↔ 새 직장 거리 ≥ 새 집 ↔ 새 직장 + 40km
- (d) 직장 종료 1년 안에 복귀 의도

**사용자 케이스 미충족 이유:**
- 두 사람 다 기존 직장 그대로 (relocation 없음) → 조건 (a) 자체 trigger 안 됨
- 거리 조건도 양방향 미충족
- Self-employed 본인 단독으로는 employment 아님

## 3. 메커니즘 — BUOH (Business Use of Home)

### 3.1 신청 위치
- T2125 (Statement of Business or Professional Activities), Part 7 "Calculation of business-use-of-home expenses"
- T4 home office (T2200/T777) 와 별도 트랙

### 3.2 자격 (CRA 기준, 둘 중 하나)
1. 집이 사업의 principal place — Everstory 해당 ✅
2. 정기적·지속적으로 고객 만나는 공간

### 3.3 공제 가능 expense (rental 의 경우)
- 월세 (전체) × 사업 비율
- 유틸리티 (전기·수도·가스·인터넷) × 사업 비율
- Tenant insurance × 사업 비율
- 청소비·청소 용품 × 사업 비율
- 유지보수 × 사업 비율

### 3.4 비율 계산

```
면적 비율 = 사업 공간 면적 / 전체 집 면적
시간 비율 = 사업 사용 시간 / 24h (또는 / 주간 시간)

전용 공간 (개인 사용 0): 면적 비율 그대로
Mixed-use: 면적 비율 × 시간 비율
```

### 3.5 부업 추가 고려
- Business income 한도 (음수 안 됨)
- 한도 초과분 무기한 carry-forward
- 운영 첫 해 매출 적으면 carry-forward 누적

## 4. 메커니즘 — Rental Income (T776)

### 4.1 공제 가능 expense (100%, 면적 비율 아님)
- 모기지 이자 (원금 X)
- 재산세
- 콘도 fee
- 보험
- 수리·유지
- Property management fee
- Advertising (임차인 모집)
- Vacancy 충당

### 4.2 ⚠️ CCA 청구 금지
- Election 무효화
- Principal Residence Exemption 자격 영구 상실

### 4.3 T4 income 상계
- Net rental loss → other income 상계
- T4 marginal tax rate 적용

## 5. 메커니즘 — Class 54 (ZEV / Tesla)

### 5.1 Class 54 한도 (연도별, 세전)

| 구매 연도 | 한도 |
|---|---:|
| 2019-03-19 ~ 2021 | $55,000 |
| 2022 | $59,000 |
| 2023–2024 | $61,000 |
| 2025–2026 | $61,000 (예상) |

### 5.2 Enhanced first-year CCA rate

| Year | Rate |
|---|---:|
| 2019-03-19 ~ 2023 | 100% |
| 2024–2025 | 75% |
| 2026–2027 | 55% |
| 2028+ | 30% (regular) |

### 5.3 Change in Use — Personal → Business
- 사업용 acquisition date = "first available for use in business"
- 새 ACB = FMV at change date (보통 personal vehicle 은 depreciation 으로 FMV < 구매가)
- 구매가 − FMV loss 는 비공제 (personal use property)

### 5.4 Business Use 정의
- 집 (BUOH) ↔ 외부 사업 destination = ✅ business
- 집 ↔ T4 직장 = ❌ personal (commuting)
- 출퇴근은 사업 사용 아님 (CRA 룰)

### 5.5 Logbook 필수
- 매 trip: 날짜, 출발/도착, 목적, km
- 첫 해 full year + 이후 3 month sample
- Tesla 의 경우 앱 trip history 활용 가능

## 6. 계산 방법론 — 본인이 채울 공식

회계사 상담 또는 facts.md 정확값 들어온 후 본인이 계산.

### 6.1 BUOH 공제 (rental 새 집)

```
연 BUOH base = (월세 + 유틸 + tenant insurance + 청소비) × 12
사업 공간 비율 = 사업 공간 sqft / 전체 집 sqft
연 BUOH 공제 = 연 BUOH base × 사업 공간 비율
세금 절감 = BUOH 공제 × 부업 marginal tax rate
```

### 6.2 Rental Loss (콘도)

```
연 rental income = 월세 × 12
연 rental expense = (모기지 이자 + 콘도 fee + 재산세 + 보험 + 수리충당 + property mgmt) × 12
net rental income = rental income − rental expense
세금 절감 (loss 시) = |net rental loss| × T4 marginal rate
```

### 6.3 Tesla 공제

```
새 ACB = min(FMV at 사업 전환 시점, Class 54 한도)
Year 1 CCA = ACB × enhanced first-year rate × business use %
Year 2+ CCA = UCC × 30% × business use %
연 operating = (charging + insurance + 정비) × business use %
연 자동차 공제 = CCA + operating
세금 절감 = 자동차 공제 × marginal rate
```

### 6.4 매각 시 PRE 정산

```
Total capital gain = 매각가 − ACB
PRE 면세 비율 = (1 + PR years) / Total ownership years
면세분 = total gain × PRE 비율
과세분 = total gain − 면세분
Taxable capital gain (TCG) = 과세분 × 50%
세금 = TCG × marginal rate
```

### 6.5 의사결정 기준 — Break-even

```
임대 net = (rental loss 세금 절감 + 모기지 원금 누적 + BUOH 공제 + 매각 시점 매각가) 누적
매각 net = 현재 매각 cash (모기지 잔액 차감, closing cost 차감)

임대 net > 매각 net → 임대
매각 net > 임대 net → 매각
```

## 7. 회계사 1회 상담 — 질문 리스트

### 7.1 콘도 / Section 45(2)
1. 콘도 임대 전환 시 Section 45(2) election letter 작성 + T1 첨부 처리
2. CCA 청구 안 함 (election 무효화 방지) 확인
3. Rental income 첫 신고 (T776) 필요 서류 + 공제 가능 expense 전체 리스트
4. 5년+ 임대 시 PRE 비례 감소 정확 계산
5. ITA 54.1 적용 가능성 (거의 No 지만 confirm)
6. 임대 전환 시 deemed disposition FMV 산정 방법 (appraisal 필요?)

### 7.2 새 집 BUOH
7. T2125 Part 7 BUOH 공제 — 부업 케이스 시간 비율 적용 필요 여부
8. BUOH 공제 가능 항목 전체 리스트
9. Business income 한도 + carry-forward 메커니즘
10. T4 + 부업 net loss + rental loss 통합 상계 confirm

### 7.3 Tesla
11. Tesla Class 54 분류 확인
12. 사업용 acquisition date 결정 — 2025-09 vs 2026
13. 2025 T1 amend 가치 평가 (75% rate 활용 가능 시)
14. FMV 기준 ACB 산정 방법
15. Business use % reasonable 범위 + audit risk

### 7.4 통합
16. T4 부부 합산 marginal tax rate 정확 계산
17. 부업 T2125 + 콘도 T776 + 자동차 통합 시뮬레이션 (3년 / 5년)
18. HST registration 시점 사전 고지

## 8. 즉시 액션

| 액션 | 우선순위 |
|---|---|
| 콘도 declaration / bylaw 받기 (임대 가능?) | ★★★★★ |
| 모기지 amortization schedule 다운로드 | ★★★★★ |
| 2025 T1 신고 상태 확인 (CRA My Account) | ★★★★★ |
| Tesla 모델 + 구매 contract 사본 정리 | ★★★★ |
| Tesla 앱 trip history export (2025-09~) | ★★★★ |
| 회계사 sourcing (자영업+임대+EV 경험) | ★★★★★ |
| 회계사 1회 상담 예약 | ★★★★★ |
| 새 집 매물 검색 (Sheppard 권역) | ★★★ |
| Tesla FMV evidence (trade-in + AutoTrader 3건) | ★★★ |
| MileIQ 또는 Tesla 앱 logbook 셋업 | ★★★ |

## 9. 핵심 한 줄

콘도를 임대로 돌리고 (Section 45(2) election) Sheppard 권역 오래된 큰 2+1 또는 3-bed 렌트로 가서 마스터 베드룸을 Everstory 오피스 전용으로 쓰고, Tesla 도 사업 사용분 logbook 챙기되 무리하지 말 것. 회계사 1회 상담으로 다 sign-off 받고 시작.
