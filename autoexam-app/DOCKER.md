# Инструкция по сборке и запуску Docker образа

## Docker развертывание AutoExam

### Требования

- Docker (версия 20.10 или выше)
- Docker Compose (версия 1.29 или выше)

### Быстрый старт

#### Вариант 1: Использование Docker Compose (рекомендуется)

1. **Перейдите в директорию проекта:**
   ```bash
   cd autoexam-app
   ```

2. **Соберите и запустите контейнер:**
   ```bash
   docker-compose up --build
   ```

3. **Для запуска в фоновом режиме:**
   ```bash
   docker-compose up -d --build
   ```

4. **Приложение будет доступно по адресу:**
   - http://localhost:8000

#### Вариант 2: Использование Docker напрямую

1. **Соберите образ:**
   ```bash
   cd autoexam-app
   docker build -t autoexam-app .
   ```

2. **Запустите контейнер:**
   ```bash
   docker run -d \
     --name autoexam-app \
     -p 8000:8000 \
     -v $(pwd)/storage:/app/storage \
     -v $(pwd)/data:/app/data \
     autoexam-app
   ```

### Управление контейнером

#### Просмотр логов:
```bash
docker-compose logs -f
# или
docker logs -f autoexam-app
```

#### Остановка:
```bash
docker-compose down
# или
docker stop autoexam-app
```

#### Перезапуск:
```bash
docker-compose restart
# или
docker restart autoexam-app
```

#### Удаление:
```bash
docker-compose down -v
# или
docker rm -f autoexam-app
```

### Загрузка образа на Docker Hub

1. **Создайте аккаунт на Docker Hub** (если еще нет): https://hub.docker.com

2. **Войдите в Docker Hub:**
   ```bash
   docker login
   ```

3. **Соберите образ с тегом:**
   ```bash
   docker build -t ваш-username/autoexam-app:latest .
   ```

4. **Загрузите образ:**
   ```bash
   docker push ваш-username/autoexam-app:latest
   ```

5. **Запуск образа на другом сервере:**
   ```bash
   docker pull ваш-username/autoexam-app:latest
   docker run -d -p 8000:8000 ваш-username/autoexam-app:latest
   ```

### Загрузка на GitHub

1. **Создайте GitHub репозиторий** (если еще нет)

2. **Добавьте файлы в Git:**
   ```bash
   git add Dockerfile docker-compose.yml .dockerignore
   git commit -m "Add Docker configuration"
   git push origin main
   ```

3. **Для автоматической сборки образа при коммите**, используйте GitHub Actions (создайте `.github/workflows/docker.yml`)

### Структура проекта

```
autoexam-app/
├── Dockerfile              # Конфигурация Docker образа
├── docker-compose.yml      # Docker Compose конфигурация
├── .dockerignore          # Исключения для Docker
├── server.py              # FastAPI сервер
├── inference.py           # ML инференс
├── models.py              # ML модели
├── dist/                  # Собранный фронтенд (создается при сборке)
├── storage/               # Загруженные файлы и результаты
└── data/                  # Данные приложения
```

### Решение проблем

#### Проблема: Образ слишком большой
- Используйте `.dockerignore` для исключения ненужных файлов
- Используйте multi-stage сборку (уже реализовано)

#### Проблема: Модели не загружаются
- Убедитесь, что директория `qwen_sft_exam` скопирована в образ
- Проверьте пути в коде

#### Проблема: Порт занят
- Измените порт в `docker-compose.yml`: `"8001:8000"`
- Или остановите процесс, использующий порт 8000

#### Проблема: Нет GPU поддержки
- Для GPU поддержки измените базовый образ в Dockerfile на `nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04`
- Установите PyTorch с CUDA: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118`

### Переменные окружения

Вы можете настроить поведение через переменные окружения в `docker-compose.yml`:

```yaml
environment:
  - PORT=8000
  - PYTHONUNBUFFERED=1
```

### Volumes

Данные сохраняются в смонтированных volumes:
- `./storage` - загруженные файлы и результаты
- `./data` - данные приложения (история и т.д.)

### Health Check

Контейнер проверяет здоровье через `/api/history` endpoint каждые 30 секунд.

### Производственное развертывание

Для продакшена рекомендуется:
1. Использовать reverse proxy (nginx, traefik)
2. Настроить SSL/TLS
3. Использовать секреты для чувствительных данных
4. Настроить мониторинг и логирование
5. Использовать GPU если доступно

### Поддержка

При возникновении проблем проверьте логи:
```bash
docker-compose logs
```

