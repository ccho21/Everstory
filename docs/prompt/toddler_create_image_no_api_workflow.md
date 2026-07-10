# Toddler Image Workflow Without OpenAI API

## 결론

이 파이프라인은 프롬프트만 만드는 단계에서 더 나아가, 각 실행에 사용할 정확한 앵커 경로와 해시를 기록한다. 다만 로컬 Python 스크립트가 Codex 이미지 생성 도구를 직접 호출하지는 않는다.

런타임 기준은 다음 파일 하나다.

```text
scripts/toddler_image_pipeline/workflow.json
```

`prompts/`와 `matrix/`는 `export` 명령으로 만드는 사람이 읽기 위한 사본이다.

터미널 대신 현재 GPT/Codex 채팅에서 입력할 문장은 다음 문서에 정리되어 있다.

[`toddler_chat_commands.md`](toddler_chat_commands.md)

## 1. 설정 검증

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py validate
```

다음 항목을 검사한다.

- Face/Body Anchor 경로와 역할
- Face 프롬프트가 Image B를 참조하지 않는지
- Body 프롬프트가 Image A/B를 모두 참조하는지
- variation ID 중복과 필수 필드
- 템플릿 placeholder
- pose, framing, clothing, accessory 호환성
- scene과 clothing category 설정

## 2. Anchor 실행 준비

Face Anchor는 참조 이미지가 없다.

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py anchor face --print
```

Body Anchor는 설정된 Face Anchor 파일을 요구한다.

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py anchor body --print
```

필요한 앵커 파일이 없으면 프롬프트 run을 만들지 않고 실패한다.

## 3. 고정 variation

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py variation F02 --print
python3 scripts/toddler_image_pipeline/prepare_prompt.py variation B10 --print
```

- Face variation: Image A만 사용
- Body variation: Image A는 얼굴 정체성, Image B는 신체 비율에 사용

실제 이미지 생성 도구에는 run JSON에 기록된 경로를 직접 전달해야 한다.

## 4. 제한형 랜덤 variation

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py random B09 --seed 123 --print
```

다음 값은 원본 variation ID에서 보존한다.

```text
expression
pose_action
camera_angle
framing
```

다음 값만 호환 규칙 안에서 바꾼다.

```text
background + micro_scene
clothing
hairstyle
accessory
```

따라서 같은 seed를 사용해도 B01과 B09는 서로 다른 variation 특성을 유지한다.

완전히 새로운 랜덤 상황이 필요하면 기존 호환 row 하나를 먼저 선택하는 명령을 사용한다.

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py random-new body --seed 123 --print
```

## 5. Run 기록

각 명령은 다음 파일을 만든다.

```text
<run-id>.txt
<run-id>.json
manifest.jsonl
```

Run JSON 주요 기록:

```text
prompt SHA-256
workflow SHA-256
reference image path + SHA-256
variation id
seed
실제 요청 필드
review status
```

seed는 같은 프롬프트를 재구성하기 위한 값이다. 이미지 생성 자체는 seed로 재현되지 않는다.

## 6. 결과 상태 기록

사람이 결과를 확인한 뒤 상태를 기록한다.

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py review <run-id> approved \
  --reason "identity stable" \
  --image path/to/result.png

python3 scripts/toddler_image_pipeline/prepare_prompt.py review <run-id> retry \
  --reason "face shape drift"
```

스크립트는 상태와 이유를 기록하지만 이미지를 자동으로 이동하거나 삭제하지 않는다.

## 7. 사본 파일 동기화

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py export
```

이 명령으로 `prompts/*.txt`와 `matrix/*.csv`를 `workflow.json`에서 다시 생성한다.

## 8. 자동 테스트

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s scripts/toddler_image_pipeline/tests -v
```

자동 테스트는 seed 재현성, ID 보존, 참조 역할, 빈 scene fallback, 랜덤 호환성, run/review 기록을 검사한다.

## 사람이 해야 하는 부분

- 앵커 후보 선택
- Codex 이미지 생성 실행
- 동일 인물 여부와 나이 판단
- 손발과 얼굴 해부학 확인
- Approved / Retry / Rejected 결정

이 판단을 자동화하거나 생체인증 점수로 대체하지 않는다.
