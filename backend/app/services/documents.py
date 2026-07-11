import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from docx import Document as DocxDocument
from fastapi import HTTPException, UploadFile
from pypdf import PdfReader

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".md", ".markdown"}


def validate_file(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    return suffix


async def save_upload(file: UploadFile, upload_dir: Path) -> Path:
    upload_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename).suffix.lower()
    saved_path = upload_dir / f"{uuid.uuid4().hex}{suffix}"

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    saved_path.write_bytes(content)
    return saved_path


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        reader = PdfReader(str(path))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n".join(pages).strip()
    elif suffix == ".docx":
        doc = DocxDocument(str(path))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
    else:
        text = path.read_text(encoding="utf-8").strip()

    if not text:
        raise HTTPException(status_code=400, detail="No text could be extracted from the file")

    return text


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    if chunk_size <= overlap:
        raise ValueError("chunk_size must be greater than overlap")

    chunks: list[str] = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


class DocumentStore:
    def __init__(self, store_path: Path) -> None:
        self._store_path = store_path
        self._documents: dict[str, dict] = self._load()

    def _load(self) -> dict[str, dict]:
        if not self._store_path.exists():
            return {}

        data = json.loads(self._store_path.read_text(encoding="utf-8"))
        return {doc["document_id"]: doc for doc in data}

    def _save(self) -> None:
        self._store_path.parent.mkdir(parents=True, exist_ok=True)
        payload = list(self._documents.values())
        self._store_path.write_text(
            json.dumps(payload, indent=2),
            encoding="utf-8",
        )

    def add(self, filename: str, file_path: str, chunk_count: int) -> dict:
        document_id = uuid.uuid4().hex
        record = {
            "document_id": document_id,
            "filename": filename,
            "file_path": file_path,
            "chunk_count": chunk_count,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }
        self._documents[document_id] = record
        self._save()
        return record

    def get(self, document_id: str) -> dict | None:
        return self._documents.get(document_id)

    def delete(self, document_id: str) -> dict | None:
        record = self._documents.pop(document_id, None)
        if record:
            self._save()
        return record

    def list_all(self) -> list[dict]:
        return [
            {
                "document_id": doc["document_id"],
                "filename": doc["filename"],
                "chunk_count": doc["chunk_count"],
                "uploaded_at": doc["uploaded_at"],
            }
            for doc in self._documents.values()
        ]
