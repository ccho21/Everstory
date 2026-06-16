# Batch instruction 프롬프트 템플릿

이 문서는 `06_home_collection.md` 같은 **"Theme Editor 한 단계씩 따라가는 instruction"** 을 다른 batch (5, 7, 8, 9 등) 도 같은 형식으로 만들고 싶을 때 쓰는 프롬프트 템플릿이다. 새 세션에서 카피해서 변수만 교체.

---

## 1️⃣ 한 줄 요약 — 그냥 빨리 쓰고 싶을 때

```
포토샵누끼/docs/shopify/instructions/0{N}_xxx.md 를 06_home_collection.md 와 같은 형식 (Theme Editor 한 단계씩, 풀 텍스트, Horizon 3.5.1 UI) 으로 다시 써줘.
```

이 한 줄이면 06 파일을 reference 로 보고 같은 패턴 반복함.

> 주의: `06_home_collection.md` 가 reference 로 작동하려면 그 파일이 instructions 폴더에 있어야 함. 기본 전제.

---

## 2️⃣ 처음 만드는 batch 일 때 (full 프롬프트)

새 batch 를 처음 만들거나, 06 형식과 다른 새 형식이 필요하면 다음 프롬프트 사용. 사이드 바 어디에 어떤 옵션이 있는지 모르는 상태에서도 결과물이 일정한 품질로 나옴.

```
포토샵누끼/docs/shopify/instructions/0{N}_{topic}.md 를 만들어줘.

작업 내용: {이 batch 가 무엇을 하는지 한 줄}

원칙:
- Theme Editor (Shopify admin 의 visual editor) 에서 작업할 수 있게 한 단계 한 단계 쉽게 설명
- 최신 UI 반영 (Horizon 테마 3.5.1 — 실제 schema/locale 파일은 /Users/heatherchung/Desktop/EVERSTORY/Shopify Theme/horizon/ 에 있음)
- 최대한 외부 참조 ("X 문서 참조") 없이 풀 텍스트로 모든 카피/링크/값 인라인 표시
- 입력값 (텍스트, URL, 색상, padding 등) 은 카피하기 쉽게 코드 블록 또는 표로
- Theme Editor 의 좌측 sidebar / 우측 settings / preview 어디를 클릭하는지 명시
- 각 step 마다 어떤 화면 변화가 있어야 하는지 (확인 포인트)
- ✅ Checkpoint 자주 둬서 사용자 진행 상태 자가 확인 가능하게
- 자주 막히는 지점은 마지막에 trouble-shooting 표로 정리

전제 조건:
- 이 스토어는 GitHub sync 켜져있음 (github.com/ccho21/everstory-theme). Theme Editor Save 가 자동 commit 됨 — 시작 전 경고 블록에 명시할 것
- 작업은 Unpublished theme 에서 진행 — 이것도 명시
- 카피의 source of truth: docs/shopify/pages_copy.md, product_descriptions.md, footer_copy.md, policies.md (필요 시 카피 가져와서 인라인)
- Wireframe 의 source of truth: docs/shopify/wireframes/{page}.html (구조 이해용으로만 사용, 본문에는 참조하지 말 것)
```

`{N}` 과 `{topic}` 만 교체.

---

## 3️⃣ 결과물 형식 — Claude 가 만들어야 하는 9가지 구성요소

새 결과물이 아래 9개 모두 포함되어야 형식 일치.

1. **상단 메타데이터** — 소요 시간, 이전/다음 batch, Horizon 버전, 편집 방식.
2. **시작 전 경고 블록** — GitHub sync 자동 commit 주의 + Unpublished theme 작업 + 시작 전 점검 체크리스트 (필요 자산 / 이미지 spec).
3. **📋 카피 일괄 모음** — 이 batch 에서 사용할 모든 카피/링크/값을 한곳에. 사용자가 카피 변경할 때 이곳만 수정.
4. **🗺️ Theme Editor 화면 구조 ASCII 도식** — 좌측 sidebar / 가운데 preview / 우측 settings 영역 도식. (이미 익숙한 사람용으로 한 번만 등장)
5. **Step 별 click 단위 분해**:
   - **클릭 1 / 클릭 2 / 작업 / 확인** 형식
   - 어떤 화면 변화가 있어야 하는지 명시
   - 좌측 트리에 어떤 항목이 추가되는지 ASCII tree 로 표시 (필요 시)
6. **모든 settings 는 표 형식** — `| 필드 | 값 |` 두 컬럼.
7. **각 step 끝에 ✅ Checkpoint** — preview 에서 무엇이 보여야 하는지 구체적.
8. **종료 검증 체크리스트** — `- [ ]` 형식.
9. **🛟 자주 막히는 지점 표** — 증상 / 원인-해결 두 컬럼.

