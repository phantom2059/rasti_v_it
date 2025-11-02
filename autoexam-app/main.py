import os
import re
import pandas as pd
import warnings
import numpy as np
from tqdm import tqdm
import time
import random
import gc

import torch
from transformers import (
    AutoTokenizer,
    BitsAndBytesConfig,
    Qwen2_5_VLForConditionalGeneration,
    AutoModel,
    AutoProcessor
)
from peft import PeftModel
from sklearn.metrics.pairwise import cosine_similarity

import requests
from PIL import Image
from io import BytesIO
warnings.filterwarnings("ignore")

#ОБЯЗАТЕЛЬНО: !pip install --upgrade transformers accelerate torch torchvision tokenizers qwen-vl-utils 
#ИЛИ: !pip install --upgrade -r requirements.txt

MODEL_NAME = "Qwen/Qwen2.5-VL-3B-Instruct"
ADAPTER_PATH = "qwen_sft_exam"

#Параметры для инференса (текст)
TEST_CSV = "test.csv"
OUTPUT_CSV = "predictions.csv"
MAX_SEQ_LENGTH = 1024
BATCH_SIZE = 1

#Параметры для разметки картинок
MAX_NEW_TOKENS = 512
REQUEST_TIMEOUT = 50

print("Загрузка тестового датасета...")
df = pd.read_csv(TEST_CSV, sep=",")

def get_links():
  df[["Картинка из вопроса"]] = df[["Картинка из вопроса"]].fillna("no image")
  saved_links = []
  for image in tqdm(df[["Картинка из вопроса"]].values):
      if image != "no image" and image not in saved_links:
          saved_links.append(image)

  for lnk in range(len(saved_links)):
    saved_links[lnk] = saved_links[lnk][0]

  return saved_links

def load_vl_model():
    processor = AutoProcessor.from_pretrained(
        MODEL_NAME,
        use_fast=False,
        trust_remote_code=True
    )

    print("Загрузка модели в 4-bit с оптимизациями...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        dtype=torch.float16,
        low_cpu_mem_usage=True
    )

    model.eval()
    for param in model.parameters():
        param.requires_grad = False

    return model, processor

def load_image_from_url(url: str, timeout: int):
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert("RGB")
        return image
    except Exception as e:
        raise RuntimeError(f"Ошибка загрузки изображения {url}: {e}")

def generate_image_caption(model, processor, words, url: str):
  try:
      img = load_image_from_url(url, timeout=REQUEST_TIMEOUT)
  except Exception as e:
      return f"[Ошибка загрузки: {str(e)}]"

  messages = [
      {
          "role": "user",
          "content": [
              {"type": "image", "image": img},
              {"type": "text", "text": f"Опиши изображение (общая длина текста - МЕНЬШЕ 512 символов). Начинай описание с любым из этих слов: {words}"}
          ]
      },
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

def name_images():
  model, processor = load_vl_model()
  saved_links = get_links()
  replaces = ["На картинке видна", "На изоборажении показана", "На изображении видна", "На картинке изображена", "На изображении вы можете увидеть", "На данной картинке вы можете увидеть"]

  print(f"Запуск инференса для {len(saved_links)} URL-изображений")

  results = []
  for i, url in enumerate(saved_links):
      print(f"Обработка {i+1}/{len(saved_links)}: {url}")
      word = replaces[random.randint(0, (len(replaces)-1))]
      caption = generate_image_caption(model, processor, word, url)
      results.append(caption)
  
  torch.cuda.empty_cache()
  return results

def get_user_img_answer():
    model, processor = load_vl_model()

    for exam_answer in tqdm(range(df.shape[0])):
        if df.iloc[exam_answer, 7] == 1:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "На вход тебе дана запись экзамена по русскому языку — описание картинки. "
                                "В качестве ответа верни ТОЛЬКО описание самой картинки. "
                                "Это очень важно для моей карьеры.\n"
                                f"Транскрибация: {df.iloc[exam_answer, 5]}"
                            )
                        }
                    ]
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

            df.iloc[exam_answer, 5] = res

            if exam_answer % 10 == 0:
                torch.cuda.empty_cache()
                gc.collect()

    del model, processor
    torch.cuda.empty_cache()
    gc.collect()

def load_rubert():
  tokenizer = AutoTokenizer.from_pretrained("cointegrated/rubert-tiny2", trust_remote_code=True, use_fast=False)
  model = AutoModel.from_pretrained("cointegrated/rubert-tiny2", trust_remote_code=True)
  return model, tokenizer

def get_sentence_embedding(sentence: str) -> np.ndarray:
  model, tokenizer = load_rubert()
  encoded = tokenizer(
      sentence,
      padding=False,
      truncation=True,
      max_length=512,
      return_tensors='pt'
  )
  with torch.no_grad():
      outputs = model(**encoded)

  embeddings = torch.mean(outputs.last_hidden_state, dim=1)
  return embeddings[0].numpy()

