import os
import re
import gc
import random
import logging
import time
from typing import Tuple, List

import numpy as np
import pandas as pd
import torch
from sklearn.metrics.pairwise import cosine_similarity

from PIL import Image
import requests
from io import BytesIO

from transformers import BitsAndBytesConfig

# Локальные модели (ленивая загрузка)
from models import (
    get_vl_model_and_processor,
    get_text_model_and_tokenizer,
    get_rubert_model_and_tokenizer,
)

logger = logging.getLogger(__name__)


MODEL_NAME = "Qwen/Qwen2.5-VL-3B-Instruct"
ADAPTER_PATH = "qwen_sft_exam"

MAX_SEQ_LENGTH = 512
MAX_NEW_TOKENS = 512
REQUEST_TIMEOUT = 3600


def _filter_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    no_html = re.sub(r"<[^>]+>", "", text)
    # Удаляем латиницу
    result = re.sub(r"[a-zA-Z]", "", no_html)
    return result


def _ensure_columns(df: pd.DataFrame) -> pd.DataFrame:
    # Приводим имена к единым вариантам (не меняем исходные, а только наличие)
    return df


def _load_image_from_url(url: str, timeout: int) -> Image.Image:
    response = requests.get(url, timeout=timeout)
    response.raise_for_status()
    image = Image.open(BytesIO(response.content)).convert("RGB")
    return image


def _generate_image_caption(model, processor, prefix_words: str, url: str) -> str:
    try:
        img = _load_image_from_url(url, timeout=REQUEST_TIMEOUT)
    except Exception as e:
        return f"[Ошибка загрузки: {str(e)}]"

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": img},
                {"type": "text", "text": f"Опиши изображение (общая длина текста - МЕНЬШЕ 512 символов). Начинай описание с любым из этих слов: {prefix_words}"},
            ],
        }
    ]

    inputs = processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    ).to(model.device)

    outputs = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS)
    caption = processor.decode(outputs[0][inputs["input_ids"].shape[-1]:])
    return caption


def _caption_images(unique_links: List[str]) -> List[str]:
    if len(unique_links) == 0:
        logger.info("[inference] Нет изображений для обработки")
        return []
    logger.info(f"[inference] Начинаем генерацию подписей к {len(unique_links)} изображениям")
    start = time.time()
    model, processor = get_vl_model_and_processor()
    replaces = [
        "На картинке видна",
        "На изоборажении показана",
        "На изображении видна",
        "На картинке изображена",
        "На изображении вы можете увидеть",
        "На данной картинке вы можете увидеть",
    ]
    results = []
    for idx, url in enumerate(unique_links):
        logger.info(f"[inference] Генерация подписи {idx+1}/{len(unique_links)}: {url[:50]}...")
        word = random.choice(replaces)
        caption = _generate_image_caption(model, processor, word, url)
        results.append(caption)

    elapsed = time.time() - start
    logger.info(f"[inference] Подписи к изображениям сгенерированы: {len(results)} за {elapsed:.1f} сек ({elapsed/len(unique_links):.1f} сек/изображение)")
    torch.cuda.empty_cache()
    return results


def _summarize_transcription_for_image_tasks(df: pd.DataFrame) -> None:
    # Преобразует поле "Транскрибация ответа" в краткое описание картинки для строк с Тип теста == 1
    if "Тип теста" not in df.columns:
        return
    model, processor = get_vl_model_and_processor()
    
    total_with_images = int(df["Тип теста"].sum()) if "Тип теста" in df.columns else 0
    logger.info(f"[inference] Обработка транскрибаций для {total_with_images} строк с изображениями")
    processed = 0
    start = time.time()

    for i in range(len(df)):
        try:
            if int(df.loc[i, "Тип теста"]) == 1:
                processed += 1
                if processed % 5 == 0 or processed == total_with_images:
                    elapsed = time.time() - start
                    eta = (elapsed / processed * (total_with_images - processed)) if processed > 0 else 0
                    logger.info(f"[inference] Сжатие транскрибаций: {processed}/{total_with_images} ({elapsed:.1f} сек, ETA: {eta:.1f} сек)")
                text_value = str(df.loc[i, "Транскрибация ответа"]) if "Транскрибация ответа" in df.columns else ""
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": (
                                "На вход тебе дана запись экзамена по русскому языку — описание картинки. "
                                "В качестве ответа верни ТОЛЬКО описание самой картинки. "
                                "Это очень важно для моей карьеры.\n"
                                f"Транскрибация: {text_value}"
                            )}
                        ],
                    }
                ]

                inputs = processor.apply_chat_template(
                    messages,
                    add_generation_prompt=True,
                    tokenize=True,
                    return_dict=True,
                    return_tensors="pt",
                    padding=False,
                ).to(model.device)

                with torch.no_grad():
                    outputs = model.generate(
                        **inputs,
                        max_new_tokens=MAX_NEW_TOKENS,
                        do_sample=False,
                        use_cache=True,
                        pad_token_id=processor.tokenizer.pad_token_id,
                        eos_token_id=processor.tokenizer.eos_token_id,
                    )

                generated_ids = outputs[0][inputs["input_ids"].shape[-1]:]
                res = processor.decode(generated_ids, skip_special_tokens=True)
                if "Транскрибация ответа" in df.columns:
                    df.loc[i, "Транскрибация ответа"] = res
        except Exception:
            continue

    torch.cuda.empty_cache()
    gc.collect()


