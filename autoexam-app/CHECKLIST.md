# ✅ Проверка готовности к сборке Docker образа

## Файлы для сборки

### ✅ Обязательные файлы:
- [x] `Dockerfile.gpu` - конфигурация GPU образа
- [x] `docker-compose.yml` - конфигурация по умолчанию (GPU)
- [x] `requirements.txt` - Python зависимости
- [x] `package.json` - Node.js зависимости
- [x] `server.py` - FastAPI сервер
- [x] `inference.py` - ML инференс
- [x] `models.py` - ML модели
- [x] `main.py` - дополнительный код
- [x] `qwen_sft_exam/` - LoRA адаптеры модели
- [x] `src/` - исходники фронтенда
- [x] `index.html` - HTML шаблон
- [x] `vite.config.js` - конфигурация Vite
- [x] `tailwind.config.js` - конфигурация Tailwind
- [x] `postcss.config.js` - конфигурация PostCSS
- [x] `images/` - изображения
- [x] `data/` - данные приложения

### ✅ Скрипты сборки:
- [x] `build.sh` - скрипт сборки для Linux/Mac
- [x] `build.bat` - скрипт сборки для Windows

### ✅ Документация:
- [x] `QUICKSTART.md` - быстрый старт
- [x] `BUILD_INSTRUCTIONS.md` - подробная инструкция
- [x] `DOCKER.md` - документация по Docker

## Проверка перед сборкой

### 1. Проверка наличия GPU:
```bash
nvidia-smi
```

### 2. Проверка Docker с GPU:
```bash
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### 3. Проверка файлов:
```bash
ls -la autoexam-app/
```

## Сборка

### Вариант 1: Docker Compose (рекомендуется)
```bash
cd autoexam-app
docker-compose up --build
```

### Вариант 2: Скрипт сборки
```bash
# Linux/Mac
chmod +x build.sh
./build.sh

# Windows
build.bat
```

### Вариант 3: Прямая сборка
```bash
cd autoexam-app
docker build -f Dockerfile.gpu -t autoexam-app:latest .
```

## Запуск

```bash
docker-compose up -d
```

## Проверка работы

```bash
# Логи
docker-compose logs -f

# Использование GPU
watch -n 1 nvidia-smi

# Статус
docker-compose ps
```

## Требования

- ✅ GPU: NVIDIA с 12+ GB VRAM (рекомендуется T4)
- ✅ Docker с nvidia-container-toolkit
- ✅ CUDA 11.8+
- ✅ 50 GB свободного места на диске

## Примечания

- Первая сборка займет 30-60 минут
- Все настроено на GPU по умолчанию
- `docker-compose.yml` использует `Dockerfile.gpu` автоматически

