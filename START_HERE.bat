@echo off
title Employee Management System - Launcher
echo ============================================================
echo  Employee Management System
echo  This opens TWO windows: backend (8000) and frontend (5173)
echo ============================================================
echo.
echo Freeing port 8000 (stopping any old backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
echo Freeing port 5173 (stopping any old frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
echo.
echo Starting BACKEND window...
start "EMS Backend" cmd /k "cd /d "%~dp0backend" && call start.bat"
echo Waiting for backend to boot...
timeout /t 4 >nul
echo Starting FRONTEND window...
start "EMS Frontend" cmd /k "cd /d "%~dp0frontend" && call start.bat"
echo.
echo Done. In the BACKEND window you should see:  [OK ] Activity (Imp 9)
echo Then open http://localhost:5173 in your browser.
echo.
pause
