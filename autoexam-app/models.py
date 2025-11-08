import threading
import logging
from typing import Tuple

import torch
from transformers import (
    AutoTokenizer,
    AutoProcessor,
    Qwen2_5_VLForConditionalGeneration,
    BitsAndBytesConfig,
    AutoModel,
)
from peft import PeftModel

logger = logging.getLogger(__name__)


MODEL_NAME = "Qwen/Qwen2.5-VL-3B-Instruct"
ADAPTER_PATH = "qwen_sft_exam"


_vl_lock = threading.Lock()
_vl_model = None
_vl_processor = None

_text_lock = threading.Lock()
_text_model = None
_text_tokenizer = None

_ru_lock = threading.Lock()
_ru_model = None
_ru_tokenizer = None


def _bnb_config() -> BitsAndBytesConfig:
    return BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )


def _load_qwen_vl_with_fallback() -> Qwen2_5_VLForConditionalGeneration:
    """Пытаемся загрузить модель в 4-bit; если bitsandbytes без GPU или не доступен CUDA —
    откатываемся на fp16 без квантования."""
    if torch.cuda.is_available():
        try:
            return Qwen2_5_VLForConditionalGeneration.from_pretrained(
                MODEL_NAME,
                quantization_config=_bnb_config(),
                device_map="auto",
                trust_remote_code=True,
                dtype=torch.float16,
                low_cpu_mem_usage=True,
            )
        except Exception as e:
            print("[models] 4-bit загрузка не удалась, fallback на fp16:", e)

    # Fallback: fp16 без bnb
    return Qwen2_5_VLForConditionalGeneration.from_pretrained(
        MODEL_NAME,
        device_map="auto",
        trust_remote_code=True,
        dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        low_cpu_mem_usage=True,
    )


def get_vl_model_and_processor() -> Tuple[Qwen2_5_VLForConditionalGeneration, AutoProcessor]:
    global _vl_model, _vl_processor
    if _vl_model is not None and _vl_processor is not None:
        return _vl_model, _vl_processor

    with _vl_lock:
        if _vl_model is not None and _vl_processor is not None:
            return _vl_model, _vl_processor

        logger.info("[models] Загрузка VL модели и процессора...")
        _vl_processor = AutoProcessor.from_pretrained(
            MODEL_NAME,
            use_fast=False,
            trust_remote_code=True,
        )

        _vl_model = _load_qwen_vl_with_fallback()
        _vl_model.eval()
        for p in _vl_model.parameters():
            p.requires_grad = False
        logger.info("[models] VL модель загружена успешно")

    return _vl_model, _vl_processor


def get_text_model_and_tokenizer():
    global _text_model, _text_tokenizer
    if _text_model is not None and _text_tokenizer is not None:
        return _text_model, _text_tokenizer

    with _text_lock:
        if _text_model is not None and _text_tokenizer is not None:
            return _text_model, _text_tokenizer

        logger.info("[models] Загрузка токенизатора и текстовой модели...")
        _text_tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
            padding_side="left",
            use_fast=False,
        )
        if _text_tokenizer.pad_token is None:
            _text_tokenizer.pad_token = _text_tokenizer.eos_token

        logger.info("[models] Загрузка базовой модели...")
        try:
            if torch.cuda.is_available():
                base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                    MODEL_NAME,
                    quantization_config=_bnb_config(),
                    device_map="auto",
                    trust_remote_code=True,
                    dtype=torch.float16,
                    low_cpu_mem_usage=True,
                )
            else:
                raise RuntimeError("CUDA недоступна, используем fp16/32")
        except Exception as e:
            logger.warning(f"[models] 4-bit загрузка базовой модели не удалась, fallback на fp16: {e}")
            base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                MODEL_NAME,
                device_map="auto",
                trust_remote_code=True,
                dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                low_cpu_mem_usage=True,
            )

        logger.info(f"[models] Загрузка LoRA адаптера из {ADAPTER_PATH}...")
        _text_model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
        _text_model.eval()
        for p in _text_model.parameters():
            p.requires_grad = False
        logger.info("[models] Текстовая модель с LoRA загружена успешно")

    return _text_model, _text_tokenizer


def get_rubert_model_and_tokenizer():
    global _ru_model, _ru_tokenizer
    if _ru_model is not None and _ru_tokenizer is not None:
        return _ru_model, _ru_tokenizer

    with _ru_lock:
        if _ru_model is not None and _ru_tokenizer is not None:
            return _ru_model, _ru_tokenizer

        logger.info("[models] Загрузка RuBERT модели...")
        _ru_tokenizer = AutoTokenizer.from_pretrained("cointegrated/rubert-tiny2", trust_remote_code=True, use_fast=False)
        _ru_model = AutoModel.from_pretrained("cointegrated/rubert-tiny2", trust_remote_code=True)
        _ru_model.eval()
        for p in _ru_model.parameters():
            p.requires_grad = False
        logger.info("[models] RuBERT модель загружена успешно")

    return _ru_model, _ru_tokenizer


