import os
from pathlib import Path
from typing import Any

from PIL import Image


OCR_ENGINE = os.getenv("OCR_ENGINE", "rapidocr").lower()
MODEL_ID = os.getenv("LIGHTONOCR_MODEL_ID", "lightonai/LightOnOCR-2-1B")
MAX_NEW_TOKENS = int(os.getenv("LIGHTONOCR_MAX_NEW_TOKENS", "1024"))

_OCR_RUNTIME: Any = None


def _get_lighton_runtime():
    global _OCR_RUNTIME
    if _OCR_RUNTIME is not None:
        return _OCR_RUNTIME

    try:
        import torch
        from transformers import (
            LightOnOcrForConditionalGeneration,
            LightOnOcrProcessor,
        )
    except ImportError as exc:
        raise RuntimeError(
            "LightOnOCR dependencies are unavailable. Install transformers>=5.0, torch, and pillow."
        ) from exc

    if torch.cuda.is_available():
        device = "cuda"
        dtype = torch.bfloat16
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = "mps"
        dtype = torch.float32
    else:
        device = "cpu"
        dtype = torch.float32

    model = LightOnOcrForConditionalGeneration.from_pretrained(
        MODEL_ID,
        torch_dtype=dtype,
    ).to(device)
    model.eval()
    processor = LightOnOcrProcessor.from_pretrained(
        MODEL_ID,
        fix_mistral_regex=True,
    )
    _OCR_RUNTIME = (model, processor, device, dtype)
    return _OCR_RUNTIME


def _get_rapid_runtime():
    global _OCR_RUNTIME
    if _OCR_RUNTIME is None:
        try:
            from rapidocr import RapidOCR
        except ImportError as exc:
            raise RuntimeError(
                "RapidOCR dependencies are unavailable. Install rapidocr and onnxruntime."
            ) from exc
        _OCR_RUNTIME = RapidOCR()
    return _OCR_RUNTIME


def ocr_image(image_path: str | Path) -> str:
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"OCR image not found: {path}")

    if OCR_ENGINE == "rapidocr":
        result = _get_rapid_runtime()(str(path))
        return "\n".join(result.txts or []).strip()

    if OCR_ENGINE != "lighton":
        raise RuntimeError(f"Unsupported OCR_ENGINE: {OCR_ENGINE}")

    model, processor, device, dtype = _get_lighton_runtime()
    with Image.open(path) as image:
        image_input = image.convert("RGB")
        conversation = [{
            "role": "user",
            "content": [{"type": "image", "image": image_input}],
        }]
        inputs = processor.apply_chat_template(
            conversation,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        inputs = {
            key: value.to(device=device, dtype=dtype)
            if value.is_floating_point()
            else value.to(device)
            for key, value in inputs.items()
        }

    output_ids = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS)
    generated_ids = output_ids[0, inputs["input_ids"].shape[1]:]
    return processor.decode(generated_ids, skip_special_tokens=True).strip()


def ocr_pdf(pdf_path: str | Path, output_dir: str | Path) -> dict:
    from sif_nlp_precursor.services.file_converter import convert_pdf_to_images

    image_paths = convert_pdf_to_images(str(pdf_path), str(output_dir), dpi=200)
    pages = [{"page": index, "image": str(path), "text": ocr_image(path)}
             for index, path in enumerate(image_paths, start=1)]
    return {
        "pages": pages,
        "text": "\n\n".join(page["text"] for page in pages).strip(),
    }