param(
    [string]$SupabaseUrl,
    [string]$PublishableKey,
    [switch]$CopySchemaToClipboard
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $projectRoot '.env'
$envExamplePath = Join-Path $projectRoot '.env.example'
$schemaPath = Join-Path $projectRoot 'supabase\schema.sql'

function Prompt-ForValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $value = Read-Host $Label
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "$Label cannot be empty."
    }

    return $value.Trim()
}

if (-not $SupabaseUrl) {
    $SupabaseUrl = Prompt-ForValue -Label 'Enter your Supabase project URL'
}

if (-not $PublishableKey) {
    $PublishableKey = Prompt-ForValue -Label 'Enter your Supabase publishable key'
}

if ($SupabaseUrl -notmatch '^https://[a-z0-9-]+\.supabase\.co$') {
    throw "Supabase URL does not look correct. Expected format like https://your-project-id.supabase.co"
}

if ($PublishableKey -notmatch '^sb_publishable_') {
    Write-Warning 'The key you entered does not start with sb_publishable_. Make sure you copied the publishable key, not the secret key.'
}

$envContent = @"
EXPO_PUBLIC_SUPABASE_URL=$SupabaseUrl
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$PublishableKey
"@

Set-Content -LiteralPath $envPath -Value $envContent -Encoding ascii

Write-Host ''
Write-Host 'Created/updated .env successfully:' -ForegroundColor Green
Write-Host "  $envPath"

if (Test-Path $envExamplePath) {
    Write-Host ''
    Write-Host '.env.example still exists for reference:' -ForegroundColor DarkGray
    Write-Host "  $envExamplePath"
}

if ($CopySchemaToClipboard) {
    if (-not (Test-Path $schemaPath)) {
        throw "Could not find schema file: $schemaPath"
    }

    Get-Content -LiteralPath $schemaPath -Raw | Set-Clipboard
    Write-Host ''
    Write-Host 'Copied schema.sql to your clipboard.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Remaining browser steps in Supabase:' -ForegroundColor Cyan
Write-Host '1. Authentication -> Providers -> make sure Email is enabled.'
Write-Host '2. SQL Editor -> New query -> paste schema.sql -> Run.'
Write-Host '3. If you did not use -CopySchemaToClipboard, open supabase\schema.sql and copy it manually.'

Write-Host ''
Write-Host 'Next local commands:' -ForegroundColor Cyan
Write-Host '1. npm run web'
Write-Host '2. npm run start'

Write-Host ''
Write-Host 'Optional usage examples:' -ForegroundColor Cyan
Write-Host "  .\setup-pulsepilot.ps1 -SupabaseUrl '$SupabaseUrl' -PublishableKey 'sb_publishable_...' -CopySchemaToClipboard"
Write-Host '  .\setup-pulsepilot.ps1'
