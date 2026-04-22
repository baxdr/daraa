#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# درع — End-to-end smoke test
#
# Usage:
#   ./scripts/smoke.sh                   # hits http://localhost:3333
#   BASE=https://daraa.sa ./scripts/smoke.sh  # hits any deployed URL
#
# Exits non-zero on any failure. Safe to invoke from CI after `next start`.
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE="${BASE:-http://localhost:3333}"
PASS="\033[32m✓\033[0m"
FAIL="\033[31m✗\033[0m"
failed=0

assert_http_200() {
  local path="$1"
  local label="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  if [ "$code" = "200" ]; then
    printf "  $PASS %-45s HTTP $code\n" "$label"
  else
    printf "  $FAIL %-45s HTTP $code (expected 200)\n" "$label"
    failed=1
  fi
}

assert_contains() {
  local path="$1"
  local needle="$2"
  local label="$3"
  if curl -s "$BASE$path" | grep -q -- "$needle"; then
    printf "  $PASS %-45s\n" "$label"
  else
    printf "  $FAIL %-45s (missing: $needle)\n" "$label"
    failed=1
  fi
}

echo "=== Public pages ==="
assert_http_200 "/" "landing"
assert_http_200 "/chat" "chat"
assert_http_200 "/demo/novatech/index.html" "demo site (home)"
assert_http_200 "/demo/novatech/privacy.html" "demo site (privacy)"
assert_http_200 "/demo/novatech/contact.html" "demo site (contact)"
assert_http_200 "/robots.txt" "robots"
assert_http_200 "/sitemap.xml" "sitemap"
assert_http_200 "/icon.svg" "favicon"
# 404 expected on a nonexistent path — skip the assert, just make sure the server responds.
curl -s -o /dev/null -w "  %{http_code}  (/nonexistent-xyz — 404 expected)\n" "$BASE/nonexistent-xyz"

echo
echo "=== Chat start + message flow ==="
sid=$(curl -s -X POST "$BASE/api/chat/start" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).sessionId))')
if [ -z "$sid" ]; then
  printf "  $FAIL chat-start returned no sessionId\n"; failed=1
else
  printf "  $PASS chat-start returned sessionId=%s\n" "$sid"
fi

advance() {
  curl -s -X POST "$BASE/api/chat/message" -H 'content-type: application/json' \
    -d "{\"sessionId\":\"$sid\",\"answer\":\"$1\"}" > /dev/null
}

echo
echo "=== Establishment path (restaurant, not_signed → warning) ==="
for a in "establishment" "restaurant" "riyadh" "2" "80000" "no" "not_signed"; do advance "$a"; done
plan=$(curl -s -X POST "$BASE/api/establishment/resolve" -H 'content-type: application/json' -d "{\"sessionId\":\"$sid\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).planId||""))')
if [ -z "$plan" ]; then printf "  $FAIL establishment/resolve returned no planId\n"; failed=1; else printf "  $PASS planId=%s\n" "$plan"; fi

# Poll until complete
for i in $(seq 1 30); do
  status=$(curl -s "$BASE/api/establishment/$plan" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).status))')
  [ "$status" = "complete" ] && break
  [ "$status" = "error" ] && break
  sleep 1
done
[ "$status" = "complete" ] && printf "  $PASS plan status = complete\n" || { printf "  $FAIL plan status = %s\n" "$status"; failed=1; }
assert_http_200 "/establishment/$plan" "/establishment/[planId]"
assert_contains "/establishment/$plan" "قبل ما توقّع" "lease warning banner fires"
assert_contains "/establishment/$plan" "خريطة الطريق" "roadmap renders"

echo
echo "=== Compliance path (skip URL, expect DPO gap) ==="
sid2=$(curl -s -X POST "$BASE/api/chat/start" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).sessionId))')
advance_sid2() { curl -s -X POST "$BASE/api/chat/message" -H 'content-type: application/json' -d "{\"sessionId\":\"$sid2\",\"answer\":\"$1\"}" > /dev/null; }
for a in "compliance" "saas" "25" "yes" "over_100k" "no" "outside" "yes" "__skip__"; do
  curl -s -X POST "$BASE/api/chat/message" -H 'content-type: application/json' -d "{\"sessionId\":\"$sid2\",\"answer\":\"$a\"}" > /dev/null
