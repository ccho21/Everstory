import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(scriptDir, "build-prompt.mjs");
const request = path.resolve(scriptDir, "../templates/MOCKUP_REQUEST.template.json");

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

const list = run(["--list"]);
assert.equal(list.status, 0);
assert.match(list.stdout, /reference-lock/);
assert.match(list.stdout, /empty-stage/);

const lock = run(["--stage", "reference-lock"]);
assert.equal(lock.status, 0);
assert.match(lock.stdout, /REF_FACE_SHEET_01/);
assert.match(lock.stdout, /STAGE PROMPT/);

const empty = run(["--stage", "empty-stage", "--request", request]);
assert.equal(empty.status, 0);
assert.match(empty.stdout, /MOCKUP REQUEST/);
assert.match(empty.stdout, /SCENE_ID: S02_STATIONERY/);
assert.match(empty.stdout, /THEME HARD LOCKS/);
assert.match(empty.stdout, /PASS A: EMPTY STAGE/);

const insert = run(["--stage", "product-insert", "--request", request]);
assert.equal(insert.status, 0);
assert.match(insert.stdout, /product_placements/);
assert.match(insert.stdout, /PASS B: PRODUCT INSERT/);

const missingRequest = run(["--stage", "empty-stage"]);
assert.equal(missingRequest.status, 1);
assert.match(missingRequest.stderr, /requires --request/);

const unknownStage = run(["--stage", "unknown"]);
assert.equal(unknownStage.status, 1);
assert.match(unknownStage.stderr, /Unknown stage/);

process.stdout.write("build-prompt tests passed\n");

