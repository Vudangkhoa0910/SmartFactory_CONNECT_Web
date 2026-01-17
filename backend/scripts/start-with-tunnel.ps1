<#
.SYNOPSIS
    SmartFactory CONNECT - Docker Cloudflare Tunnel (Windows PowerShell)
.DESCRIPTION
    This script starts the Cloudflare Tunnel via Docker and retrieves the public URL.
    It assumes the Backend and other services are already running in Docker.
#>

$ErrorActionPreference = "Stop"
$TUNNEL_URL_FILE = "$env:TEMP\cloudflared-url.txt"

# Colors
function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color -NoNewline }
function Write-ColorLine($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Host ""
Write-ColorLine "╔═══════════════════════════════════════════════════════════════╗" Cyan
Write-ColorLine "║       SmartFactory CONNECT - Docker Cloudflare Tunnel         ║" Cyan
Write-ColorLine "╚═══════════════════════════════════════════════════════════════╝" Cyan
Write-Host ""

# 1. Start Cloudflare Tunnel Container
Write-ColorLine "🚀 Starting Cloudflare Tunnel container..." Blue
try {
    # Run from project root (assuming script is in backend/scripts)
    $projectRoot = Resolve-Path "$PSScriptRoot\..\.."
    Set-Location $projectRoot
    
    docker compose up -d cloudflared
} catch {
    Write-ColorLine "❌ Failed to start Docker container. Is Docker running?" Red
    Write-ColorLine $_.Exception.Message Yellow
    exit 1
}

# 2. Wait for Tunnel URL
Write-Host ""
Write-Color "⏳ Waiting for tunnel URL from logs..." Yellow

$attempts = 0
$maxAttempts = 30
$tunnelUrl = ""
$containerName = "smartfactory_tunnel"

while ($attempts -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempts++
    Write-Color "." Yellow

    # Get logs from container
    $logs = docker logs $containerName 2>&1
    
    # Search for URL
    if ($logs -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
        $tunnelUrl = $matches[0]
        break
    }
}
Write-Host ""

if (-not $tunnelUrl) {
    Write-ColorLine "❌ Failed to get tunnel URL after $maxAttempts attempts" Red
    Write-ColorLine "   Check logs manually: docker logs $containerName" Yellow
    exit 1
}

# 3. Save and Display
$tunnelUrl | Out-File -FilePath $TUNNEL_URL_FILE -Encoding utf8 -Force

Write-Host ""
Write-ColorLine "╔═══════════════════════════════════════════════════════════════╗" Green
Write-ColorLine "║              🚀 CLOUDFLARE TUNNEL ACTIVE                      ║" Green
Write-ColorLine "╠═══════════════════════════════════════════════════════════════╣" Green
Write-Color "║  " Green; Write-Color "Public URL:" Cyan; Write-ColorLine " $tunnelUrl" Green
Write-ColorLine "╠═══════════════════════════════════════════════════════════════╣" Green
Write-Color "║  " Green; Write-Color "API:" Cyan; Write-ColorLine "     $tunnelUrl/api" Green
Write-Color "║  " Green; Write-Color "Swagger:" Cyan; Write-ColorLine " $tunnelUrl/api-docs" Green
Write-ColorLine "╠═══════════════════════════════════════════════════════════════╣" Green
Write-ColorLine "║  📋 URL saved to: $TUNNEL_URL_FILE" Yellow
Write-ColorLine "╚═══════════════════════════════════════════════════════════════╝" Green
Write-Host ""

Set-Clipboard -Value $tunnelUrl
Write-ColorLine "📋 URL copied to clipboard!" Green
