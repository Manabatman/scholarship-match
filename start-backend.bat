@echo off
echo ========================================
echo Starting Scholarship Match Backend
echo ========================================
echo.

cd /d "%~dp0"

REM Activate venv
if exist venv\Scripts\activate (
    call venv\Scripts\activate
) else (
    echo Creating virtual environment...
    py -3.11 -m venv venv
    call venv\Scripts\activate
)

echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

REM Seed the database
echo Seeding database...
python seed_data.py

REM Start backend server
echo Starting backend server on http://localhost:8000
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
