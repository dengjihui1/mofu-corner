@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo PaperPal requires Node.js 22.12 or newer.
  echo Download Node.js from https://nodejs.org and try again.
  pause
  exit /b 1
)
node "%~dp0setup.mjs" %*
if errorlevel 1 (
  echo.
  echo Startup did not finish. Please read the message above.
  pause
  exit /b 1
)
exit /b 0
