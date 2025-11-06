#!/bin/bash
# Скрипт для сборки Docker образа AutoExam

set -e

echo "Начинаем сборку Docker образа AutoExam с GPU поддержкой..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "Docker не установлен. Установите Docker и повторите попытку."
    exit 1
fi

# Проверка наличия nvidia-docker (для GPU)
if ! docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi &> /dev/null; then
    echo "Внимание: GPU поддержка не обнаружена. Образ будет собран, но GPU работать не будет."
    echo "   Установите nvidia-container-toolkit для GPU поддержки."
fi

# Сборка образа
echo "Сборка образа..."
docker build -f Dockerfile.gpu -t autoexam-app:latest .

echo "Сборка завершена успешно!"
echo ""
echo "Для запуска контейнера используйте:"
echo "  docker-compose up -d"
echo ""
echo "Или напрямую:"
echo "  docker run -d --name autoexam-app --gpus all -p 8000:8000 -v \$(pwd)/storage:/app/storage -v \$(pwd)/data:/app/data autoexam-app:latest"

