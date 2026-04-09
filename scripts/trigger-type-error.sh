#!/usr/bin/env bash
# Trigger Bug #2: Type Coercion / NaN Error
# Sends a string value for `quantity` instead of a number.
# The multiplication `"two" * 29.99` produces NaN, which then
# causes a TypeError when the code validates the order total.
#
# Expected Sentry Error:
#   TypeError: Order total calculation failed: expected a number but got NaN
#   at /src/routes/orders.js

BASE_URL="${API_URL:-http://localhost:3000}"

echo "🐛 Triggering Bug #2: Type Coercion / NaN Error"
echo "   POST ${BASE_URL}/api/orders"
echo ""

curl -s -w "\n\nHTTP Status: %{http_code}\n" \
  -X POST "${BASE_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      { "productId": 1, "quantity": "two" }
    ]
  }' | jq . 2>/dev/null || cat

echo ""
echo "✅ Check Sentry for: TypeError — Order total calculation failed"
