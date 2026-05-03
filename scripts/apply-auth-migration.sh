#!/bin/bash

# Apply Auth Migration Script
# Applies the profiles table migration to your Supabase project

set -e

echo "🔐 Applying Supabase Auth Migration..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with your Supabase credentials"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')

echo "📋 Project: $PROJECT_REF"
echo ""

# Link to remote project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref $PROJECT_REF

# Apply migrations
echo ""
echo "📦 Applying migrations..."
supabase db push

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "Next steps:"
echo "1. Create an admin user: pnpm run auth:create-admin"
echo "2. Test the API: pnpm run auth:test"
