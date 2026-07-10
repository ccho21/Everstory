# Toddler Image Workflow: GPT/Chat Commands

이 문서는 터미널 명령을 직접 입력하지 않고, 현재 Codex/GPT 채팅에서 어떤 문장을 입력하면 되는지 정리한다.

## 현재 Codex task와 일반 ChatGPT의 차이

### 현재 Codex task

현재 task는 저장소 파일과 로컬 앵커 경로를 읽을 수 있다. 채팅에서 variation ID와 작업 범위를 말하면 Codex가 CLI를 실행하고 run JSON에 기록된 파일을 이미지 참조로 사용할 수 있다.

항상 다음 원칙을 포함하는 것이 안전하다.

```text
Everstory toddler image workflow 기준으로 작업해줘.
workflow.json만 런타임 기준으로 사용하고 먼저 validate를 실행해.
이미지를 생성할 때는 방금 만든 run JSON의 reference_images 경로만 정확히 참조해.
Face variation에는 face_identity 한 장만 사용하고 Image B는 포함하지 마.
Body variation에는 face_identity와 body_proportion을 각 역할대로 사용해.
기존 앵커와 기존 결과 파일은 덮어쓰거나 이동하지 마.
```

### 일반 ChatGPT 웹/앱

일반 ChatGPT는 이 저장소의 로컬 경로를 읽을 수 없다. 다음 파일을 직접 첨부해야 한다.

- Face Anchor 생성: 첨부 없음
- Body Anchor 생성: Image A 첨부
- Face variation: Image A만 첨부
- Body variation: Image A와 Image B 첨부

그다음 생성된 `<run-id>.txt`의 전체 내용을 채팅에 붙여넣는다. OpenAI의 ChatGPT Images 안내에서도 기존 이미지를 업로드한 뒤 원하는 변경을 설명할 수 있다고 안내한다.

