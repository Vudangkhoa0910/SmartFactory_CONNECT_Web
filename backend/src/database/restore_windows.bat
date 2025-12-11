@echo off
REM Batch Script to Restore SmartFactory Database on Windows
REM Run this script as Administrator

echo ========================================
echo SmartFactory Database Restore Script
echo ========================================
echo.

REM Configuration
set DB_NAME=smartfactory_db
set DB_USER=postgres
set BACKUP_FILE=full_backup_20251118_210248.sql

REM Check if PostgreSQL is installed
echo Checking PostgreSQL installation...
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH!
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo PostgreSQL found!
echo.

REM Get PostgreSQL password
set /p DB_PASSWORD="Enter PostgreSQL password for user '%DB_USER%': "
set PGPASSWORD=%DB_PASSWORD%

REM Check if backup file exists
if not exist "%BACKUP_FILE%" (
    echo ERROR: Backup file '%BACKUP_FILE%' not found!
    echo Please make sure the backup file is in the current directory.
    pause
    exit /b 1
)

echo Backup file found: %BACKUP_FILE%
echo.

REM Drop existing database if exists
echo Dropping existing database (if exists)...
psql -U %DB_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul

REM Create new database
echo Creating new database '%DB_NAME%'...
psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to create database!
    pause
    exit /b 1
)

echo Database created successfully!
echo.

REM Restore from backup
echo Restoring database from backup...
echo This may take a few minutes...
echo.

psql -U %DB_USER% -d %DB_NAME% -f %BACKUP_FILE%

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo Database restored successfully!
    echo ========================================
    echo.
    
    echo Verifying database tables...
    psql -U %DB_USER% -d %DB_NAME% -c "\dt"
    
    echo.
    echo Next steps:
    echo 1. Update the .env file in backend folder with your database credentials
    echo 2. Run 'cd backend && npm install' to install dependencies
    echo 3. Run 'npm start' to start the backend server
    echo 4. Run 'cd ../frontend && npm install' to install frontend dependencies
    echo 5. Run 'npm run dev' to start the frontend
) else (
    echo.
    echo ERROR: Database restoration failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

REM Clear password from environment
set PGPASSWORD=

echo.
pause