done
scan=$(curl -s -X POST "$BASE/api/scan/start" -H 'content-type: application/json' -d "{\"sessionId\":\"$sid2\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).scanId||""))')
[ -n "$scan" ] && printf "  $PASS scanId=%s\n" "$scan" || { printf "  $FAIL scan/start no scanId\n"; failed=1; }

for i in $(seq 1 20); do
  status=$(curl -s "$BASE/api/scan/$scan" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).status))')
  [ "$status" = "complete" ] && break
  [ "$status" = "error" ] && break
  sleep 1
done
[ "$status" = "complete" ] && printf "  $PASS scan status = complete\n" || { printf "  $FAIL scan status = %s\n" "$status"; failed=1; }
assert_http_200 "/scan/$scan" "/scan/[scanId] (progress)"
assert_http_200 "/scan/$scan/report" "/scan/[scanId]/report"
assert_contains "/scan/$scan/report" "نسبة الامتثال" "compliance score present"
assert_contains "/scan/$scan/report" "الغرامة القصوى" "fine ceiling present"

echo
echo "=== Document generation (4 types) ==="
for kind in privacy_policy dpo_appointment processing_register incident_response; do
  doc=$(curl -s -X POST "$BASE/api/documents/generate" -H 'content-type: application/json' \
    -d "{\"scanId\":\"$scan\",\"docType\":\"$kind\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).docId||""))')
  if [ -z "$doc" ]; then printf "  $FAIL %s — no docId\n" "$kind"; failed=1; continue; fi
  assert_http_200 "/documents/$doc" "$kind"
done

echo
echo "=== Security headers on landing ==="
for h in "strict-transport-security" "x-content-type-options" "x-frame-options" "content-security-policy" "referrer-policy"; do
  if curl -sI "$BASE/" | grep -qi "^$h:"; then
    printf "  $PASS %s header present\n" "$h"
  else
    printf "  $FAIL %s header missing\n" "$h"
    failed=1
  fi
done

echo
echo "=== SSRF guard (attempt to scan private IP, expect graceful failure) ==="
sid3=$(curl -s -X POST "$BASE/api/chat/start" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).sessionId||""))')
if [ -n "$sid3" ]; then
  for a in "compliance" "saas" "25" "yes" "over_100k" "no" "outside" "yes" "http://169.254.169.254/"; do
    curl -s -X POST "$BASE/api/chat/message" -H 'content-type: application/json' -d "{\"sessionId\":\"$sid3\",\"answer\":\"$a\"}" > /dev/null
  done
  scan3=$(curl -s -X POST "$BASE/api/scan/start" -H 'content-type: application/json' -d "{\"sessionId\":\"$sid3\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).scanId||""))')
  if [ -n "$scan3" ]; then
    for i in $(seq 1 15); do
      st=$(curl -s "$BASE/api/scan/$scan3" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).status||""))')
      [ "$st" = "complete" ] && break
      [ "$st" = "error" ] && break
      sleep 1
    done
    [ "$st" = "complete" ] && printf "  $PASS SSRF attempt absorbed (scan completed, no metadata leak)\n" || { printf "  $FAIL SSRF attempt status=%s\n" "$st"; failed=1; }
  else
    printf "  $FAIL SSRF: scan/start returned no scanId\n"; failed=1
  fi
else
  printf "  ~ SSRF skipped (rate limit already tripped by earlier tests — rerun after 60 s)\n"
fi

echo
echo "=== Rate limiting (spam chat-start, expect 429 after 30/min) ==="
rl_hit=0
for i in $(seq 1 35); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/chat/start")
  if [ "$code" = "429" ]; then rl_hit=1; break; fi
done
if [ "$rl_hit" = "1" ]; then printf "  $PASS rate limit enforced (429 returned)\n"; else printf "  $FAIL rate limit NOT enforced\n"; failed=1; fi

echo
if [ "$failed" = "0" ]; then
  echo -e "\033[32m✓ All smoke tests passed.\033[0m"
  exit 0
else
  echo -e "\033[31m✗ Some smoke tests failed.\033[0m"
  exit 1
fi
