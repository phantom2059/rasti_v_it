# 🐳 Docker инструкция для AutoExam

## Быстрый старт

### 1. Сборка и запуск через Docker Compose

```bash
cd autoexam-app
docker-compose up --build
```

Приложение будет доступно на http://localhost:8000

### 2. Запуск в фоновом режиме

```bash
docker-compose up -d --build
```

### 3. Просмотр логов

```bash
docker-compose logs -f
```

### 4. Остановка

```bash
docker-compose down
```

## Загрузка на GitHub

```bash
git add Dockerfile docker-compose.yml .dockerignore DOCKER.md
git commit -m "Add Docker configuration"
git push
```

## Загрузка образа на Docker Hub

1. Войдите в Docker Hub:
```bash
docker login
```

2. Соберите и загрузите образ:
```bash
cd autoexam-app
docker build -t ваш-username/autoexam-app:latest .
docker push ваш-username/autoexam-app:latest
```

3. На другом сервере:
```bash
docker pull ваш-username/autoexam-app:latest
docker run -d -p 8000:8000 ваш-username/autoexam-app:latest
```

## Что было создано

- ✅ `Dockerfile` - конфигурация Docker образа
- ✅ `docker-compose.yml` - удобный запуск контейнера
- ✅ `.dockerignore` - исключения для сборки
- ✅ Обновлен `server.py` для раздачи статики фронтенда

## Важные замечания

1. **Первая сборка может занять много времени** (скачивание зависимостей и моделей)
2. **Образ будет довольно большим** (из-за ML моделей и зависимостей)
3. **Для GPU** - измените базовый образ в Dockerfile на NVIDIA CUDA образ

Подробная инструкция в файле `DOCKER.md`

