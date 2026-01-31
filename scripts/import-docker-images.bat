@echo off
REM =============================================================================
REM SmartFactory CONNECT - Import Docker Images (Windows Batch)
REM =============================================================================
REM Script này import tất cả Docker images từ các file .tar
REM Chạy trong Command Prompt với quyền Administrator
REM =============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   SmartFactory CONNECT - Docker Images Import Tool (Windows)   ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [INFO] Docker is running. Starting import...
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "IMAGES_DIR=%SCRIPT_DIR%.."

REM List of image files to import
set "IMAGE_FILES=frontend.tar backend.tar rag_service.tar pgvector-pg15.tar mongo-7.0.tar cloudflared.tar"

REM Import each image
set /a count=0
set /a total=6

for %%f in (%IMAGE_FILES%) do (
    set /a count+=1
    if exist "%IMAGES_DIR%\%%f" (
        echo [!count!/!total!] Loading: %%f
        docker load -i "%IMAGES_DIR%\%%f"
        if errorlevel 1 (
            echo     [WARN] Failed to load %%f
        ) else (
            echo     [OK] Loaded successfully
        )
    ) else (
        echo [!count!/!total!] [SKIP] File not found: %%f
    )
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo [INFO] Import completed! Verifying images...
echo ═══════════════════════════════════════════════════════════════════
echo.

docker images | findstr "smartfactory pgvector mongo cloudflare"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   ✓ Import Complete!                                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Next Steps:
echo 1. Copy 'deployment-package' folder to your project location
echo 2. Navigate to project folder in terminal
echo 3. Run: docker-compose up -d
echo 4. Wait for all services to start (check: docker ps)
echo 5. Access: http://localhost (Web) or http://localhost:3000 (API)
echo.

pause
