# Проект "Расти в IT"

Этот проект состоит из двух основных частей:
1.  Модель машинного обучения для транскрибации аудио (на базе Whisper).
2.  Веб-приложение для взаимодействия с моделью.

## Быстрый старт

### Веб-приложение (React)

Веб-приложение находится в директории `autoexam-app`.

1.  **Перейдите в директорию приложения:**
    ```bash
    cd autoexam-app
    ```

2.  **Установите зависимости:**
    ```bash
    npm install
    ```

3.  **Запустите приложение в режиме разработки:**
    ```bash
    npm run dev
    ```
    После этого приложение будет доступно по адресу `http://localhost:5173` (или другому порту, указанному в выводе команды).

### Модель машинного обучения (Jupyter Notebook)

Ноутбуки с экспериментами и инференсом модели находятся в корневой директории (`Whisper_inference.ipynb`, `transcription_dataset.ipynb`).

1.  **Создайте и активируйте виртуальное окружение:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # Для Linux/macOS
    # или
    .venv\Scripts\activate    # Для Windows
    ```

2.  **Установите зависимости:**
    На данный момент файла `requirements.txt` нет. Вам нужно будет установить зависимости, используемые в Jupyter ноутбуках. Основные из них:
    - `jupyter`
    - `torch`
    - `torchaudio`
    - `transformers`
    - `datasets`
    - `pandas`
    - `librosa`
    
    Вы можете установить их с помощью pip:
    ```bash
    pip install jupyter torch torchaudio transformers datasets pandas librosa
    ```
    *Примечание: Установка `torch` может отличаться в зависимости от вашей системы и наличия CUDA. Пожалуйста, обратитесь к [официальной документации PyTorch](https://pytorch.org/) для получения инструкций по установке.*

3.  **Запустите Jupyter Lab или Jupyter Notebook:**
    ```bash
    jupyter lab
    # или
    jupyter notebook
    ```
    После этого откройте нужный `.ipynb` файл и запускайте ячейки.
