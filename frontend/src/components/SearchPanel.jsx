import { useEffect, useState } from "react";
import { listDocuments, searchDocuments } from "../api";

export default function SearchPanel({ refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    listDocuments()
      .then((docs) => {
        setDocuments(docs);
        setDocumentId((current) =>
          current && !docs.some((doc) => doc.document_id === current)
            ? ""
            : current,
        );
      })
      .catch(() => {});
  }, [refreshKey]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setHasSearched(true);

    try {
      const response = await searchDocuments(query.trim(), documentId || null);
      setResults(response.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel search-panel" onSubmit={handleSubmit}>
      <h2>Search documents</h2>
      <p className="hint">Find relevant chunks without calling the LLM.</p>

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
        Query
        <textarea
          rows={3}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for hooks, authentication, deployment..."
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>

      {error && <p className="status error">{error}</p>}

      {hasSearched && !error && results.length === 0 && !loading && (
        <p className="hint status">No matching chunks found.</p>
      )}

      {results.length > 0 && (
        <div className="citations">
          <h3>Results ({results.length})</h3>
          <ul>
            {results.map((item, index) => (
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
