import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse, Citation
from app.services.llm import generate_answer, stream_answer

router = APIRouter(prefix="/chat", tags=["chat"])


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _search_chunks(request: Request, body: ChatRequest) -> tuple[list[Citation], list[dict]]:
    vector_store = request.app.state.vector_store
    matches = vector_store.search(
        query=body.question,
        top_k=body.top_k,
        document_id=body.document_id,
    )
    citations = [Citation(**match) for match in matches]
    return citations, matches


@router.post("", response_model=ChatResponse)
def chat(request: Request, body: ChatRequest) -> ChatResponse:
    settings = request.app.state.settings
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured",
        )

    citations, matches = _search_chunks(request, body)
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


@router.post("/stream")
def chat_stream(request: Request, body: ChatRequest) -> StreamingResponse:
    settings = request.app.state.settings
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured",
        )

    citations, matches = _search_chunks(request, body)

    def event_generator():
        if not citations:
            message = "I couldn't find any relevant information in the uploaded documents."
            yield _sse({"type": "answer", "content": message})
            yield _sse({"type": "done"})
            return

        yield _sse(
            {
                "type": "citations",
                "citations": [citation.model_dump() for citation in citations],
            }
        )

        try:
            for token in stream_answer(
                api_key=settings.openai_api_key,
                model=settings.openai_model,
                question=body.question,
                chunks=matches,
            ):
                yield _sse({"type": "token", "content": token})
        except Exception as exc:
            yield _sse({"type": "error", "message": str(exc)})
            return

        yield _sse({"type": "done"})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
