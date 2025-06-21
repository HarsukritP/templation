#!/bin/bash

echo "Testing Templation health endpoint..."
echo "=================================="

URL="https://templation.up.railway.app/api/health"

echo "Checking: $URL"
echo ""

# Test with curl
curl -v -H "Accept: application/json" "$URL"

echo ""
echo ""
echo "Testing with timeout..."
curl -m 10 -f "$URL" 2>/dev/null && echo "✅ Health check passed" || echo "❌ Health check failed" 