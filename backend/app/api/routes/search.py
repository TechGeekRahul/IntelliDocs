from fastapi import APIRouter, Request

from app.models.schemas import Citation, SearchRequest, SearchResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
def search_documents(request: Request, body: SearchRequest) -> SearchResponse:
    vector_store = request.app.state.vector_store
    matches = vector_store.search(
        query=body.query,
        top_k=body.top_k,
        document_id=body.document_id,
    )

    return SearchResponse(
        query=body.query,
        results=[Citation(**match) for match in matches],
    )
