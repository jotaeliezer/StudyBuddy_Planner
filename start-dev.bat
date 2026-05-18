@echo off
title Bubu Study Planner - Dev Server
echo.
echo  =========================================
echo   Bubu Study Planner - Starting dev server
echo  =========================================
echo.

:: Check if node_modules exists; install if not
if not exist "node_modules\" (
    echo  [!] node_modules not found. Installing dependencies...
    echo.
    npm install
    echo.
)

echo  [*] Starting Vite dev server at http://localhost:3000
echo  [*] Press Ctrl+C to stop the server
echo.

:: Open the browser after a short delay (waits for Vite to start)
start /b cmd /c "timeout /t 2 >nul && start http://localhost:3000"

npm run dev

pause