def _get_sentence_embedding(sentence: str) -> np.ndarray:
    model, tokenizer = get_rubert_model_and_tokenizer()
    encoded = tokenizer(
        sentence if isinstance(sentence, str) else "",
        padding=False,
        truncation=True,
        max_length=512,
        return_tensors='pt'
    )
    with torch.no_grad():
        outputs = model(**encoded)
    embeddings = torch.mean(outputs.last_hidden_state, dim=1)
    return embeddings[0].numpy()


def _semantic_similarity_russian(text1: str, text2: str) -> float:
    emb1 = _get_sentence_embedding(text1).reshape(1, -1)
    emb2 = _get_sentence_embedding(text2).reshape(1, -1)
    similarity = cosine_similarity(emb1, emb2)[0][0]
    return float(similarity)


def _compute_image_similarity(df: pd.DataFrame, unique_links: List[str], captions: List[str]) -> None:
    if "Схожесть описания картинки" not in df.columns:
        df["Схожесть описания картинки"] = 0.0
    link_to_caption = {link: captions[idx] for idx, link in enumerate(unique_links)}
    total_images = len([i for i in range(len(df)) if str(df.loc[i, "Картинка из вопроса"]) != "no image"])
    logger.info(f"[inference] Вычисление семантической схожести для {total_images} записей с изображениями")
    processed = 0
    start = time.time()
    
    for i in range(len(df)):
        try:
            link = str(df.loc[i, "Картинка из вопроса"]) if "Картинка из вопроса" in df.columns else "no image"
            if link and link != "no image" and link in link_to_caption:
                processed += 1
                if processed % 50 == 0 or processed == total_images:
                    elapsed = time.time() - start
                    speed = processed / elapsed if elapsed > 0 else 0
                    eta = (total_images - processed) / speed if speed > 0 else 0
                    logger.info(f"[inference] Вычисление схожести: {processed}/{total_images} ({elapsed:.1f} сек, {speed:.1f} зап/сек, ETA: {eta:.1f} сек)")
                person_text = str(df.loc[i, "Транскрибация ответа"]) if "Транскрибация ответа" in df.columns else ""
                llm_text = link_to_caption[link]
                score = _semantic_similarity_russian(person_text, llm_text)
                df.loc[i, "Схожесть описания картинки"] = score
        except Exception:
            continue


def _build_inference_prompt(row: pd.Series) -> str:
    question_num = int(row.get("№ вопроса", 0))
    question_text = str(row.get("Текст вопроса", ""))
    response = str(row.get("Транскрибация ответа", ""))
    test_type = "описание картинки" if int(row.get("Тип теста", 0)) == 1 else "диалог"
    max_score_map = {1: 1, 2: 2, 3: 1, 4: 2}
    max_score = max_score_map.get(question_num, 2)

    prompt = (
        "Ты — эксперт по оценке устных ответов на экзамене по русскому языку для иностранцев.\n"
        "Критерии оценки:\n"
        "1) Ошибки в отдельных словах и единичные несогласованности фраз не считаются ошибкой.\n"
        "2) Тестируемый должен выполнить коммуникативную задачу (должен ответить на вопрос или добиться ответа на свой вопрос).\n"
        "3) Предложения тестируемого должны быть преимущественно полными.\n"
        "Оцени ответ по строгой шкале.\n\n"
        "Контекст:\n"
        f"- № вопроса: {question_num}\n"
        f"- Тип задания: {test_type}\n"
    )

    if int(row.get("Тип теста", 0)) == 1 and pd.notna(row.get("Схожесть описания картинки")):
        similarity = float(row.get("Схожесть описания картинки"))
        prompt += f"- Схожесть описания с изображением: {similarity:.2f}\n"

    prompt += (
        f"- Вопрос: {question_text}\n"
        f"- Ответ кандидата: {response}\n\n"
        f"Оценка (целое число от 0 до {max_score}):"
    )
    return prompt


