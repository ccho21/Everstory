# Fictional Toddler Identity Workflow

## Purpose

This document explains how to operate the fictional toddler image workflow.

Runtime data lives in:

```text
scripts/toddler_image_pipeline/workflow.json
```

This markdown file is only an explanation and operating guide. Do not treat it as the source of prompt data.

Copy-ready GPT/Codex chat requests are documented in [`toddler_chat_commands.md`](toddler_chat_commands.md).

## Source Of Truth

Use `workflow.json` for all structured data:

- Anchor prompts
- Variation prompt template
- Background presets
- Fashion presets
- Randomization pools
- Face sticker matrix
- Body sticker matrix
- Variation status values

Use markdown files for human-readable guidance:

- Workflow purpose
- Operating sequence
- QC rules
- Troubleshooting notes
- Manual review criteria

## Core Principle

The prompt should not be responsible for remembering the child.

The anchor images carry identity:

- `Image A`: Face Anchor
- `Image B`: Body Anchor

Reference roles are enforced per run:

- Face variations use only `Image A`.
- Body variations use `Image A` for facial identity and `Image B` for body proportions.
- The generated run JSON contains the exact reference paths and SHA-256 hashes that must be supplied to the image generation tool.

The text prompt should only describe the requested change:

- expression
- pose or action
- camera angle
- framing
- clothing
- accessory
- light hairstyle styling
- background
- activity or micro-scene

Hairstyle changes must be conservative. Preserve the same hairline, hair color, and hair texture from `Image A`. Use hair styling only for small real-life changes such as messy flyaways, side-swept toddler hair, a small cowlick, lightly tousled hair after play, or hair partly visible under a hat.

## Background Strategy

Keep backgrounds realistic and ordinary, but not visually busy near the child.

Good background categories:

- home and everyday places
- playgrounds and parks
- zoo or aquarium walkways
- shopping mall corridors
- restaurant or cafe storefronts
- grocery aisles
- children's library corners
- daycare classrooms
- indoor play cafes
- community center hallways

The background should support the scene without becoming the subject. Prefer soft focus, simple shapes, and clean visible edges around hair, hands, and feet.

## Fashion Strategy

Clothing and accessories can vary more than the face, but they should still feel like ordinary toddler clothes.

Good fashion categories:

- striped shirts
- sweatshirts and joggers
- denim overalls
- light hoodies
- windbreakers
- puffer vests
- rain jackets and rain boots
- pajamas and lounge clothes
- knit sweaters
- small toddler backpacks
- soft bucket hats or knit beanies
- child-safe sunglasses for specific variations

Avoid fashion choices that hide too much of the face, change the apparent age, or make the child look like a styled model. Accessories should not cover the eyes, ears, hairline, or face shape unless the variation explicitly needs that effect.

## Variation Strategy

When identity is stable but images feel too similar, increase visible difference through:

- stronger pose or gesture
- different camera angle
- different framing distance
- different activity or micro-scene
- different outfit or accessory
- different real-life background

Do not increase variation by changing the face structure, age, hairline, body type, or head-to-body ratio.

For reproducible constrained random variation, use `--randomize --seed <number>`. Expression, pose, camera angle, and framing remain tied to the requested variation id; only compatible scene, clothing, hair, and accessory fields change. The seed recreates the same prompt for the same workflow version, not the same generated image.

## Operating Loop

1. Generate Face Anchor candidates from `workflow.json` anchor data.
2. Select one result as `Image A`.
3. Generate Body Anchor candidates using `Image A` as reference.
4. Select one result as `Image B`.
5. Generate variations from the Face/Body rows in `workflow.json`.
6. Supply the exact reference paths listed in the generated run JSON to Codex create image.
7. Classify each output as `Approved`, `Retry`, or `Rejected` and record it with the `review` command.
8. Promote only especially stable approved outputs to optional support anchors.

## Commands

Validate the workflow before preparing runs:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py validate
```

List available variations:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py list
```

Show variation details:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py list --verbose
```

List reusable background presets:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py backgrounds
```

List reusable fashion presets:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py fashion
```

List randomization pools:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py random-pools
```

Prepare the Face Anchor prompt:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py anchor face --print
```

Prepare the Body Anchor prompt:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py anchor body --print
```

Prepare one variation prompt:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py variation F01 --print
python3 scripts/toddler_image_pipeline/prepare_prompt.py variation B02 --print
```

Prepare one randomized variation prompt:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py random B09 --print
python3 scripts/toddler_image_pipeline/prepare_prompt.py variation B09 --randomize --seed 123 --print
```

For normal use, prefer the short `random` command. It generates a seed automatically and prints it before the prompt. Save that seed when an output is worth retrying or approving.

Select a compatible base variation before randomizing secondary fields:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py random-new body --seed 123 --print
```

Generated prompt files are written under:

```text
scripts/toddler_image_pipeline/output/prompt_runs/
```

Each run writes a prompt `.txt`, a run-spec `.json`, and an event in `manifest.jsonl`.

Record a review result:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py review <run-id> retry \
  --reason "face shape drift"
```

## Recommended First Batch

Start small:

1. Face Anchor candidates: 4 images
2. Body Anchor candidates: 4 images
3. Face variations: `F01`, `F02`, `F03`
4. Body variations: `B01`, `B02`, `B06`

Do not generate a large batch before `Image A` and `Image B` are stable.

## QC Criteria

Approve only when the image satisfies all relevant checks:

- The face still looks like `Image A`.
- The body proportions still look like `Image B`.
- The child still reads as a 24-month-old toddler.
- The result feels like an ordinary real-life candid phone photo.
- The image is not overly polished, model-like, doll-like, anime, or cartoon.
- Hands, feet, ears, eyes, and mouth are not visibly broken.
- The framing is useful for sticker production.

Use `Retry` when the output is close but has correctable problems.

Use `Reject` when identity, age, proportions, or usability are clearly wrong.

## Common Failure Handling

If identity drifts, tighten the next prompt around preserving `Image A`.

If body proportions drift, tighten the next prompt around preserving `Image B`.

If the image looks too polished, emphasize ordinary candid phone-photo realism.

If the background is hard to cut out, request clean visible edges around the child and avoid busy backgrounds near hair, hands, or feet.

If hands are distorted, simplify the pose or reduce hand detail.

If fashion changes make the child look like a different child, simplify the outfit and remove accessories that cover the eyes, hairline, ears, or face shape.

If images feel too similar, increase `pose_action`, `camera_angle`, `framing`, and `micro_scene` before changing facial identity details.

## File Naming

Use stable IDs from `workflow.json`:

```text
F01_neutral_front_approved_v01.png
B02_waving_3q_retry_v02.png
```

Recommended fields:

```text
ID + expression/action + angle + status + version
```

## Output Structure

```text
scripts/toddler_image_pipeline/output/
  00_anchors/
  01_face_stickers/
    approved/
    retry/
    rejected/
  02_body_stickers/
    approved/
    retry/
    rejected/
  prompt_runs/
```

## Editing Workflow Data

Edit this file for process explanations only.

Edit `workflow.json` when changing:

- prompt wording
- template placeholders
- background presets
- fashion presets
- randomization pools
- variation rows
- variation strategy
- statuses
- matrix values

After editing `workflow.json`, run:

```bash
python3 scripts/toddler_image_pipeline/prepare_prompt.py validate
python3 scripts/toddler_image_pipeline/prepare_prompt.py export
```

This validates the runtime data and regenerates the human-readable prompt and matrix exports.
