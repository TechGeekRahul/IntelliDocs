from openai import OpenAI

SYSTEM_PROMPT = (
    "You answer questions using only the provided document context. "
    "If the context is insufficient, say you don't know. "
    "Reference sources as [Source N] when relevant."
)


def build_user_prompt(question: str, chunks: list[dict]) -> str:
    context_blocks = []
    for index, chunk in enumerate(chunks, start=1):
        context_blocks.append(
            f"[Source {index}] ({chunk['source']}, chunk {chunk['chunk_index']})\n"
            f"{chunk['content']}"
        )

    context = "\n\n".join(context_blocks)
    return f"Context:\n\n{context}\n\nQuestion: {question}"


def generate_answer(
    api_key: str,
    model: str,
    question: str,
    chunks: list[dict],
) -> str:
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(question, chunks)},
        ],
        temperature=0.2,
    )

    message = response.choices[0].message.content
    if not message:
        raise ValueError("Empty response from LLM")

    return message.strip()
