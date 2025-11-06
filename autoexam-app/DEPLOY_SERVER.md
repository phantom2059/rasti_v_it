# Инструкция по развертыванию на сервере spb-1 (46.16.12.107)

## Быстрый старт

### 1. Подключение к серверу
```bash
ssh root@46.16.12.107
# Пароль: 84EqEuj0hwQG
```

### 2. Переход в директорию проекта
```bash
cd /app/autoexam-app
# или
cd ~/autoexam-app
# или
cd /root/autoexam-app
```

### 3. Обновление кода из Git (если нужно)
```bash
git pull origin main
# или
git pull origin master
```

### 4. Остановка старых контейнеров
```bash
docker-compose -f docker-compose.gpu.yml down
# или если контейнер запущен напрямую:
docker stop rasti-ai-service
docker rm rasti-ai-service
```

### 5. Сборка и запуск нового контейнера
```bash
docker-compose -f docker-compose.gpu.yml up --build -d
```

### 6. Проверка статуса
```bash
docker-compose -f docker-compose.gpu.yml ps
docker-compose -f docker-compose.gpu.yml logs --tail=100
```

### 7. Проверка работы приложения
```bash
curl http://localhost:80/api/history
# или
curl http://46.16.12.107/api/history
```

## Альтернативный способ (использование скрипта)

Если на сервере есть файл `build_on_server.sh`:

```bash
chmod +x build_on_server.sh
./build_on_server.sh
```

## Полная команда одной строкой

```bash
cd /app/autoexam-app && git pull && docker-compose -f docker-compose.gpu.yml down && docker-compose -f docker-compose.gpu.yml up --build -d && docker-compose -f docker-compose.gpu.yml logs --tail=50
```

## Решение проблем

### Если контейнер не запускается:
```bash
# Проверка логов
docker-compose -f docker-compose.gpu.yml logs

# Проверка использования GPU
nvidia-smi

# Проверка Docker
docker ps -a
docker images
```

### Если нужно пересобрать образ с нуля:
```bash
docker-compose -f docker-compose.gpu.yml down
docker rmi autoexam-app:gpu
docker-compose -f docker-compose.gpu.yml up --build -d
```

### Если порт 80 занят:
Измените порт в `docker-compose.gpu.yml`:
```yaml
ports:
  - "8000:80"  # Вместо "80:80"
```

## Информация о сервере
- IP: 46.16.12.107
- Имя: spb-1
- Пользователь: root
- Пароль: 84EqEuj0hwQG
- Selectel Server ID: ce9a1ec9-c8c3-4879-8a49-8e920c561478

