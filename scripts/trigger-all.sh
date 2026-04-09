#!/usr/bin/env bash
# Trigger all demo bugs in sequence.
# Useful for a quick demo — fires all three bugs back-to-back.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  Sentry RCA Demo — Triggering All Bugs"
echo "============================================"
echo ""

echo "────────────────────────────────────────────"
bash "${SCRIPT_DIR}/trigger-null-ref.sh"
echo ""

echo "────────────────────────────────────────────"
bash "${SCRIPT_DIR}/trigger-type-error.sh"
echo ""

echo "────────────────────────────────────────────"
bash "${SCRIPT_DIR}/trigger-async-error.sh"
echo ""

echo "============================================"
echo "  All bugs triggered!"
echo "  Check your Sentry dashboard for 3 new issues."
echo "============================================"
