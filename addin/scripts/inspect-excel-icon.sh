#!/usr/bin/env bash
# #region agent log
# Debug instrumentation for icon-appears-red bug (session 4702f2).
# Writes NDJSON lines to the session log file so the agent can analyze.
# Does NOT touch any user data, only reads filesystem locations.
set -u
LOG_FILE="/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-4702f2.log"
SESSION_ID="4702f2"
RUN_ID="${RUN_ID:-run1}"

emit() {
  local hypothesis="$1"
  local location="$2"
  local message="$3"
  local data_json="$4"
  local ts
  ts=$(python3 -c 'import time;print(int(time.time()*1000))' 2>/dev/null || date +%s000)
  printf '{"sessionId":"%s","runId":"%s","hypothesisId":"%s","location":"%s","message":%s,"data":%s,"timestamp":%s}\n' \
    "$SESSION_ID" "$RUN_ID" "$hypothesis" "$location" \
    "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$message")" \
    "$data_json" "$ts" >> "$LOG_FILE"
}

json_escape() {
  python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))'
}

# H1/H3 — Office Wef icon cache contents.
WEF_DIR="$HOME/Library/Containers/com.microsoft.Excel/Data/Library/Caches/com.microsoft.Excel/Wef"
if [[ -d "$WEF_DIR" ]]; then
  count=$(find "$WEF_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
  png_count=$(find "$WEF_DIR" -type f -name '*.png' 2>/dev/null | wc -l | tr -d ' ')
  png_list=$(find "$WEF_DIR" -type f -name '*.png' -exec stat -f '%Sm %z %N' -t '%Y-%m-%dT%H:%M:%S' {} \; 2>/dev/null | head -20 | json_escape)
  emit "H1" "wef-cache" "Excel Wef icon cache listing" \
    "{\"dir\":\"$WEF_DIR\",\"totalFiles\":$count,\"pngFiles\":$png_count,\"pngListing\":$png_list}"

  # H5 — inspect each cached PNG: size + sha + dominant pixel via Python (Pillow optional)
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    size=$(stat -f '%z' "$f" 2>/dev/null || echo 0)
    sha=$(shasum "$f" 2>/dev/null | awk '{print $1}')
    color=$(python3 - "$f" <<'PY' 2>/dev/null || echo "{}"
import sys, json
try:
    from PIL import Image
    im = Image.open(sys.argv[1]).convert("RGBA")
    w, h = im.size
    px = im.getpixel((w//2, h//2))
    print(json.dumps({"w":w,"h":h,"centerRGBA":list(px)}))
except Exception as e:
    print(json.dumps({"err":str(e)}))
PY
    )
    emit "H5" "wef-png" "Cached Wef PNG" \
      "{\"path\":\"$f\",\"size\":$size,\"sha1\":\"$sha\",\"color\":$color}"
  done < <(find "$WEF_DIR" -type f -name '*.png' 2>/dev/null | head -10)
else
  emit "H1" "wef-cache" "Wef cache dir missing" "{\"dir\":\"$WEF_DIR\"}"
fi

# H2 — sideloaded manifest contents on disk
WEF_MANIFEST_DIR="$HOME/Library/Containers/com.microsoft.Excel/Data/Documents/wef"
if [[ -d "$WEF_MANIFEST_DIR" ]]; then
  files=$(find "$WEF_MANIFEST_DIR" -type f 2>/dev/null | json_escape)
  emit "H2" "wef-manifests" "Sideloaded manifest folder" "{\"dir\":\"$WEF_MANIFEST_DIR\",\"files\":$files}"
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    body=$(cat "$f" 2>/dev/null | json_escape)
    emit "H2" "wef-manifest-body" "Manifest contents" "{\"path\":\"$f\",\"xml\":$body}"
  done < <(find "$WEF_MANIFEST_DIR" -type f -name '*.xml' 2>/dev/null | head -5)
else
  emit "H2" "wef-manifests" "Wef manifest dir missing" "{\"dir\":\"$WEF_MANIFEST_DIR\"}"
fi

# H4 — re-verify deployed icon headers from the user's machine.
hdrs=$(curl -sI 'https://addin.silkview.org/icon-32.png' 2>/dev/null | json_escape)
emit "H4" "deployed-icon-headers" "Deployed icon response headers (from user's network)" "{\"headers\":$hdrs}"

echo "Debug data written to $LOG_FILE"
