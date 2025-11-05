@echo off
REM Скрипт для сборки Docker образа AutoExam (Windows)

echo Сборка Docker образа AutoExam с GPU поддержкой...

REM Проверка наличия Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo Ошибка: Docker не установлен. Установите Docker и повторите попытку.
    exit /b 1
)

REM Сборка образа
echo Сборка образа...
docker build -f Dockerfile.gpu -t autoexam-app:latest .

if errorlevel 1 (
    echo Ошибка при сборке образа!
    exit /b 1
)

echo Сборка завершена успешно!
echo.
echo Для запуска контейнера используйте:
echo   docker-compose up -d
echo.
echo Или напрямую:
echo   docker run -d --name autoexam-app --gpus all -p 8000:8000 -v %cd%/storage:/app/storage -v %cd%/data:/app/data autoexam-app:latest

