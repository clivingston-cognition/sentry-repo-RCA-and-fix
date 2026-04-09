#!/usr/bin/env bash
# Trigger Bug #3: Unhandled Promise Rejection
# The /process-queue endpoint uses `.forEach()` with async callbacks.
# When an order with an invalid total is processed, the async function
# throws but the error is never caught — creating an UnhandledPromiseRejection.
#
# NOTE: You should trigger Bug #2 first to create an order with NaN total,
# then trigger this bug to process that invalid order.
#
# Expected Sentry Error:
#   Error: Failed to process order X: invalid total (NaN)
#   at processOrder (/src/routes/orders.js)

BASE_URL="${API_URL:-http://localhost:3000}"

echo "🐛 Triggering Bug #3: Unhandled Promise Rejection"
echo ""
echo "   Step 1: Creating an order with invalid quantity (to get NaN total)..."
curl -s -X POST "${BASE_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      { "productId": 1, "quantity": "two" }
    ]
  }' > /dev/null 2>&1

# Note: The above will throw, but that's Bug #2. We also need a zero-total order.
echo "   Step 2: Creating an order with zero-quantity (to get 0 total)..."
curl -s -X POST "${BASE_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      { "productId": 1, "quantity": 0 }
    ]
  }' > /dev/null 2>&1

echo "   Step 3: Processing the order queue..."
echo "   GET ${BASE_URL}/api/orders/process-queue"
echo ""

curl -s -w "\n\nHTTP Status: %{http_code}\n" \
  "${BASE_URL}/api/orders/process-queue" | jq . 2>/dev/null || cat

echo ""
echo "✅ Check Sentry for: UnhandledPromiseRejection — Failed to process order"
