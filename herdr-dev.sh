#!/usr/bin/env bash
set -euo pipefail

if [[ "${HERDR_ENV:-}" != "1" ]]; then
  echo "This launcher must be run inside a Herdr pane so it can target the current workspace." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to parse Herdr command responses." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ID="${HERDR_WORKSPACE_ID:?HERDR_WORKSPACE_ID is not set}"

run_json() {
  local output
  if ! output="$("$@")"; then
    printf 'Command failed:' >&2
    printf ' %q' "$@" >&2
    printf '\n' >&2
    exit 1
  fi
  printf '%s' "$output"
}

TAB_JSON="$(run_json herdr tab create --workspace "$WORKSPACE_ID" --cwd "$ROOT" --label "video dev" --focus)"
WEB_PANE="$(jq -r '.result.root_pane.pane_id' <<<"$TAB_JSON")"

FREE_JSON="$(run_json herdr pane split "$WEB_PANE" --direction right --ratio 0.34 --cwd "$ROOT" --focus)"
FREE_PANE="$(jq -r '.result.pane.pane_id' <<<"$FREE_JSON")"

API_JSON="$(run_json herdr pane split "$WEB_PANE" --direction down --ratio 0.5 --cwd "$ROOT" --no-focus)"
API_PANE="$(jq -r '.result.pane.pane_id' <<<"$API_JSON")"

herdr pane rename "$WEB_PANE" "web dev"
herdr pane rename "$API_PANE" "api dev"
herdr pane rename "$FREE_PANE" "free"

herdr pane run "$WEB_PANE" "cd '$ROOT' && npm run dev:web"
herdr pane run "$API_PANE" "cd '$ROOT' && npm run dev:api"

echo "Started video dev panes in tab 'video dev':"
echo "  web:  $WEB_PANE"
echo "  api:  $API_PANE"
echo "  free: $FREE_PANE"
