# ScoutIQ PowerShell Launcher
$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "               ScoutIQ - Football Intelligence Platform" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Python / Virtual Environment
$PythonExec = ""
if (Test-Path "$ProjectRoot\.venv\Scripts\python.exe") {
    $PythonExec = "$ProjectRoot\.venv\Scripts\python.exe"
    Write-Host "[*] Found local Python virtual environment in .venv" -ForegroundColor Green
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PythonExec = "python"
    Write-Host "[*] Using system Python" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Python was not found in your PATH or in .venv." -ForegroundColor Red
    Write-Host "        Please install Python 3.10+ or create a .venv before running."
    pause
    exit 1
}

# 2. Check Node.js / npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js / npm was not found in your PATH." -ForegroundColor Red
    Write-Host "        Please install Node.js from https://nodejs.org/ before running."
    pause
    exit 1
}

# 3. Check for .env file
if (-not (Test-Path "$ProjectRoot\.env")) {
    Write-Host "[WARNING] No .env file found in project root." -ForegroundColor Yellow
    if (Test-Path "$ProjectRoot\.env.example") {
        Write-Host "          Creating .env from .env.example template..." -ForegroundColor Gray
        Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
    }
}

# 4. Check frontend dependencies
if (-not (Test-Path "$ProjectRoot\frontend\node_modules")) {
    Write-Host "[*] Installing frontend dependencies (node_modules missing)..." -ForegroundColor Yellow
    Push-Location "$ProjectRoot\frontend"
    npm install
    Pop-Location
}

Write-Host ""
Write-Host "[*] Launching ScoutIQ Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title ScoutIQ Backend (FastAPI) & cd /d `"$ProjectRoot`" & `"$PythonExec`" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[*] Launching ScoutIQ Frontend on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title ScoutIQ Frontend (Vite) & cd /d `"$ProjectRoot\frontend`" & npm run dev"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " Services launched in dedicated console windows:" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  - Web Application:   http://localhost:5173"
Write-Host "  - REST API:          http://127.0.0.1:8000"
Write-Host "  - Interactive Docs:  http://127.0.0.1:8000/docs"
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Opening ScoutIQ in your default browser..." -ForegroundColor Gray

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "[*] Launcher ready. To stop the servers, close the Backend and Frontend windows." -ForegroundColor Green
Write-Host ""
