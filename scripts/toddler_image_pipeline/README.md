# Toddler Image Pipeline: No API Mode

This folder prepares auditable prompt runs for Codex built-in create image without calling the OpenAI API.

`workflow.json` is the runtime source of truth. Files under `prompts/` and `matrix/` are generated human-readable exports.

## What is enforced

- Face variations reference only the selected Face Anchor (`Image A`).
- Body variations reference the Face Anchor for identity and the Body Anchor (`Image B`) for proportions.
- Every prompt run writes a sidecar JSON with exact reference paths and SHA-256 hashes.
- Fixed variation expression, pose, camera angle, and framing survive constrained randomization.
- Scene, clothing, hairstyle, and accessory choices are randomized with compatibility rules.
- Prompt files use microsecond run ids and are never silently overwritten.
- Workflow structure, template fields, ids, reference roles, and variation compatibility can be validated.

The local script still cannot call Codex create image itself. The reference paths in the generated run spec must be supplied to the image generation tool.

## Use from the current GPT/Codex chat

For copy-ready Korean chat requests covering validation, anchors, fixed variations, constrained random variations, batch generation, and review recording, see:

[`docs/prompt/toddler_chat_commands.md`](../../docs/prompt/toddler_chat_commands.md)

Quick example:

```text
B10 고정 variation 이미지 1장을 생성해줘.
먼저 workflow를 validate하고 variation B10 run을 준비해.
방금 만든 run JSON의 face_identity와 body_proportion 파일만 역할대로 참조해.
다른 최근 이미지는 참조하지 말고 결과를 보여줘.
```

## Validate configuration

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py validate
```

Run this after every `workflow.json` edit.

## Prepare anchors

Face Anchor has no reference image:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py anchor face --print
```

Body Anchor requires the Face Anchor configured in `workflow.json`:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py anchor body --print
```

The command fails if a required reference file is missing.

## Prepare fixed variations

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py variation F02 --print
python3 scripts/toddler_image_pipeline/prepare_prompt.py variation B10 --print
```

Reference policy:

- `F*`: Face Anchor only
- `B*`: Face Anchor + Body Anchor

## Constrained random variation

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py random B09 --seed 123 --print
python3 scripts/toddler_image_pipeline/prepare_prompt.py variation F02 --randomize --seed 123 --print
```

Constrained random preserves the requested row's:

- id and type
- expression
- pose/action
- camera angle
- framing

It may change compatible secondary fields:

- paired background and micro-scene
- scene-compatible clothing
- identity-preserving hair styling
- pose-compatible accessory

The same id, seed, and workflow version recreate the same prompt. They do not reproduce the same generated image.

## Fully random compatible scenario

Use `random-new` to select an existing compatible Face or Body row before randomizing its secondary fields:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py random-new face --seed 123 --print
python3 scripts/toddler_image_pipeline/prepare_prompt.py random-new body --print
```

This avoids independently combining incompatible poses and framings.

## Generated run records

Runs are written to:

```text
scripts/toddler_image_pipeline/output/prompt_runs/
```

Each run creates:

```text
<run-id>.txt       rendered prompt
<run-id>.json      reference paths, hashes, requested fields, seed, and status
manifest.jsonl     append-only creation and review events
```

The run JSON lists exact files that must be passed to Codex create image. Do not rely only on the words `Image A` and `Image B` in the prompt.

## Record review results

Review remains a human decision, but the result is recorded by the script:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py review <run-id> approved \
  --reason "identity stable" \
  --image scripts/toddler_image_pipeline/output/01_face_stickers/F02.png

python3 scripts/toddler_image_pipeline/prepare_prompt.py review <run-id> retry \
  --reason "face shape drift"
```

`retry` and `rejected` require a reason. Review updates the run JSON and appends an event to `manifest.jsonl`; it does not move or delete images.

## Regenerate human-readable exports

Do not edit `prompts/*.txt` or `matrix/*.csv` as independent sources. Regenerate them from `workflow.json`:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py export
```

## Tests

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s scripts/toddler_image_pipeline/tests -v
```

## Remaining manual steps

- Generate images in Codex using the reference paths from the run JSON.
- Select or replace anchor images.
- Decide whether a result is Approved, Retry, or Rejected.
- Judge identity, age, anatomy, and sticker usability.

The script records these decisions but does not attempt biometric identity scoring.
