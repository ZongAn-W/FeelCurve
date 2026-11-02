@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\update.ps1" %*
set "feelcurve_exit=%ERRORLEVEL%"
echo.
pause
exit /b %feelcurve_exit%
