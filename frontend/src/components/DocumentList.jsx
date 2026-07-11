import { useEffect, useState } from "react";
import { deleteDocument, listDocuments } from "../api";

export default function DocumentList({ refreshKey, onChanged }) {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((err) => setError(err.message));
  }, [refreshKey]);

  async function handleDelete(documentId) {
    if (!window.confirm("Delete this document?")) {
      return;
    }

    setDeletingId(documentId);
    setError("");

    try {
      await deleteDocument(documentId);
      setDocuments((current) =>
        current.filter((doc) => doc.document_id !== documentId),
      );
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  }

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
              <div className="doc-info">
                <strong>{doc.filename}</strong>
                <span>{doc.chunk_count} chunks</span>
              </div>
              <button
                type="button"
                className="btn-delete"
                disabled={deletingId === doc.document_id}
                onClick={() => handleDelete(doc.document_id)}
              >
                {deletingId === doc.document_id ? "..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
