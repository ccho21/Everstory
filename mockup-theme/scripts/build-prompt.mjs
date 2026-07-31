#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(scriptDir, "..");

const stages = {
  "reference-lock": {
    prompt: "prompts/00_REFERENCE_LOCK.md",
    request: false,
    scene: false,
  },
  "fidelity-face": {
    prompt: "prompts/01_FACE_FIDELITY_TEST.md",
    request: false,
    scene: false,
  },
  "fidelity-full-body": {
    prompt: "prompts/02_FULL_BODY_FIDELITY_TEST.md",
    request: false,
    scene: false,
  },
  "empty-stage": {
    prompt: "prompts/10_STYLE_EMPTY_STAGE.md",
    request: true,
    scene: true,
  },
  "product-insert": {
    prompt: "prompts/11_STYLE_PRODUCT_INSERT.md",
    request: true,
    scene: false,
  },
};

const sceneFiles = {
  S01_SHEET: "prompts/scenes/S01_SHEET.md",
  S02_STATIONERY: "prompts/scenes/S02_STATIONERY.md",
  S03_TECH: "prompts/scenes/S03_TECH.md",
  L01_LIFESTYLE: "prompts/scenes/L01_LIFESTYLE.md",
};

function usage(exitCode = 0) {
  const command = "node mockup-theme/scripts/build-prompt.mjs";
  const lines = [
    "Everstory Mockup Theme prompt builder",
    "",
    `Usage: ${command} --stage <stage> [--request <json>]`,
    `       ${command} --list`,
    "",
    `Stages: ${Object.keys(stages).join(", ")}`,
  ];
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${lines.join("\n")}\n`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") result.help = true;
    else if (arg === "--list") result.list = true;
    else if (arg === "--stage" || arg === "--request") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      result[arg.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return result;
}

function readText(relativePath) {
  return fs.readFileSync(path.join(themeDir, relativePath), "utf8").trim();
}

function readRequest(requestPath) {
  const absolutePath = path.resolve(process.cwd(), requestPath);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read request JSON: ${absolutePath}\n${error.message}`);
  }
  if (!parsed.scene_id || typeof parsed.scene_id !== "string") {
    throw new Error("Request JSON must contain a string scene_id");
  }
  return { absolutePath, parsed };
}

function section(title, body) {
  return [`===== ${title} =====`, body].join("\n");
}

function buildPrompt(stageName, requestPath) {
  const stage = stages[stageName];
  if (!stage) throw new Error(`Unknown stage: ${stageName}`);

  const parts = [];
  let request;

  if (stage.request) {
    if (!requestPath) throw new Error(`Stage ${stageName} requires --request <json>`);
    request = readRequest(requestPath);
    parts.push(section("MOCKUP REQUEST", JSON.stringify(request.parsed, null, 2)));
  }

  if (stage.scene) {
    const scenePath = sceneFiles[request.parsed.scene_id];
    if (!scenePath) {
      throw new Error(
        `Unsupported scene_id: ${request.parsed.scene_id}. ` +
          `Expected one of ${Object.keys(sceneFiles).join(", ")}`,
      );
    }
    parts.push(section("SCENE CARD", readText(scenePath)));
    parts.push(section("THEME HARD LOCKS", readText("THEME_BIBLE_KO.md")));
  }

  parts.push(section("STAGE PROMPT", readText(stage.prompt)));
  return `${parts.join("\n\n")}\n`;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usage(0);
  if (args.list) {
    process.stdout.write(`${Object.keys(stages).join("\n")}\n`);
    process.exit(0);
  }
  if (!args.stage) usage(1);
  process.stdout.write(buildPrompt(args.stage, args.request));
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exit(1);
}

