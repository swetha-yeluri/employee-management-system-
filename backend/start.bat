@echo off
cd /d "%~dp0"
echo ============================================================
echo  Starting backend (Windows)
echo ============================================================
echo Stopping anything already on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

if not exist .venv (
  echo Creating virtual environment...
  python -m venv .venv
)
call .venv\Scripts\activate.bat

echo Installing dependencies...
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q

echo Resetting database (schema changed)...
if exist employees.db del /f /q employees.db

echo Starting server at http://localhost:8000 ...
python run.py
