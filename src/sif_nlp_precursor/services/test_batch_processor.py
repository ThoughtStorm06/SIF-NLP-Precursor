from pathlib import Path

from sif_nlp_precursor.services.zip_decoder import extract_zip
from sif_nlp_precursor.services.batch_processor import (
    process_extracted_files,
)


ZIP_PATH = "data/pdf_reports.zip"
EXTRACT_DIR = "data/pdf_batch_extracted"
CONVERTED_DIR = "data/batch_converted"


def main():
    try:
        # Step 1: Extract ZIP
        extracted_files = extract_zip(
            zip_path=ZIP_PATH,
            output_dir=EXTRACT_DIR,
        )

        print("ZIP extraction successful.")
        print(f"Files extracted: {len(extracted_files)}")

        # Step 2: Process every extracted file
        results = process_extracted_files(
            extracted_files=extracted_files,
            output_dir=CONVERTED_DIR,
        )

        print("\nBatch processing successful.")
        print("\nProcessing results:")

        for result in results:
            print(f"\nFile: {result['file']}")
            print(f"Type: {result['type']}")

            if result["images"]:
                print("Images:")
                for image in result["images"]:
                    print(f"  - {image}")

            if "error" in result:
                print(f"Error: {result['error']}")

    except FileNotFoundError as e:
        print(f"File error: {e}")

    except ValueError as e:
        print(f"Validation error: {e}")

    except RuntimeError as e:
        print(f"Runtime error: {e}")

    except Exception as e:
        print(f"Unexpected test error: {e}")


if __name__ == "__main__":
    main()