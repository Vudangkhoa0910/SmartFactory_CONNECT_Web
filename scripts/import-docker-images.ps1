# =============================================================================
# SmartFactory CONNECT - Import Docker Images (Windows PowerShell)
# =============================================================================
# Script này import tất cả Docker images từ các file .tar
# Chạy trong PowerShell với quyền Administrator
# Usage: .\import-docker-images.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SmartFactory CONNECT - Docker Images Import Tool (Windows)   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info 2>&1 | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get script and images directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ImagesDir = Split-Path -Parent $ScriptDir

Write-Host "[INFO] Images directory: $ImagesDir" -ForegroundColor Yellow
Write-Host ""

# List of image files to import
$ImageFiles = @(
    @{File="frontend.tar"; Desc="Frontend (React)"},
    @{File="backend.tar"; Desc="Backend (Node.js)"},
    @{File="rag_service.tar"; Desc="RAG Service (Python)"},
    @{File="pgvector-pg15.tar"; Desc="PostgreSQL 15 + pgvector"},
    @{File="mongo-7.0.tar"; Desc="MongoDB 7.0"},
    @{File="cloudflared.tar"; Desc="Cloudflare Tunnel"}
)

$total = $ImageFiles.Count
$count = 0
$success = 0
$failed = 0

foreach ($img in $ImageFiles) {
    $count++
    $filePath = Join-Path $ImagesDir $img.File
    
    Write-Host "[$count/$total] " -NoNewline -ForegroundColor Cyan
    Write-Host "$($img.Desc)" -NoNewline
    Write-Host " ($($img.File))" -ForegroundColor Gray
    
    if (Test-Path $filePath) {
        $fileSize = (Get-Item $filePath).Length / 1MB
        Write-Host "        Size: $([math]::Round($fileSize, 1)) MB" -ForegroundColor Gray
        
        try {
            Write-Host "        Loading..." -ForegroundColor Yellow -NoNewline
            docker load -i $filePath 2>&1 | Out-Null
            Write-Host "`r        [OK] Loaded successfully     " -ForegroundColor Green
            $success++
        } catch {
            Write-Host "`r        [FAIL] Failed to load        " -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "        [SKIP] File not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "[INFO] Import Summary: $success succeeded, $failed failed" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Verifying imported images:" -ForegroundColor Yellow
docker images --format "table {{.Repository}}:{{.Tag}}`t{{.Size}}" | Select-String -Pattern "smartfactory|pgvector|mongo|cloudflare"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✓ Import Complete!                                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy 'deployment-package' folder to your project location"
Write-Host "2. Open terminal in project folder"
Write-Host "3. Run: " -NoNewline
Write-Host "docker-compose up -d" -ForegroundColor Cyan
Write-Host "4. Wait for services (check with: " -NoNewline
Write-Host "docker ps" -NoNewline -ForegroundColor Cyan
Write-Host ")"
Write-Host "5. Access:"
Write-Host "   - Web Dashboard: " -NoNewline
Write-Host "http://localhost" -ForegroundColor Cyan
Write-Host "   - Backend API:   " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - RAG Service:   " -NoNewline
Write-Host "http://localhost:8001" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
