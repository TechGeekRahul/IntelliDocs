import { useState } from "react";
import ChatPanel from "./components/ChatPanel";
import DocumentList from "./components/DocumentList";
import DocumentUpload from "./components/DocumentUpload";
import SearchPanel from "./components/SearchPanel";
import "./App.css";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="app">
      <header>
        <h1>IntelliDocs</h1>
        <p>Upload docs and ask questions with cited answers.</p>
      </header>

      <main>
        <aside>
          <DocumentUpload onUploaded={() => setRefreshKey((key) => key + 1)} />
          <DocumentList
            refreshKey={refreshKey}
            onChanged={() => setRefreshKey((key) => key + 1)}
          />
        </aside>

        <section className="workspace">
          <nav className="tabs">
            <button
              type="button"
              className={activeTab === "chat" ? "active" : ""}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>
            <button
              type="button"
              className={activeTab === "search" ? "active" : ""}
              onClick={() => setActiveTab("search")}
            >
              Search
            </button>
          </nav>

          {activeTab === "chat" ? (
            <ChatPanel refreshKey={refreshKey} />
          ) : (
            <SearchPanel refreshKey={refreshKey} />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
