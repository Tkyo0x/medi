@echo off
echo.
echo   MEDICORE - Iniciando...
echo.
call npm install
echo.
echo   Abriendo http://localhost:3000 ...
echo.
start http://localhost:3000
call npm run dev
