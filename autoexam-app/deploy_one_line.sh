#!/bin/bash
# Полная команда для выполнения на сервере одной строкой
# Скопируйте и выполните на сервере:

cd /app/autoexam-app 2>/dev/null || cd ~/autoexam-app 2>/dev/null || cd /root/autoexam-app 2>/dev/null && \
git pull 2>/dev/null || echo "Git pull пропущен" && \
docker-compose -f docker-compose.gpu.yml down 2>/dev/null && \
echo "=== Начало сборки ===" && \
docker build -f Dockerfile.gpu -t autoexam-app:gpu . && \
echo "=== Запуск контейнера ===" && \
docker-compose -f docker-compose.gpu.yml up -d && \
echo "=== Статус контейнера ===" && \
docker-compose -f docker-compose.gpu.yml ps && \
echo "=== Последние логи ===" && \
docker-compose -f docker-compose.gpu.yml logs --tail=50

