#!/usr/bin/env bash
# #region agent log
# Debug instrumentation for icon-appears-red bug (session 4702f2).
# Post-fix verification: confirms deployed icons + sideloaded manifest version.
set -u
LOG_FILE="/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-4702f2.log"
SESSION_ID="4702f2"
RUN_ID="${RUN_ID:-post-fix}"

py_json_str() { python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$1"; }
py_json_stdin() { python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))'; }
emit() {
  local h="$1" loc="$2" msg="$3" data="$4"
  local ts; ts=$(python3 -c 'import time;print(int(time.time()*1000))' 2>/dev/null || date +%s000)
  printf '{"sessionId":"%s","runId":"%s","hypothesisId":"%s","location":"%s","message":%s,"data":%s,"timestamp":%s}\n' \
    "$SESSION_ID" "$RUN_ID" "$h" "$loc" "$(py_json_str "$msg")" "$data" "$ts" >> "$LOG_FILE"
}

# --- Confirm new icons are reachable on the live deployment ---
for sz in 16 32 64 80 128; do
  url="https://addin.silkview.org/icon-$sz.png?v=3"
  status=$(curl -sIL "$url" 2>/dev/null | awk 'NR==1{print $2}')
  tmp=$(mktemp -t silkview-deploy-XXXX).png
  curl -sL "$url" -o "$tmp" 2>/dev/null
  bytes=$(stat -f '%z' "$tmp" 2>/dev/null || echo 0)
  sha=$(shasum "$tmp" 2>/dev/null | awk '{print $1}')
  head_hex=$(xxd -p -l 16 "$tmp" 2>/dev/null | tr -d '\n')
  emit "H14" "live-icon" "Deployed icon HEAD" \
    "{\"url\":\"$url\",\"status\":\"$status\",\"bytes\":$bytes,\"sha1\":\"$sha\",\"head_hex\":\"$head_hex\"}"
  rm -f "$tmp"
done

# --- Confirm sideloaded manifest matches v1.0.0.3 + has VersionOverrides ---
MAN="$HOME/Library/Containers/com.microsoft.Excel/Data/Documents/wef/silkview-connect-manifest.xml"
if [[ -f "$MAN" ]]; then
  ver=$(grep -oE '<Version>[^<]+</Version>' "$MAN" | head -1)
  vo=$(grep -c "VersionOverrides" "$MAN")
  emit "H14" "sideloaded-manifest" "Sideloaded manifest status" \
    "{\"path\":\"$MAN\",\"version\":\"$ver\",\"versionOverridesCount\":$vo}"
else
  emit "H14" "sideloaded-manifest" "Sideloaded manifest missing" "{\"path\":\"$MAN\"}"
fi

# --- Cache.db re-check ---
CFN="$HOME/Library/Containers/com.microsoft.Excel/Data/Library/Caches/com.microsoft.Excel/Cache.db"
if [[ -f "$CFN" ]]; then
  python3 - "$CFN" <<'PY' > /tmp/__cdb_post 2>/dev/null
import sys, sqlite3, hashlib, json
con = sqlite3.connect(sys.argv[1]); cur = con.cursor()
rows = cur.execute("""SELECT r.entry_ID, r.request_key, r.time_stamp, length(d.receiver_data) AS blob_len,
                              substr(d.receiver_data,1,16) AS head
                       FROM cfurl_cache_response r LEFT JOIN cfurl_cache_receiver_data d USING(entry_ID)
                       WHERE r.request_key LIKE '%silkview%'""").fetchall()
out = []
for eid, key, ts, blob_len, head in rows:
    out.append({"entry_ID": eid, "key": key, "time_stamp": ts, "blob_len": blob_len,
                "head_hex": head.hex() if head else None})
print(json.dumps(out))
PY
  emit "H14" "cachedb-postfix" "Cache.db silkview entries (post-fix)" "{\"rows\":$(cat /tmp/__cdb_post 2>/dev/null || echo '[]')}"
  rm -f /tmp/__cdb_post
fi

echo "Wrote post-fix diagnostics to $LOG_FILE"
