import os
import io
import json
import uuid
import threading
import logging
from datetime import datetime
from typing import Dict, Any

import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response
from pydantic import BaseModel
from fastapi.responses import FileResponse

# Локальные модули инференса
from inference import run_inference

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


API_PREFIX = "/api"
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(ROOT_DIR, "storage")
UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")
RESULTS_DIR = os.path.join(STORAGE_DIR, "results")
DATA_DIR = os.path.join(ROOT_DIR, "data")
HISTORY_PATH = os.path.join(DATA_DIR, "history.json")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


class UploadResponse(BaseModel):
    success: bool
    id: str
    message: str


class ResultResponse(BaseModel):
    id: str
    filename: str
    status: str
    totalRecords: int | None = None
    averageScore: float | None = None
    distribution: Dict[str, int] | None = None
    records: list | None = None


class JobState(BaseModel):
    id: str
    filename: str
    status: str  # queued | processing | completed | failed
    error: str | None = None
    result_path: str | None = None
    csv_path: str | None = None


class JobStore:
    def __init__(self):
        self._jobs: Dict[str, JobState] = {}
        self._lock = threading.Lock()

    def create(self, filename: str) -> JobState:
        job_id = f"result-{uuid.uuid4().hex[:12]}"
        job = JobState(id=job_id, filename=filename, status="queued")
        with self._lock:
            self._jobs[job_id] = job
        return job

    def update(self, job_id: str, **kwargs):
        with self._lock:
            if job_id not in self._jobs:
                return
            job = self._jobs[job_id]
            for k, v in kwargs.items():
                setattr(job, k, v)
            self._jobs[job_id] = job

    def get(self, job_id: str) -> JobState | None:
        with self._lock:
            return self._jobs.get(job_id)


jobs = JobStore()


def _detect_delimiter(sample: str) -> str:
    # Простой детектор: если присутствует ';' в заголовке — используем его, иначе ','
    return ';' if ';' in sample.splitlines()[0] else ','


def _load_history() -> Dict[str, Any]:
    if not os.path.exists(HISTORY_PATH):
        return {"history": []}
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"history": []}


