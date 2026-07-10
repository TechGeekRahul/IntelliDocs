from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import ChatRequest, ChatResponse, Citation
from app.services.llm import generate_answer

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(request: Request, body: ChatRequest) -> ChatResponse:
    settings = request.app.state.settings
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured",
        )

    vector_store = request.app.state.vector_store
    matches = vector_store.search(
        query=body.question,
        top_k=body.top_k,
        document_id=body.document_id,
    )

    citations = [Citation(**match) for match in matches]
    if not citations:
        return ChatResponse(
            question=body.question,
            answer="I couldn't find any relevant information in the uploaded documents.",
            citations=[],
        )

    try:
        answer = generate_answer(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            question=body.question,
            chunks=matches,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to generate answer: {exc}",
        ) from exc

    return ChatResponse(
        question=body.question,
        answer=answer,
        citations=citations,
    )
