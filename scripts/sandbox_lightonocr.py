import argparse
import json
from pathlib import Path

from sif_nlp_precursor.services.ocr_service import ocr_image, ocr_pdf


def main():
    parser = argparse.ArgumentParser(description="Run LightOnOCR-2 on an image or PDF.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("data/ocr_sandbox"))
    args = parser.parse_args()

    if not args.input.exists():
        parser.error(f"Input file not found: {args.input}")

    if args.input.suffix.lower() == ".pdf":
        result = ocr_pdf(args.input, args.output_dir / args.input.stem)
    elif args.input.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
        result = {"text": ocr_image(args.input), "image": str(args.input)}
    else:
        parser.error("Input must be a PDF or supported image file.")

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()