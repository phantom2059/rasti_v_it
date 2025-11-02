# ⚡ Быстрый старт AutoExam

Краткое руководство для быстрого запуска сервиса.

## 🎯 Минимальные шаги для запуска

### 1. Установка зависимостей

**Python:**
```bash
# Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/macOS
# или venv\Scripts\activate  # Windows

# Установите PyTorch с CUDA
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# Установите остальные зависимости
pip install -r requirements.txt
```

**Node.js:**
```bash
npm install
```

### 2. Запуск сервиса

**Терминал 1 - Бэкенд:**
```bash
cd autoexam-app
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

**Терминал 2 - Фронтенд:**
```bash
cd autoexam-app
npm run dev
```

### 3. Доступ к сервису

- **Фронтенд:** http://localhost:5173
- **Бэкенд API:** http://localhost:8000
- **API документация:** http://localhost:8000/docs

## ✅ Готово!

Теперь вы можете загружать CSV файлы и обрабатывать их через веб-интерфейс.

Для подробной информации см. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

