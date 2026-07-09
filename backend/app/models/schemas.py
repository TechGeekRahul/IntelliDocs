from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    message: str


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    uploaded_at: str


class Citation(BaseModel):
    source: str
    document_id: str
    chunk_index: int
    content: str
    score: float


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)
    document_id: str | None = None


class ChatResponse(BaseModel):
    question: str
    answer: str
    citations: list[Citation]
