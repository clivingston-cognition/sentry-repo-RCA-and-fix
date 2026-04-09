#!/usr/bin/env bash
# Trigger Bug #1: Null Reference Error
# Requests a user that doesn't exist, causing a TypeError
# when the code tries to access properties on `undefined`.
#
# Expected Sentry Error:
#   TypeError: Cannot read properties of undefined (reading 'name')
#   at /src/routes/users.js

BASE_URL="${API_URL:-http://localhost:3000}"

echo "🐛 Triggering Bug #1: Null Reference Error"
echo "   GET ${BASE_URL}/api/users/9999"
echo ""

curl -s -w "\n\nHTTP Status: %{http_code}\n" \
  "${BASE_URL}/api/users/9999" | jq . 2>/dev/null || cat

echo ""
echo "✅ Check Sentry for: TypeError — Cannot read properties of undefined"
