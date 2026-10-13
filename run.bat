@echo off
setlocal enabledelayedexpansion

title ScoutIQ Launcher
cd /d "%~dp0"

echo ===============================================================================
echo                ScoutIQ - Football Intelligence Platform
echo ===============================================================================
echo.

:: 1. Verify Python / Virtual Environment
set "PYTHON_EXEC="
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXEC=%~dp0.venv\Scripts\python.exe"
    echo [*] Found local Python virtual environment in .venv
) else (
    where python >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYTHON_EXEC=python"
        echo [*] Using system Python
    ) else (
        echo [ERROR] Python was not found in your PATH or in .venv.
        echo         Please install Python 3.10+ or create a .venv before running.
        echo.
        pause
        exit /b 1
    )
)

:: 2. Verify Node.js / npm
where npm >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js / npm was not found in your PATH.
    echo         Please install Node.js from https://nodejs.org/ before running.
    echo.
    pause
    exit /b 1
)

:: 3. Check for .env file
if not exist "%~dp0.env" (
    echo [WARNING] No .env file found in project root.
    if exist "%~dp0.env.example" (
        echo           Creating .env from .env.example template...
        copy "%~dp0.env.example" "%~dp0.env" >nul
        echo           Please configure your MySQL database credentials in .env if needed.
    )
)

:: 4. Check frontend dependencies
if not exist "%~dp0frontend\node_modules" (
    echo [*] Installing frontend dependencies - node_modules missing...
    cd /d "%~dp0frontend" && call npm install && cd /d "%~dp0"
)

echo.
echo [*] Launching ScoutIQ Backend on http://127.0.0.1:8000 ...
start "ScoutIQ Backend (FastAPI)" /D "%~dp0" cmd /k ""!PYTHON_EXEC!" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Launching ScoutIQ Frontend on http://localhost:5173 ...
start "ScoutIQ Frontend (Vite)" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo ===============================================================================
echo  Services launched in dedicated console windows:
echo ===============================================================================
echo   - Web Application:   http://localhost:5173
echo   - REST API:          http://127.0.0.1:8000
echo   - Interactive Docs:  http://127.0.0.1:8000/docs
echo ===============================================================================
echo.
echo Opening ScoutIQ in your default browser...
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173

echo.
echo [*] Launcher ready. To stop the servers, close the Backend and Frontend windows.
echo.
