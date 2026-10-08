@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again. & pause & exit /b)
if not exist node_modules (
  echo Installing packages, this takes a few minutes the first time...
  call npm install || (pause & exit /b)
)
echo.
echo Starting Ridgeline at http://localhost:3000   (staff dashboard: /admin, password: admin)
echo Keep this window open. Close it to stop the site.
start "" http://localhost:3000
call npm run dev
