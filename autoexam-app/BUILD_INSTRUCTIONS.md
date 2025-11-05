# 📋 Инструкция по сборке и развертыванию AutoExam

## 🔧 Требования к серверу

### Минимальные требования (CPU режим)

- **CPU**: 4+ ядра (рекомендуется 8+)
- **RAM**: 16 GB (рекомендуется 32 GB)
- **Диск**: 50 GB свободного места
- **ОС**: Linux (Ubuntu 20.04+ / Debian 11+), Windows Server 2019+, или macOS
- **Docker**: версия 20.10 или выше
- **Docker Compose**: версия 1.29 или выше

⚠️ **Внимание**: CPU режим работает очень медленно (обработка одного файла может занять часы). Рекомендуется использовать GPU.

### Рекомендуемые требования (GPU режим)

- **GPU**: NVIDIA с 12+ GB VRAM
  - ✅ **Рекомендуется**: NVIDIA T4 (16 GB) или лучше
  - ✅ **Минимум**: NVIDIA с 12 GB VRAM (RTX 3060, RTX 3060 Ti, RTX 3080, A4000, A5000 и т.д.)
  - ✅ **Облачные варианты**: Google Colab Pro, AWS EC2 g4dn.xlarge, Azure NC6s_v3
- **CPU**: 4+ ядра
- **RAM**: 16 GB (рекомендуется 32 GB)
- **Диск**: 50 GB свободного места (SSD рекомендуется)
- **CUDA**: версия 11.8 или выше
- **NVIDIA Docker**: nvidia-docker2 или nvidia-container-toolkit

### Проверка GPU

```bash
# Проверка наличия GPU
nvidia-smi

# Проверка CUDA
nvcc --version

# Проверка Docker с GPU поддержкой
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

## 📦 Подготовка сервера

### 1. Установка Docker и Docker Compose

#### Ubuntu/Debian:

```bash
# Обновление системы
sudo apt-get update
sudo apt-get upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка (опционально)
sudo reboot
```

### 2. Установка NVIDIA Docker (для GPU)

```bash
# Добавление репозитория NVIDIA
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# Установка nvidia-container-toolkit
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Перезапуск Docker
sudo systemctl restart docker

# Проверка
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

## 🚀 Сборка Docker образа

### Вариант 1: CPU версия (медленно, для тестирования)

```bash
cd autoexam-app
docker build -t autoexam-app:cpu .
```

### Вариант 2: GPU версия (рекомендуется)

```bash
cd autoexam-app
docker build -f Dockerfile.gpu -t autoexam-app:gpu .
```

**Время сборки:** Первая сборка может занять 30-60 минут (загрузка зависимостей и моделей).

## 🐳 Запуск контейнера

### CPU версия:

```bash
docker-compose up --build
```

### GPU версия:

```bash
# Используйте docker-compose.gpu.yml
docker-compose -f docker-compose.gpu.yml up --build
```

Или напрямую:

```bash
docker run -d \
  --name autoexam-app \
  --gpus all \
  -p 8000:8000 \
  -v $(pwd)/storage:/app/storage \
  -v $(pwd)/data:/app/data \
  autoexam-app:gpu
```

## 📊 Мониторинг производительности

### Проверка использования GPU:

```bash
# В отдельном терминале
watch -n 1 nvidia-smi
```

### Проверка логов контейнера:

```bash
docker logs -f autoexam-app
```

### Проверка использования ресурсов:

```bash
docker stats autoexam-app
```

## 🔍 Тестирование

1. **Откройте браузер:** http://localhost:8000
2. **Загрузите тестовый CSV файл**
3. **Проверьте логи** на наличие ошибок

## 📝 Структура проекта

```
autoexam-app/
├── Dockerfile              # CPU версия
├── Dockerfile.gpu          # GPU версия (с CUDA)
├── docker-compose.yml      # CPU конфигурация
├── docker-compose.gpu.yml  # GPU конфигурация
├── .dockerignore          # Исключения для сборки
├── server.py              # FastAPI сервер
├── inference.py           # ML инференс
├── models.py              # ML модели
├── qwen_sft_exam/         # LoRA адаптеры модели
└── storage/               # Загруженные файлы
```

## ⚙️ Настройка для разных GPU

### Если GPU меньше 12 GB:

Используйте более агрессивную квантование в `models.py` (уже настроено 4-bit).

### Если GPU больше 16 GB:

Можно использовать fp16 вместо 4-bit для лучшей точности (измените `models.py`).

## 🐛 Решение проблем

### Проблема: "CUDA out of memory"

- Уменьшите batch size в `inference.py`
- Используйте более агрессивную квантование (4-bit уже используется)
- Используйте GPU с большим объемом VRAM

### Проблема: "Docker: unknown flag --gpus"

- Установите nvidia-container-toolkit (см. выше)
- Перезапустите Docker: `sudo systemctl restart docker`

### Проблема: Модель не загружается

- Проверьте наличие директории `qwen_sft_exam` в проекте
- Проверьте логи: `docker logs autoexam-app`
- Убедитесь, что достаточно места на диске

### Проблема: Медленная обработка

- Используйте GPU вместо CPU
- Убедитесь, что GPU используется: `nvidia-smi` должен показывать нагрузку
- Проверьте, что CUDA версия совместима

## 📤 Развертывание на продакшн сервере

1. **Клонируйте репозиторий:**
   ```bash
   git clone <your-repo-url>
   cd autoexam-app
   ```

2. **Соберите образ:**
   ```bash
   docker build -f Dockerfile.gpu -t autoexam-app:gpu .
   ```

3. **Запустите через docker-compose:**
   ```bash
   docker-compose -f docker-compose.gpu.yml up -d
   ```

4. **Настройте reverse proxy (nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. **Настройте SSL (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Проверьте GPU: `nvidia-smi`
3. Проверьте использование ресурсов: `docker stats`

