# PowerShell script to get token and save it to a variable
# Usage: . .\scripts\save-token.ps1 testadmin@example.com TestAdmin123!

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

Write-Host "🔐 Getting access token..." -ForegroundColor Cyan

# Get the token using the Node.js script
$output = node scripts/get-auth-token.js $Email $Password 2>&1 | Out-String

# Extract just the token (the line after "ACCESS TOKEN")
$lines = $output -split "`n"
$tokenIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "ACCESS TOKEN") {
        $tokenIndex = $i + 2  # Token is 2 lines after the header
        break
    }
}

if ($tokenIndex -eq -1 -or $tokenIndex -ge $lines.Count) {
    Write-Host "❌ Failed to get token" -ForegroundColor Red
    Write-Host $output
    exit 1
}

$token = $lines[$tokenIndex].Trim()

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Failed to extract token" -ForegroundColor Red
    Write-Host $output
    exit 1
}

# Set the token as a global variable
$global:TOKEN = $token

Write-Host "✅ Token saved to `$TOKEN variable" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use it in curl commands:" -ForegroundColor Yellow
Write-Host "  curl http://localhost:3002/api/v1/admin/products -H `"Authorization: Bearer `$TOKEN`"" -ForegroundColor White
Write-Host ""
Write-Host "Token expires in 1 hour." -ForegroundColor Gray
