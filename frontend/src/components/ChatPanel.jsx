import { useEffect, useState } from "react";
import { askQuestion, listDocuments } from "../api";

export default function ChatPanel() {
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listDocuments().then(setDocuments).catch(() => {});
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setCitations([]);

    try {
      const result = await askQuestion(question.trim(), documentId || null);
      setAnswer(result.answer);
      setCitations(result.citations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel chat-panel" onSubmit={handleSubmit}>
      <h2>Ask a question</h2>

      <label>
        Limit to document (optional)
        <select
          value={documentId}
          onChange={(event) => setDocumentId(event.target.value)}
        >
          <option value="">All documents</option>
          {documents.map((doc) => (
            <option key={doc.document_id} value={doc.document_id}>
              {doc.filename}
            </option>
          ))}
        </select>
      </label>

      <label>
        Question
        <textarea
          rows={4}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What does this documentation say about..."
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Thinking..." : "Ask"}
      </button>

      {error && <p className="status error">{error}</p>}

      {answer && (
        <div className="answer">
          <h3>Answer</h3>
          <p>{answer}</p>
        </div>
      )}

      {citations.length > 0 && (
        <div className="citations">
          <h3>Sources</h3>
          <ul>
            {citations.map((item, index) => (
              <li key={`${item.document_id}-${item.chunk_index}`}>
                <strong>
                  [{index + 1}] {item.source}
                </strong>
                <span>score: {item.score}</span>
                <p>{item.content}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