def _save_history(history: Dict[str, Any]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def _summarize_results(df: pd.DataFrame) -> Dict[str, Any]:
    # Ожидаемые колонки входа: Id экзамена / ID экзамена, Id вопроса / ID вопроса, Транскрибация ответа, Оценка экзаменатора
    def _find_col(cands: list[str]) -> str | None:
        cols_lower = {c.lower(): c for c in df.columns}
        for c in cands:
            if c.lower() in cols_lower:
                return cols_lower[c.lower()]
        return None

    exam_col = _find_col(["Id экзамена", "ID экзамена"])
    q_col = _find_col(["Id вопроса", "ID вопроса"])
    trans_col = _find_col(["Транскрибация ответа"])
    score_col = _find_col(["Оценка экзаменатора"])  # обязательно после инференса

    if not all([exam_col, q_col, score_col]):
        raise ValueError("Не найдены необходимые колонки для сборки ответа")

    total = int(len(df))
    avg = float(df[score_col].astype(float).mean()) if total > 0 else 0.0
    # Для совместимости с UI отдаем только score1 и score2
    distr = {
        "score1": int((df[score_col] == 1).sum()),
        "score2": int((df[score_col] == 2).sum()),
    }

    records = []
    for _, row in df.iterrows():
        records.append({
            "examId": str(row[exam_col]),
            "questionId": str(row[q_col]),
            "score": int(row[score_col]),
            "transcription": str(row[trans_col]) if trans_col and pd.notna(row.get(trans_col)) else ""
        })

    return {
        "totalRecords": total,
        "averageScore": avg,
        "distribution": distr,
        "records": records,
    }


def _background_process(job_id: str, upload_path: str, filename: str) -> None:
    try:
        logger.info(f"[server] Начало обработки задачи {job_id}: {filename}")
        jobs.update(job_id, status="processing")

        # Читаем CSV с авто-детектом разделителя
        logger.info(f"[server] Чтение CSV {filename}")
        with open(upload_path, "r", encoding="utf-8", errors="ignore") as f:
            sample = f.read(2048)
        sep = _detect_delimiter(sample) if sample else ';'
        logger.info(f"[server] Разделитель CSV: '{sep}'")

        df = pd.read_csv(upload_path, sep=sep)
        logger.info(f"[server] Загружено {len(df)} строк из CSV")

        # Запускаем инференс
        logger.info(f"[server] Запуск ML-инференса")
        result_df = run_inference(df)
        logger.info(f"[server] Инференс завершен")

        # Сводка + упаковка результата для API
        logger.info(f"[server] Формирование результатов")
        summary = _summarize_results(result_df)
        result_payload = {
            "id": job_id,
            "filename": filename,
            "status": "completed",
            **summary,
        }
        logger.info(f"[server] Средняя оценка: {summary['averageScore']:.2f}, всего записей: {summary['totalRecords']}")

        # Сохраняем результат (JSON)
        result_path = os.path.join(RESULTS_DIR, f"{job_id}.json")
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(result_payload, f, ensure_ascii=False, indent=2)
        logger.info(f"[server] JSON сохранен: {result_path}")

        # Дополнительно сохраняем CSV для скачивания
        csv_path = os.path.join(RESULTS_DIR, f"{job_id}.csv")
        try:
            # На всякий случай собираем CSV с минимально необходимыми колонками
            df_csv = result_df.copy()
            # Определяем реальные названия ID колонок
            def _find_col(cands: list[str]) -> str | None:
                cols_lower = {c.lower(): c for c in df_csv.columns}
                for c in cands:
                    if c.lower() in cols_lower:
                        return cols_lower[c.lower()]
                return None
            exam_col = _find_col(["Id экзамена", "ID экзамена"])
            q_col = _find_col(["Id вопроса", "ID вопроса"])
            score_col = _find_col(["Оценка экзаменатора"])  
            export_cols = [exam_col, q_col, score_col]
            export_cols_names = ["ID экзамена", "ID вопроса", "Оценка экзаменатора"]
            export_df = df_csv[export_cols]
            export_df.columns = export_cols_names
            export_df.to_csv(csv_path, index=False, sep=';', encoding='utf-8')
        except Exception:
            csv_path = None

        # Обновляем историю
        history = _load_history()
        history_entry = {
            "id": job_id,
            "userId": 0,
            "filename": filename,
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "status": "completed",
            "totalRecords": result_payload["totalRecords"],
            "averageScore": result_payload["averageScore"],
            "resultsUrl": f"/results/{job_id}",
        }
        history.setdefault("history", []).insert(0, history_entry)
        _save_history(history)

        jobs.update(job_id, status="completed", result_path=result_path, csv_path=csv_path)
        logger.info(f"[server] Задача {job_id} выполнена успешно")
    except Exception as e:
        logger.error(f"[server] Ошибка в задаче {job_id}: {e}")
        jobs.update(job_id, status="failed", error=str(e))


app = FastAPI(title="AutoExam API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post(f"{API_PREFIX}/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Поддерживается только формат CSV")

    job = jobs.create(filename=file.filename)
    upload_path = os.path.join(UPLOADS_DIR, f"{job.id}.csv")

    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)

    # Старт фоновой обработки
    if background_tasks is None:
        raise HTTPException(status_code=500, detail="Background tasks недоступны")
    background_tasks.add_task(_background_process, job.id, upload_path, file.filename)

    return UploadResponse(success=True, id=job.id, message="Файл принят, обработка запущена")


@app.options(f"{API_PREFIX}/upload")
def upload_options():
    # Явный ответ на preflight-запрос
    return Response(status_code=204)


@app.get(f"{API_PREFIX}/results/{{result_id}}", response_model=ResultResponse)
def get_results(result_id: str):
    logger.info(f"[server] GET /api/results/{result_id} - запрос статуса")
    job = jobs.get(result_id)
    if job is None:
        logger.warning(f"[server] Результат {result_id} не найден")
        raise HTTPException(status_code=404, detail="Результат не найден")

    logger.info(f"[server] Статус задачи {result_id}: {job.status}")

    if job.status in ("queued", "processing"):
        return ResultResponse(id=job.id, filename=job.filename, status=job.status, totalRecords=None,
                              averageScore=None, distribution=None, records=None)

    if job.status == "failed":
        logger.error(f"[server] Задача {result_id} завершилась с ошибкой: {job.error}")
        raise HTTPException(status_code=500, detail=f"Обработка завершилась с ошибкой: {job.error}")

    # completed
    assert job.result_path and os.path.exists(job.result_path)
    logger.info(f"[server] Задача {result_id} завершена, возвращаем результаты")
    with open(job.result_path, "r", encoding="utf-8") as f:
        payload = json.load(f)
    # Добавим ссылку на скачивание если CSV есть
    if job.csv_path and os.path.exists(job.csv_path):
        payload["downloadUrl"] = f"/api/results/{result_id}/download"
    return ResultResponse(**payload)


@app.get(f"{API_PREFIX}/history")
def get_history():
    return _load_history()


@app.get(f"{API_PREFIX}/results/{{result_id}}/download")
def download_result(result_id: str):
    logger.info(f"[server] GET /api/results/{result_id}/download - запрос на скачивание")
    job = jobs.get(result_id)
    if job is None:
        logger.warning(f"[server] Результат {result_id} не найден для скачивания")
        raise HTTPException(status_code=404, detail="Результат не найден")
    
    logger.info(f"[server] Статус задачи {result_id} для скачивания: {job.status}, csv_path: {job.csv_path}")
    
    if job.status != "completed":
        logger.warning(f"[server] Задача {result_id} не завершена (статус: {job.status})")
        raise HTTPException(status_code=404, detail=f"CSV не готов, статус: {job.status}")
    
    if not job.csv_path:
        logger.error(f"[server] CSV путь не указан для задачи {result_id}")
        raise HTTPException(status_code=404, detail="CSV путь не указан")
    
    if not os.path.exists(job.csv_path):
        logger.error(f"[server] CSV файл не существует: {job.csv_path}")
        raise HTTPException(status_code=404, detail="CSV файл не найден на сервере")
    
    logger.info(f"[server] Возвращаем CSV файл: {job.csv_path}")
    return FileResponse(
        job.csv_path, 
        media_type='text/csv', 
        filename=f"{result_id}.csv",
        headers={"Content-Disposition": f"attachment; filename={result_id}.csv"}
    )


# Для локального запуска из директории autoexam-app:
# uvicorn server:app --host 0.0.0.0 --port 8000


