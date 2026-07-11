from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, UploadFile

from app.models.schemas import DocumentInfo, DocumentUploadResponse
from app.services.documents import chunk_text, extract_text, save_upload, validate_file

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentUploadResponse)
async def upload_document(request: Request, file: UploadFile) -> DocumentUploadResponse:
    validate_file(file)
    settings = request.app.state.settings
    upload_dir = Path(settings.upload_dir)

    saved_path = await save_upload(file, upload_dir)
    text = extract_text(saved_path)
    chunks = chunk_text(text)

    store = request.app.state.document_store
    record = store.add(
        filename=file.filename,
        file_path=str(saved_path),
        chunk_count=len(chunks),
    )

    vector_store = request.app.state.vector_store
    vector_store.index_document(
        document_id=record["document_id"],
        filename=record["filename"],
        chunks=chunks,
    )

    return DocumentUploadResponse(
        document_id=record["document_id"],
        filename=record["filename"],
        chunk_count=record["chunk_count"],
        message="Document uploaded, chunked, and indexed",
    )


@router.get("", response_model=list[DocumentInfo])
def list_documents(request: Request) -> list[DocumentInfo]:
    store = request.app.state.document_store
    return store.list_all()


@router.delete("/{document_id}")
def delete_document(request: Request, document_id: str) -> dict[str, str]:
    store = request.app.state.document_store
    record = store.delete(document_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")

    vector_store = request.app.state.vector_store
    vector_store.delete_document(document_id)

    file_path = Path(record["file_path"])
    if file_path.exists():
        file_path.unlink()

    return {
        "message": "Document deleted",
        "document_id": document_id,
    }
