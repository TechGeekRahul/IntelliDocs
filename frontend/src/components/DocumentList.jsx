import { useEffect, useState } from "react";
import { listDocuments } from "../api";

export default function DocumentList({ refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((err) => setError(err.message));
  }, [refreshKey]);

  return (
    <div className="panel">
      <h2>Documents</h2>
      {error && <p className="status error">{error}</p>}
      {!error && documents.length === 0 && (
        <p className="hint">No documents uploaded yet.</p>
      )}
      {documents.length > 0 && (
        <ul className="doc-list">
          {documents.map((doc) => (
            <li key={doc.document_id}>
              <strong>{doc.filename}</strong>
              <span>{doc.chunk_count} chunks</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
