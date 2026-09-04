from pathlib import Path

import pymupdf


def convert_pdf_to_images(
    pdf_path: str,
    output_dir: str,
):
    try:
        pdf_file = Path(pdf_path)
        output_path = Path(output_dir)

        if not pdf_file.exists():
            raise FileNotFoundError(
                f"PDF file not found: {pdf_file}"
            )

        if pdf_file.suffix.lower() != ".pdf":
            raise ValueError(
                "The input file must be a PDF."
            )

        output_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        document = pymupdf.open(pdf_file)

        if len(document) == 0:
            document.close()
            raise ValueError("The PDF contains no pages.")

        image_paths = []

        try:
            for page_number, page in enumerate(document, start=1):
                pixmap = page.get_pixmap()

                image_path = (
                    output_path
                    / f"{pdf_file.stem}_page_{page_number}.png"
                )

                pixmap.save(image_path)
                image_paths.append(image_path)

        finally:
            document.close()

        return image_paths

    except FileNotFoundError:
        raise

    except ValueError:
        raise

    except Exception as e:
        raise RuntimeError(
            f"Unexpected PDF conversion error: {e}"
        ) from e