#!/bin/bash
# Скрипт для сборки Docker контейнера на сервере

set -e  # Остановка при ошибке

echo "=== Начало сборки AutoExam Docker контейнера ==="

# Переходим в директорию проекта
cd /app/autoexam-app || cd ~/autoexam-app || cd /root/autoexam-app || {
    echo "Ошибка: не найдена директория проекта"
    exit 1
}

echo "Текущая директория: $(pwd)"

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "Ошибка: Docker не установлен"
    exit 1
fi

echo "Docker версия: $(docker --version)"

# Проверяем наличие docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "Ошибка: docker-compose не установлен"
    exit 1
fi

echo "Docker Compose версия: $(docker-compose --version)"

# Останавливаем и удаляем старые контейнеры (если есть)
echo "=== Остановка старых контейнеров ==="
docker-compose -f docker-compose.gpu.yml down 2>/dev/null || true
docker stop autoexam-app 2>/dev/null || true
docker rm autoexam-app 2>/dev/null || true

# Удаляем старый образ (опционально, для чистой сборки)
# docker rmi autoexam-app:gpu 2>/dev/null || true

# Собираем новый образ
echo "=== Сборка Docker образа ==="
docker build -f Dockerfile.gpu -t autoexam-app:gpu .

if [ $? -eq 0 ]; then
    echo "=== Сборка успешно завершена ==="
    
    # Запускаем контейнер через docker-compose
    echo "=== Запуск контейнера ==="
    docker-compose -f docker-compose.gpu.yml up -d
    
    if [ $? -eq 0 ]; then
        echo "=== Контейнер успешно запущен ==="
        echo "Проверка статуса:"
        docker-compose -f docker-compose.gpu.yml ps
        
        echo ""
        echo "Логи контейнера (последние 50 строк):"
        docker-compose -f docker-compose.gpu.yml logs --tail=50
        
        echo ""
        echo "=== Готово! ==="
        echo "Приложение должно быть доступно на порту 80"
    else
        echo "Ошибка при запуске контейнера"
        exit 1
    fi
else
    echo "Ошибка при сборке образа"
    exit 1
fi

