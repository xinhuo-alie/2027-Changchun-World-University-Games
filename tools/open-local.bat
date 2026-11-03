@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\codex_workspace\tools\start-local.ps1"
if errorlevel 1 (
  echo.
  echo Failed to start the project. See the message above.
  pause
)
