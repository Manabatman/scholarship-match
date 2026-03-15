@echo off
echo ========================================
echo Starting ISKONNECT Frontend
echo ========================================
echo.

cd /d "%~dp0"

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo npm install failed!
    pause
    exit /b 1
)

REM Free port 5173 if already in use
call python ..\free_port.py 5173

echo.
echo Starting development server...
echo Frontend will be at http://localhost:5173
echo.
call npm run dev
pause
