# PowerShell Script to Restore SmartFactory Database on Windows
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SmartFactory Database Restore Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$DB_NAME = "smartfactory_db"
$DB_USER = "postgres"
$BACKUP_FILE = "full_backup_20251118_210248.sql"

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL found: $($psqlPath.Source)" -ForegroundColor Green

# Get PostgreSQL password
Write-Host "`nEnter PostgreSQL password for user '$DB_USER':" -ForegroundColor Yellow
$securePassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variable for password
$env:PGPASSWORD = $DB_PASSWORD

# Check if backup file exists
if (-not (Test-Path $BACKUP_FILE)) {
    Write-Host "ERROR: Backup file '$BACKUP_FILE' not found!" -ForegroundColor Red
    Write-Host "Please make sure the backup file is in the current directory." -ForegroundColor Red
    exit 1
}

Write-Host "`nBackup file found: $BACKUP_FILE" -ForegroundColor Green

# Drop existing database if exists
Write-Host "`nDropping existing database (if exists)..." -ForegroundColor Yellow
psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Could not drop existing database. It might not exist." -ForegroundColor Yellow
}

# Create new database
Write-Host "Creating new database '$DB_NAME'..." -ForegroundColor Yellow
psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create database!" -ForegroundColor Red
    exit 1
}

Write-Host "Database created successfully!" -ForegroundColor Green

# Restore from backup
Write-Host "`nRestoring database from backup..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

psql -U $DB_USER -d $DB_NAME -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Database restored successfully!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    # Verify restoration
    Write-Host "Verifying database tables..." -ForegroundColor Yellow
    psql -U $DB_USER -d $DB_NAME -c "\dt"
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Update the .env file in backend folder with your database credentials" -ForegroundColor White
    Write-Host "2. Run 'cd backend && npm install' to install dependencies" -ForegroundColor White
    Write-Host "3. Run 'npm start' to start the backend server" -ForegroundColor White
    Write-Host "4. Run 'cd ../frontend && npm install' to install frontend dependencies" -ForegroundColor White
    Write-Host "5. Run 'npm run dev' to start the frontend" -ForegroundColor White
} else {
    Write-Host "`nERROR: Database restoration failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    exit 1
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
