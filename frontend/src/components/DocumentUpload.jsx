import { useState } from "react";
import { uploadDocument } from "../api";

export default function DocumentUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setStatus("Choose a file first.");
      return;
    }

    setLoading(true);
    setStatus("Uploading...");

    try {
      const result = await uploadDocument(file);
      setStatus(`Uploaded ${result.filename} (${result.chunk_count} chunks)`);
      setFile(null);
      event.target.reset();
      onUploaded?.();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Upload document</h2>
      <p className="hint">PDF, DOCX, or Markdown</p>
      <input
        type="file"
        accept=".pdf,.docx,.md,.markdown"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>
      {status && <p className="status">{status}</p>}
    </form>
  );
}
