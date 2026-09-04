from pathlib import Path

from sif_nlp_precursor.services.file_converter import (
    convert_pdf_to_images,
)


SUPPORTED_IMAGE_TYPES = {".png", ".jpg", ".jpeg"}
SUPPORTED_TEXT_TYPES = {".txt"}
SUPPORTED_DOCUMENT_TYPES = {".pdf", ".docx"}


def process_extracted_files(
    extracted_files: list[Path],
    output_dir: str,
):
    try:
        results = []

        output_path = Path(output_dir)
        output_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        for file_path in extracted_files:
            try:
                file_path = Path(file_path)

                if not file_path.exists():
                    raise FileNotFoundError(
                        f"File not found: {file_path}"
                    )

                extension = file_path.suffix.lower()

                # PDF → images
                if extension == ".pdf":
                    image_dir = (
                        output_path / file_path.stem
                    )

                    image_paths = convert_pdf_to_images(
                        pdf_path=str(file_path),
                        output_dir=str(image_dir),
                    )

                    results.append(
                        {
                            "file": str(file_path),
                            "type": "pdf",
                            "images": [
                                str(image)
                                for image in image_paths
                            ],
                        }
                    )

                # Images → directly available for OCR
                elif extension in SUPPORTED_IMAGE_TYPES:
                    results.append(
                        {
                            "file": str(file_path),
                            "type": "image",
                            "images": [str(file_path)],
                        }
                    )

                # TXT → text extraction will be added later
                elif extension in SUPPORTED_TEXT_TYPES:
                    results.append(
                        {
                            "file": str(file_path),
                            "type": "text",
                            "images": [],
                        }
                    )

                # DOCX → document extraction will be added later
                elif extension in SUPPORTED_DOCUMENT_TYPES:
                    results.append(
                        {
                            "file": str(file_path),
                            "type": "document",
                            "images": [],
                        }
                    )

                else:
                    results.append(
                        {
                            "file": str(file_path),
                            "type": "unsupported",
                            "images": [],
                        }
                    )

            except Exception as e:
                results.append(
                    {
                        "file": str(file_path),
                        "type": "error",
                        "images": [],
                        "error": str(e),
                    }
                )

        return results

    except Exception as e:
        raise RuntimeError(
            f"Unexpected batch processing error: {e}"
        ) from e