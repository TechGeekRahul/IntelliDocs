const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : response.statusText;
    throw new Error(message);
  }

  return response.json();
}

export function listDocuments() {
  return request("/documents");
}

export function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/documents", { method: "POST", body: form });
}

export function deleteDocument(documentId) {
  return request(`/documents/${documentId}`, { method: "DELETE" });
}

function parseSseChunk(chunk, onEvent) {
  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ")) {
      continue;
    }
    onEvent(JSON.parse(line.slice(6)));
  }
}

export async function askQuestionStream(
  question,
  documentId,
  topK,
  { onCitations, onToken, onDone, onError },
) {
  const response = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      top_k: topK,
      document_id: documentId || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : response.statusText;
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      parseSseChunk(part, (event) => {
        if (event.type === "citations") {
          onCitations?.(event.citations);
        } else if (event.type === "token" || event.type === "answer") {
          onToken?.(event.content);
        } else if (event.type === "error") {
          onError?.(event.message);
        } else if (event.type === "done") {
          onDone?.();
        }
      });
    }
  }

  if (buffer.trim()) {
    parseSseChunk(buffer, (event) => {
      if (event.type === "citations") {
        onCitations?.(event.citations);
      } else if (event.type === "token" || event.type === "answer") {
        onToken?.(event.content);
      } else if (event.type === "error") {
        onError?.(event.message);
      } else if (event.type === "done") {
        onDone?.();
      }
    });
  }
}

export function askQuestion(question, documentId, topK = 5) {
  return request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      top_k: topK,
      document_id: documentId || null,
    }),
  });
}