def semantic_similarity_russian(text1: str, text2: str) -> float:
  emb1 = get_sentence_embedding(text1).reshape(1, -1)
  emb2 = get_sentence_embedding(text2).reshape(1, -1)
  similarity = cosine_similarity(emb1, emb2)[0][0]
  return float(similarity)

def get_similarity_feature(saved_links, all_texts):
  for i in tqdm(range(df.shape[0])):
    if df["Картинка из вопроса"].loc[i] != "no image":
      link = df["Картинка из вопроса"].loc[i]
      llm_text = all_texts[saved_links.index(link)]
      person_text = df["Транскрибация ответа"].loc[i]

      score = semantic_similarity_russian(person_text, llm_text)
      df["Схожесть описания картинки"].loc[i] = score

def build_inference_prompt(row):
    question_num = row["№ вопроса"]
    question_text = row["Текст вопроса"]
    response = row["Транскрибация ответа"]
    test_type = "описание картинки" if row["Тип теста"] == 1 else "диалог"
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

    if row["Тип теста"] == 1 and pd.notna(row["Схожесть описания картинки"]):
        similarity = float(row["Схожесть описания картинки"])
        prompt += f"- Схожесть описания с изображением: {similarity:.2f}\n"

    prompt += (
        f"- Вопрос: {question_text}\n"
        f"- Ответ кандидата: {response}\n\n"
        f"Оценка (целое число от 0 до {max_score}):"
    )
    return prompt

def load_model_and_tokenizer():
    print("Загрузка токенизатора...")
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME,
        trust_remote_code=True,
        padding_side="left"
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print("Загрузка базовой модели в 4-bit...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
    )

    base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        dtype=torch.float16,
    )

    print("Применение LoRA адаптера...")
    model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
    model.eval()
    return model, tokenizer

def extract_score(text: str, question_num: int) -> int:
    numbers = re.findall(r'\d+', text)
    if not numbers:
        return 0

    score = int(numbers[0])

    max_score = {1: 1, 2: 2, 3: 1, 4: 2}.get(question_num, 2)
    if score < 0:
        return 0
    if score > max_score:
        return max_score
    return score

def predict_batch(model, tokenizer, prompts, question_nums):
    inputs = tokenizer(
        prompts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=MAX_SEQ_LENGTH,
    ).to(model.device)

    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            max_new_tokens=2,
            do_sample=False,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    decoded = tokenizer.batch_decode(outputs, skip_special_tokens=True)
    predictions = []
    for i, full_text in enumerate(decoded):
        prompt = prompts[i]
        generated = full_text[len(prompt):].strip()
        score = extract_score(generated, question_nums[i])
        predictions.append(score)
    return predictions

def main():
  df[["Картинка из вопроса"]] = df[["Картинка из вопроса"]].fillna("no image")
  saved_links = []
  for image in tqdm(df[["Картинка из вопроса"]].values):
      if image != "no image" and image not in saved_links:
          saved_links.append(image)

  df["Тип теста"] = pd.DataFrame(data=[0]*df.shape[0])
  for test_idx in tqdm(range(df.shape[0])):
    if df["Картинка из вопроса"].loc[test_idx] == "no image":
      df["Тип теста"].loc[test_idx] = 0
    else:
      df["Тип теста"].loc[test_idx] = 1

  df = df.drop('Unnamed: 0', axis=1)

  def filter_text(text: str) -> str:
      no_html = re.sub(r'<[^>]+>', '', text)
      result = ''.join(char for char in no_html if not (char.isascii() and char.isalpha()))
      result = re.sub(r'[a-zA-Z]', '', no_html)

      return result

  for j in tqdm(range(df.shape[0])):
    df["Текст вопроса"].loc[j] = filter_text(df["Текст вопроса"].loc[j])

  df["Схожесть описания картинки"] = pd.DataFrame(data=[0]*df.shape[0])

  IMAGES_TEXT = name_images()
  get_user_img_answer()
  get_similarity_feature(saved_links, IMAGES_TEXT)

  print("Генерация промптов...")
  prompts = df.apply(build_inference_prompt, axis=1).tolist()
  question_nums = df["№ вопроса"].tolist()

  print("Загрузка модели...")
  model, tokenizer = load_model_and_tokenizer()

  print(f"Запуск инференса для {len(df)} примеров...")
  predictions = []

  for i in range(0, len(prompts), BATCH_SIZE):
      batch_prompts = prompts[i:i+BATCH_SIZE]
      batch_qnums = question_nums[i:i+BATCH_SIZE]
      batch_preds = predict_batch(model, tokenizer, batch_prompts, batch_qnums)
      predictions.extend(batch_preds)
      if (i // BATCH_SIZE + 1) % 10 == 0:
          print(f"Обработано: {i + len(batch_prompts)} / {len(prompts)}")

  df["Оценка экзаменатора"] = predictions

  output_df = df[["ID экзамена", "ID вопроса", "Оценка экзаменатора"]]
  output_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")

  print(f"Предсказания сохранены в {OUTPUT_CSV}")