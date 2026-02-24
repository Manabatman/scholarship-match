@echo off
echo ========================================
echo Starting Scholarship Match Backend
echo ========================================
cd /d "%~dp0"

:: Activate virtual environment
call venv\Scripts\activate

:: Install dependencies in venv
pip install --upgrade pip
pip install -r requirements.txt

:: Start backend server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