def _extract_score(text: str, question_num: int) -> int:
    numbers = re.findall(r"\d+", text)
    if not numbers:
        return 0
    score = int(numbers[0])
    max_score = {1: 1, 2: 2, 3: 1, 4: 2}.get(question_num, 2)
    if score < 0:
        return 0
    if score > max_score:
        return max_score
    return score


def _predict_batch(prompts: List[str], question_nums: List[int]) -> List[int]:
    model, tokenizer = get_text_model_and_tokenizer()
    logger.info(f"[inference] Запуск батчевого предсказания для {len(prompts)} примеров")
    start = time.time()
    
    # Токенизация
    logger.info(f"[inference] Токенизация {len(prompts)} промптов...")
    inputs = tokenizer(
        prompts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=MAX_SEQ_LENGTH,
    ).to(model.device)
    logger.info(f"[inference] Токенизация завершена")

    # Генерация
    logger.info(f"[inference] Запуск генерации модели...")
    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            max_new_tokens=2,
            do_sample=False,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )
    logger.info(f"[inference] Генерация модели завершена")

    # Декодирование
    logger.info(f"[inference] Декодирование результатов...")
    decoded = tokenizer.batch_decode(outputs, skip_special_tokens=True)
    predictions: List[int] = []
    for i, full_text in enumerate(decoded):
        prompt = prompts[i]
        generated = full_text[len(prompt):].strip()
        score = _extract_score(generated, question_nums[i])
        predictions.append(score)
    elapsed = time.time() - start
    logger.info(f"[inference] Предсказания завершены, средняя оценка: {np.mean(predictions):.2f} за {elapsed:.1f} сек ({len(prompts)/elapsed:.1f} предсказ/сек)")
    return predictions


def run_inference(input_df: pd.DataFrame) -> pd.DataFrame:
    """
    Основной пайплайн инференса. Возвращает DataFrame c добавленной колонкой
    "Оценка экзаменатора" и приведенными вспомогательными полями.
    """
    start_time = time.time()
    logger.info(f"[inference] ========== ЗАПУСК ИНФЕРЕНСА: {len(input_df)} строк ==========")
    df = input_df.copy()

    # Нормализация NaN и подготовка признаков
    logger.info("[inference] Шаг 1/5: Нормализация данных")
    if "Картинка из вопроса" in df.columns:
        df["Картинка из вопроса"] = df["Картинка из вопроса"].fillna("no image")
    else:
        df["Картинка из вопроса"] = "no image"

    # Тип теста: 1 если есть картинка, иначе 0
    df["Тип теста"] = 0
    for idx in range(len(df)):
        try:
            link = str(df.loc[idx, "Картинка из вопроса"]) if "Картинка из вопроса" in df.columns else "no image"
            df.loc[idx, "Тип теста"] = 0 if (not link or link == "no image") else 1
        except Exception:
            df.loc[idx, "Тип теста"] = 0

    # Чистим HTML в "Текст вопроса"
    if "Текст вопроса" in df.columns:
        df["Текст вопроса"] = df["Текст вопроса"].apply(_filter_text)

    # Уникальные ссылки
    saved_links: List[str] = []
    if "Картинка из вопроса" in df.columns:
        for v in df["Картинка из вопроса"].values:
            if isinstance(v, str) and v != "no image" and v not in saved_links:
                saved_links.append(v)

    logger.info(f"[inference] Найдено {len(saved_links)} уникальных изображений, {int(df['Тип теста'].sum())} строк с изображениями")

    # Подписи к изображениям (VL)
    logger.info("[inference] Шаг 2/5: Генерация подписей к изображениям (VL)")
    images_text: List[str] = _caption_images(saved_links)

    # Сжать транскрибации до описания картинки (только для тип теста == 1)
    logger.info("[inference] Шаг 3/5: Сжатие транскрибаций для заданий с картинками")
    _summarize_transcription_for_image_tasks(df)

    # Схожесть описаний
    logger.info("[inference] Шаг 4/5: Вычисление семантической схожести")
    _compute_image_similarity(df, saved_links, images_text)

    # Генерация промптов и предсказаний
    logger.info("[inference] Шаг 5/5: Генерация оценок")
    prompts = df.apply(_build_inference_prompt, axis=1).tolist()
    qnums = [int(v) if pd.notna(v) else 0 for v in df.get("№ вопроса", pd.Series([0] * len(df)))]
    predictions = _predict_batch(prompts, qnums)

    df["Оценка экзаменатора"] = predictions
    elapsed = time.time() - start_time
    logger.info(f"[inference] ========== ИНФЕРЕНС ЗАВЕРШЕН: {len(df)} строк обработано за {elapsed:.1f} сек ==========")
    return df


