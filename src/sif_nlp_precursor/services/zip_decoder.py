import shutil
from pathlib import Path, PurePosixPath
from zipfile import BadZipFile, ZipFile


def _is_safe_member_path(member_name: str) -> bool:
    normalized_name = member_name.replace("\\", "/")
    parts = PurePosixPath(normalized_name).parts

    if not normalized_name or normalized_name.startswith("/"):
        return False

    if any(part in {"", ".", ".."} for part in parts):
        return False

    return True


def extract_zip(zip_path: str, output_dir: str):
    try:
        zip_file = Path(zip_path)
        output_path = Path(output_dir)

        if not zip_file.exists():
            raise FileNotFoundError(
                f"ZIP file not found: {zip_file}"
            )

        if zip_file.suffix.lower() != ".zip":
            raise ValueError(
                "The input file must be a ZIP file."
            )

        output_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        extracted_files = []

        with ZipFile(zip_file, "r") as zip_ref:
            for member in zip_ref.infolist():
                member_name = member.filename.replace("\\", "/")

                if not _is_safe_member_path(member_name):
                    raise ValueError(
                        f"ZIP contains an unsafe file path: {member.filename}"
                    )

                target_path = (output_path / member_name).resolve(strict=False)
                base_path = output_path.resolve(strict=False)

                if target_path != base_path and base_path not in target_path.parents:
                    raise ValueError(
                        f"ZIP contains an unsafe file path: {member.filename}"
                    )

                if member.is_dir():
                    target_path.mkdir(parents=True, exist_ok=True)
                    continue

                target_path.parent.mkdir(parents=True, exist_ok=True)

                with zip_ref.open(member, "r") as source, open(target_path, "wb") as target:
                    shutil.copyfileobj(source, target)

                extracted_files.append(target_path)

        return extracted_files

    except FileNotFoundError:
        raise

    except ValueError:
        raise

    except BadZipFile as e:
        raise ValueError(
            "The uploaded file is not a valid ZIP file."
        ) from e

    except Exception as e:
        raise RuntimeError(
            f"Unexpected ZIP extraction error: {e}"
        ) from e