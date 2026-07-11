import { useState } from "react";
import ChatPanel from "./components/ChatPanel";
import DocumentList from "./components/DocumentList";
import DocumentUpload from "./components/DocumentUpload";
import "./App.css";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app">
      <header>
        <h1>IntelliDocs</h1>
        <p>Upload docs and ask questions with cited answers.</p>
      </header>

      <main>
        <aside>
          <DocumentUpload onUploaded={() => setRefreshKey((key) => key + 1)} />
          <DocumentList refreshKey={refreshKey} />
        </aside>
        <ChatPanel />
      </main>
    </div>
  );
}

export default App;
