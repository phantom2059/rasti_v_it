# Многоэтапная сборка Docker образа для AutoExam

# Этап 1: Сборка фронтенда
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники фронтенда
COPY . .

# Собираем фронтенд
RUN npm run build

# Этап 2: Python окружение с ML моделями
FROM python:3.11-slim AS python-base

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем requirements.txt
COPY requirements.txt .

# Устанавливаем PyTorch с CPU поддержкой (для начала)
# Если нужна GPU поддержка, используйте другой базовый образ
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Устанавливаем остальные зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Этап 3: Финальный образ
FROM python:3.11-slim

WORKDIR /app

# Копируем Python зависимости из предыдущего этапа
COPY --from=python-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-base /usr/local/bin /usr/local/bin

# Копируем собранный фронтенд
COPY --from=frontend-builder /app/frontend/dist ./dist

# Копируем Python код
COPY server.py .
COPY inference.py .
COPY models.py .
COPY main.py .

# Копируем ML модели и адаптеры
COPY qwen_sft_exam ./qwen_sft_exam

# Копируем данные и изображения
COPY data ./data
COPY images ./images

# Создаем директории для хранения
RUN mkdir -p storage/uploads storage/results

# Устанавливаем переменные окружения
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Открываем порт
EXPOSE 8000

# Команда запуска
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]

