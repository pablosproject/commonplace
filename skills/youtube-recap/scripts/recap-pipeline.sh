#!/usr/bin/env bash
set -euo pipefail

# YouTube recap pipeline for this skill.
#
# Run from the per-video output directory. The script reads the schema from the
# skill repo and reads/writes recap files in the current directory.
#
# Usage:
#   /path/to/skill/scripts/recap-pipeline.sh fetch 'https://www.youtube.com/watch?v=VIDEO_ID'
#   /path/to/skill/scripts/recap-pipeline.sh generate-json-stub
#   /path/to/skill/scripts/recap-pipeline.sh validate
#   /path/to/skill/scripts/recap-pipeline.sh link
#
# Environment:
#   RECAP_APP_URL   preview page the link points to (default: the embedded app URL)
#   RECAP_NO_OPEN   set to any value to print the link without opening a browser

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DEFAULT_APP_URL="http://localhost:5173/preview"
APP_URL="${RECAP_APP_URL:-$DEFAULT_APP_URL}"
DATA_JSON="${DATA_JSON:-video-recap-data.json}"
SCHEMA_JSON="${SCHEMA_JSON:-$SKILL_ROOT/schemas/video-recap.schema.json}"
LINK_OUT="${LINK_OUT:-preview_url.txt}"

need() {
  command -v "$1" >/dev/null || { echo "Missing required command: $1" >&2; exit 1; }
}

find_srt() {
  ls transcript.*.srt 2>/dev/null | head -1 || true
}

# Writes video-info.json (id, title, channel, duration, url), the raw
# transcript.<lang>.srt, and transcript.txt, a cleaned "[HH:MM:SS] text" version.
# Uploaded (human-made) English subtitles are preferred; their language code is
# often not plain "en" (e.g. "en-US", "en-eEY6OEpapPo"). Auto captions are the fallback.
fetch_transcript() {
  local url="$1" srt source="uploaded subtitles"
  [[ -n "$url" ]] || { echo "Usage: $0 fetch VIDEO_URL" >&2; exit 1; }
  need yt-dlp
  need node
  rm -f transcript.*.srt transcript.*.vtt

  yt-dlp --skip-download --write-subs --sub-langs 'en.*' --sub-format vtt \
    --convert-subs srt -o 'transcript.%(ext)s' \
    --print-to-file '%(.{id,title,channel,duration,webpage_url})j' video-info.json "$url" || true

  srt="$(find_srt)"
  if [[ -z "$srt" ]]; then
    source="auto-generated captions"
    yt-dlp --skip-download --write-auto-subs --sub-langs en --sub-format vtt \
      --convert-subs srt -o 'transcript.%(ext)s' "$url" || true
    srt="$(find_srt)"
  fi
  [[ -n "$srt" ]] || { echo "No English transcript downloaded for $url (see yt-dlp errors above)" >&2; exit 1; }

  npm exec --prefix "$SKILL_ROOT" -- tsx "$SCRIPT_DIR/clean-transcript.ts" "$srt" > transcript.txt
  echo "transcript: transcript.txt ($(wc -l < transcript.txt | tr -d ' ') lines, from ${source}, raw: ${srt})"
  echo "video info: video-info.json"
}

generate_json_stub() {
  local transcript
  transcript="$(find_srt)"
  [[ -n "$transcript" ]] || { echo "No transcript found. Run: $0 fetch VIDEO_URL" >&2; exit 1; }

  if [[ ! -f "$DATA_JSON" ]]; then
    cat > "$DATA_JSON" <<'EOF'
{
  "schemaVersion": "1.0",
  "video": {
    "id": "TODO",
    "url": "TODO",
    "title": "TODO"
  },
  "abstract": "TODO",
  "mainTakeaway": "TODO",
  "highlights": [],
  "sections": [],
  "conclusion": "TODO"
}
EOF
  fi

  echo "Transcript: ${transcript}"
  echo "Fill in ${DATA_JSON} (schema: ${SCHEMA_JSON}), then run: $0 link"
}

validate_json() {
  need node
  node --input-type=module - "$SKILL_ROOT" "$SCHEMA_JSON" "$DATA_JSON" <<'NODE'
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const [, , skillRoot, schemaPath, dataPath] = process.argv;
const require = createRequire(`${skillRoot}/package.json`);
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats').default;

const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const data = JSON.parse(await readFile(dataPath, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(data)) {
  console.error('Schema validation failed:');
  for (const error of validate.errors ?? []) {
    console.error(`- ${error.instancePath || '/'} ${error.message ?? ''}`.trim());
  }
  process.exit(1);
}

const points = [
  ...data.highlights,
  ...data.sections.flatMap((section) => section.points),
];
for (const point of points) {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(point.time);
  if (!match) throw new Error(`Invalid timestamp: ${point.time}`);
  const expected = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  if (point.seconds !== expected) {
    throw new Error(`Timestamp mismatch for ${point.time}: expected ${expected}, got ${point.seconds}`);
  }
}

console.log(`valid: ${dataPath}`);
NODE
}

open_url() {
  if command -v open >/dev/null; then
    open "$1" || true
  elif command -v xdg-open >/dev/null; then
    xdg-open "$1" >/dev/null 2>&1 || true
  fi
}

link_recap() {
  validate_json
  local link
  link="$(npm exec --prefix "$SKILL_ROOT" -- tsx "$SCRIPT_DIR/recap-link.ts" "$DATA_JSON" "$APP_URL")"
  echo "$link" > "$LINK_OUT"
  [[ -n "${RECAP_NO_OPEN:-}" ]] || open_url "$link"
  echo "$link"
}

case "${1:-}" in
  fetch) fetch_transcript "${2:-}" ;;
  generate-json-stub) generate_json_stub ;;
  validate) validate_json ;;
  link) link_recap ;;
  *)
    sed -n '4,17p' "$0" >&2
    exit 1
    ;;
esac