공식 안내: [Images in ChatGPT](https://help.openai.com/en/articles/11084440-chatgpt-image-library)

## 1. Workflow 검증

이미지를 만들지 않고 설정만 검사한다.

```text
Everstory toddler image workflow를 검증해줘.
prepare_prompt.py validate를 실행하고, 문제가 있으면 파일과 원인을 요약해줘.
이미지는 생성하지 마.
```

## 2. 사람이 읽는 프롬프트와 CSV 동기화

```text
workflow.json을 검증한 다음 export를 실행해서 prompts와 matrix 사본을 동기화해줘.
이미지는 생성하지 말고 변경된 파일만 알려줘.
```

## 3. Face Anchor 프롬프트만 준비

```text
Face Anchor run만 준비해줘.
workflow의 anchor face를 사용하고 참조 이미지는 포함하지 마.
프롬프트와 run JSON을 만든 뒤 run id와 프롬프트 내용을 보여줘.
이미지는 아직 생성하지 마.
```

## 4. Face Anchor 후보 이미지 생성

```text
Face Anchor 후보 1장을 생성해줘.
먼저 workflow를 validate하고 anchor face run을 준비해.
참조 이미지는 사용하지 말고 방금 생성한 run의 프롬프트로 이미지를 만들어줘.
기존 Image A 파일은 덮어쓰지 말고 결과를 먼저 보여줘.
```

여러 후보가 필요해도 한 번에 병렬 생성하기보다 순차적으로 요청한다.

```text
같은 Face Anchor 프롬프트로 후보를 1장 더 생성해줘.
이전 후보를 새 참조 이미지로 사용하지 말고, 여전히 참조 없이 생성해.
기존 결과를 덮어쓰지 마.
```

## 5. Body Anchor 프롬프트만 준비

```text
Body Anchor run만 준비해줘.
workflow의 anchor body를 사용하고 run JSON의 face_identity 경로가 실제 Image A인지 확인해.
run id와 참조 이미지 경로를 보여주고 이미지는 아직 생성하지 마.
```

## 6. Body Anchor 후보 이미지 생성

```text
Body Anchor 후보 1장을 생성해줘.
먼저 anchor body run을 준비하고, 방금 만든 run JSON의 face_identity 파일 한 장만 실제 참조 이미지로 사용해.
Image A의 얼굴 정체성을 유지하면서 전신 앵커를 생성해.
기존 Image B 파일은 덮어쓰지 말고 결과를 먼저 보여줘.
```

## 7. 고정 Face variation 생성

`F02` 부분을 원하는 Face ID로 바꾼다.

```text
F02 고정 variation 이미지 1장을 생성해줘.
먼저 workflow를 validate하고 variation F02 run을 준비해.
방금 만든 run JSON의 face_identity 파일만 실제 참조 이미지로 사용해.
Image B나 최근 대화의 다른 이미지는 참조하지 마.
프롬프트에 지정된 표정, 포즈, 각도, 프레이밍을 유지하고 결과를 보여줘.
```

프롬프트만 필요할 때:

```text
F02 고정 variation run만 준비해줘.
run id, 사용할 reference_images, 생성된 프롬프트를 보여줘.
이미지는 생성하지 마.
```

## 8. 고정 Body variation 생성

`B10` 부분을 원하는 Body ID로 바꾼다.

```text
B10 고정 variation 이미지 1장을 생성해줘.
먼저 workflow를 validate하고 variation B10 run을 준비해.
방금 만든 run JSON의 face_identity는 얼굴 정체성 참조로, body_proportion은 신체 비율 참조로 사용해.
다른 최근 이미지는 참조하지 마.
프롬프트에 지정된 표정, 포즈, 각도, 프레이밍을 유지하고 결과를 보여줘.
```

프롬프트만 필요할 때:

```text
B10 고정 variation run만 준비해줘.
run id, 두 reference_images의 역할과 경로, 생성된 프롬프트를 보여줘.
이미지는 생성하지 마.
```

## 9. 제한형 랜덤 variation 생성

기존 ID의 표정·포즈·각도·프레이밍을 유지하면서 장면·의상·헤어·액세서리만 바꾼다.

```text
B09를 seed 123으로 제한형 랜덤 variation 이미지 1장 생성해줘.
먼저 random B09 --seed 123 run을 준비해.
B09의 expression, pose_action, camera_angle, framing은 변경하지 마.
방금 만든 run JSON의 face_identity와 body_proportion 파일만 역할대로 참조해.
run id와 seed를 알려주고 결과를 보여줘.
```

Face variation 예시:

```text
F02를 seed 123으로 제한형 랜덤 variation 이미지 1장 생성해줘.
F02의 표정, 포즈, 각도, 프레이밍은 유지해.
run JSON의 face_identity 파일만 사용하고 Image B는 참조하지 마.
```

## 10. 완전히 새로운 호환 상황 생성

기존 호환 row 하나를 고른 다음 안전한 보조 필드만 랜덤화한다.

```text
Body용 완전 랜덤 호환 variation을 seed 321로 1장 생성해줘.
random-new body --seed 321 run을 준비하고 선택된 base variation ID를 먼저 알려줘.
그 base row의 표정, 포즈, 각도, 프레이밍을 유지해.
run JSON의 face_identity와 body_proportion 파일만 참조해서 이미지를 생성해.
```

## 11. 여러 variation 순차 생성

각 이미지마다 별도 run과 정확한 참조 목록을 사용하도록 요청한다.

```text
F02, F14, B04를 각각 1장씩 순차적으로 생성해줘.
각 ID마다 별도의 run을 만들고, 매번 해당 run JSON의 reference_images만 사용해.
Face에는 Image A만, Body에는 Image A와 Image B를 역할대로 사용해.
앞에서 생성된 variation 이미지를 다음 이미지의 참조로 사용하지 마.
각 결과 전에 run id와 참조 역할을 짧게 알려줘.
기존 파일은 덮어쓰지 마.
```

## 12. Review 상태 기록

이미지 판단을 끝낸 다음 run 상태만 기록한다.

Approved:

```text
run id `<run-id>`를 approved로 기록해줘.
reason은 `identity stable`로 남기고 이미지는 이동하거나 삭제하지 마.
```

Retry:

```text
run id `<run-id>`를 retry로 기록해줘.
reason은 `face shape drift`로 남기고 이미지는 이동하거나 삭제하지 마.
```

Rejected:

```text
run id `<run-id>`를 rejected로 기록해줘.
reason은 `different child identity`로 남기고 이미지는 이동하거나 삭제하지 마.
```

결과 이미지가 로컬 파일로 저장되어 있다면 다음 문장을 덧붙인다.

```text
output_image에는 `/absolute/path/to/result.png`를 기록해줘.
```

## 13. Run 기록 확인

```text
가장 최근 toddler image run을 확인해줘.
run id, variation id, seed, status, prompt hash, workflow hash, reference image 역할과 경로를 표로 정리해줘.
파일은 수정하지 마.
```

## 일반 ChatGPT에 붙여넣는 메시지

Face variation은 Image A 한 장만 첨부한 뒤 다음처럼 입력한다.

```text
첨부한 이미지는 이 fictional toddler의 유일한 얼굴 정체성 참조인 Image A입니다.
다른 대화 이미지나 다른 인물을 참조하지 마세요.
아래 프롬프트대로 같은 아이의 새로운 사진을 생성하세요.

<생성된 run-id.txt 전체 내용 붙여넣기>
```

Body variation은 Image A와 Image B를 순서대로 첨부한 뒤 역할을 명시한다.

```text
첫 번째 첨부 이미지는 얼굴 정체성 참조 Image A입니다.
두 번째 첨부 이미지는 신체 비율 참조 Image B입니다.
Image A는 얼굴에만 우선 사용하고 Image B는 신체 비율에 사용하세요.
다른 대화 이미지는 참조하지 마세요.
아래 프롬프트대로 같은 아이의 새로운 사진을 생성하세요.

<생성된 run-id.txt 전체 내용 붙여넣기>
```

## 피해야 할 모호한 요청

다음과 같은 짧은 요청은 참조 범위가 불명확하므로 피한다.

```text
같은 아이로 하나 더 만들어줘.
랜덤으로 다른 포즈 만들어줘.
아까 사진 참고해서 만들어줘.
```

항상 variation ID, seed 사용 여부, Face/Body 구분, 실제 참조 범위를 함께 적는다.
