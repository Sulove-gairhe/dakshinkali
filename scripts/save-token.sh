#!/bin/bash

# Script to get token and save it to a file that can be sourced
# Usage: source scripts/save-token.sh testadmin@example.com TestAdmin123!

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: source scripts/save-token.sh <email> <password>"
    echo "Example: source scripts/save-token.sh testadmin@example.com TestAdmin123!"
    return 1 2>/dev/null || exit 1
fi

echo "🔐 Getting access token..."

# Get the token using the Node.js script
OUTPUT=$(node scripts/get-auth-token.js "$1" "$2" 2>&1)

# Extract just the token (the line after "ACCESS TOKEN")
TOKEN=$(echo "$OUTPUT" | grep -A 1 "ACCESS TOKEN" | tail -n 1 | tr -d '[:space:]')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    echo "$OUTPUT"
    return 1 2>/dev/null || exit 1
fi

# Export the token
export TOKEN="$TOKEN"

echo "✅ Token saved to \$TOKEN variable"
echo ""
echo "You can now use it in curl commands:"
echo "  curl http://localhost:3002/api/v1/admin/products -H \"Authorization: Bearer \$TOKEN\""
echo ""
echo "Token expires in 1 hour."
