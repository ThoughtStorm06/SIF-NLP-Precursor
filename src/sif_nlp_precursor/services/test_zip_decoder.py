import zipfile
from pathlib import Path

import pytest

from sif_nlp_precursor.services.zip_decoder import extract_zip


ZIP_PATH = "data/test_reports.zip"
OUTPUT_DIR = "data/extracted_reports"


def test_extract_zip_rejects_path_traversal(tmp_path):
    zip_path = tmp_path / "malicious.zip"
    output_dir = tmp_path / "extracted"
    escape_path = tmp_path / "outside.txt"

    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr("../outside.txt", "malicious")

    with pytest.raises(ValueError, match="unsafe|invalid ZIP|outside"):
        extract_zip(str(zip_path), str(output_dir))

    assert not escape_path.exists()


def main():
    try:
        extracted_files = extract_zip(
            zip_path=ZIP_PATH,
            output_dir=OUTPUT_DIR,
        )

        print("ZIP extraction successful!")
        print("\nExtracted files:")

        for file in extracted_files:
            print(f"- {file}")

    except FileNotFoundError as e:
        print(f"File error: {e}")

    except ValueError as e:
        print(f"ZIP error: {e}")

    except RuntimeError as e:
        print(f"Runtime error: {e}")

    except Exception as e:
        print(f"Unexpected test error: {e}")


if __name__ == "__main__":
    main()