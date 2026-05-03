# Apply Auth Migration Script (PowerShell)
# Applies the profiles table migration to your Supabase project

Write-Host "🔐 Applying Supabase Auth Migration..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "Please create .env file with your Supabase credentials"
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Check if required variables are set
$supabaseUrl = $env:SUPABASE_URL
$supabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseServiceKey) {
    Write-Host "❌ Error: Missing required environment variables" -ForegroundColor Red
    Write-Host "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
    exit 1
}

# Extract project ref from URL
$projectRef = $supabaseUrl -replace 'https://([^.]+).*', '$1'

Write-Host "📋 Project: $projectRef" -ForegroundColor Yellow
Write-Host ""

# Link to remote project
Write-Host "🔗 Linking to Supabase project..." -ForegroundColor Cyan
supabase link --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}

# Apply migrations
Write-Host ""
Write-Host "📦 Applying migrations..." -ForegroundColor Cyan
supabase db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to apply migrations" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Create an admin user: pnpm run auth:create-admin <email> <password>"
Write-Host "2. Test the API: pnpm run auth:test <email> <password>"