---

## 4️⃣ 결과물 체크리스트

새 instruction 파일 받았을 때 다음 모두 ✅ 면 형식 일치.

- [ ] 상단 메타데이터 (소요 시간, 이전/다음 batch, Horizon 버전)
- [ ] ⚠️ 시작 전 경고 블록 — GitHub sync + Unpublished theme + 점검 체크리스트
- [ ] 📋 카피 일괄 모음 섹션 (한곳에 모든 텍스트/링크)
- [ ] 🗺️ Theme Editor 화면 구조 ASCII 도식
- [ ] 각 step 이 click 단위로 분해 (그냥 "X 클릭 후 Y 입력" 한 줄로 안 끝남)
- [ ] 모든 settings 가 `| 필드 | 값 |` 표 형식
- [ ] ✅ Checkpoint 마다 preview 에서 보여야 할 모습 구체적 명시
- [ ] 종료 검증 체크리스트 (`- [ ]` 형식)
- [ ] 🛟 trouble-shooting 표 있음
- [ ] 외부 문서 참조 없이 풀 텍스트 (단, 다른 batch 파일 / Shopify 공식 도움말 링크는 OK)
- [ ] Horizon 3.5.1 의 실제 영문 라벨 사용 (예: "Section width", "Card size", "Filtering and sorting")

체크리스트 항목 미충족 시 다음 follow-up 으로 보완:

```
방금 만든 0{N}_xxx.md 가 다음 항목을 빠뜨렸어: {빠진 항목}. 추가해줘.
```

---

## 5️⃣ 자주 쓰는 후속 요청 패턴

### 같은 형식으로 다른 batch 변환

```
0{N}_xxx.md 도 06_home_collection.md 와 같은 형식 (Theme Editor 한 단계씩, 풀 텍스트, 카피 일괄 모음, trouble-shooting 표) 으로 다시 써줘.
```

### 특정 step 만 더 자세히

```
0{N}_xxx.md 의 Step {X.Y} 를 더 잘게 쪼개줘. 클릭 한 번 단위로.
```

### 카피만 교체

```
0{N}_xxx.md 의 카피 일괄 모음 섹션의 {section name} 카피를 다음으로 교체해줘:
{새 카피}
나머지 step 의 같은 카피도 자동으로 따라 바뀌게.
```

### Horizon 버전 변경 시

```
Horizon 테마가 {새 버전} 으로 업데이트됐어. 0{N}_xxx.md 의 UI 라벨/필드명을 {새 버전} 기준으로 다시 검증해서 다른 부분 있으면 수정해줘. /Users/heatherchung/Desktop/EVERSTORY/Shopify Theme/horizon/ 의 schema 파일 참조.
```

### 새 페이지 추가

```
0{N}_xxx.md 에 {새 페이지 또는 새 section} 을 추가해줘. 06_home_collection.md 의 6.1.5 (Why Everstory Media with text section 추가) 같은 패턴으로.
```

---

## 6️⃣ 메모 — Claude 가 자동으로 알고 있어야 할 컨텍스트

새 세션에서도 이 컨텍스트가 자동 적용되도록 다음이 memory 에 저장됨:

- **Full text over references** (`feedback_full_text_over_references.md`) — 카피/링크/값을 인라인 표시 선호
- **Horizon theme GitHub sync** (`project_horizon_github_sync.md`) — Theme Editor Save 가 자동 GitHub commit, 동시 편집 주의

이 두 메모리가 살아있으면 1️⃣ 한 줄 요약만으로도 거의 같은 결과 나옴. 만약 memory 가 사라졌거나 새 환경이면 2️⃣ full 프롬프트 사용.

---

## 7️⃣ 프롬프트가 잘 작동하지 않을 때

### 결과물이 너무 짧거나 step 이 통합되어 나옴
→ 다음 줄 추가: `각 step 은 클릭 한 번 또는 입력 한 번 단위로 쪼개. 5–10 라인짜리 step 도 OK.`

### Horizon 라벨이 다른 버전 기준
→ 다음 줄 추가: `Horizon 3.5.1 의 실제 schema (/Users/heatherchung/Desktop/EVERSTORY/Shopify Theme/horizon/sections/*.liquid 와 locales/en.default.schema.json) 를 직접 읽어서 라벨 검증해.`

### 카피가 외부 참조로 도망감
→ 다음 줄 추가: `"X 문서의 Y 섹션 참조" 같은 표현 절대 금지. 카피는 인라인 풀 텍스트로 직접 보여줘.`

### 너무 길어서 가독성 떨어짐
→ 다음 줄 추가: `Step 6.1 (Home) 과 Step 6.2 (Collection) 을 별도 파일로 분리해. 각 파일은 1000줄 이하 유지.`
