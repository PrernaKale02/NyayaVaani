import { useEffect, useState } from "react";
import {
  Scale,
  Plus,
  MessageSquare,
  FileText,
  Settings,
  Globe,
  Paperclip,
  ArrowUp,
  X,
} from "lucide-react";
import "./index.css";
import ReactMarkdown from "react-markdown";
import translations from "./i18n";

const languages = [
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिंदी" },
  { code: "Marathi", label: "मराठी" },
  { code: "Malayalam", label: "മലയാളം" },
];

function App() {
  const [language, setLanguage] = useState("English");
  const t = translations[language];
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [showExplainPopup, setShowExplainPopup] = useState(false);
  const [translation, setTranslation] = useState("");
  const [translationLanguage, setTranslationLanguage] = useState("Hindi");
  const [translateLoading, setTranslateLoading] = useState(false);

  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem("nyayavaani_session_id");

    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(
        "nyayavaani_session_id",
        id
      );
    }

    return id;
  });

  useEffect(() => {
  const handleSelection = () => {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed) {
      setSelectionPosition(null);
      return;
    }

    const text = selection.toString().trim();

    if (!text || text.length > 1000) {
      setSelectionPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(text);

    setSelectionPosition({
      top: rect.top + window.scrollY - 45,
      left: rect.left + window.scrollX + rect.width / 2
    });
  };

  document.addEventListener("mouseup", handleSelection);

  return () => {
      document.removeEventListener("mouseup", handleSelection);
    };
  }, []);

const handleExplain = async () => {
  if (!selectedText) return;

  setExplainLoading(true);
  setShowExplainPopup(true);
  setExplanation("");
  setTranslation("");

  try {
    const response = await fetch(
      "http://127.0.0.1:8090/explain",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: selectedText
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Explanation failed");
    }

    setExplanation(data.explanation);

  } catch (error) {
    console.error(error);
    setExplanation("Could not explain this text.");
  } finally {
    setExplainLoading(false);
  }
  };

  const handleTranslate = async () => {
    if (!explanation) return;

    setTranslateLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8090/translate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: explanation,
            target_language: translationLanguage
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Translation failed");
      }

      setTranslation(data.translation);

    } catch (error) {
      console.error(error);
      setTranslation("Could not translate this explanation.");
    } finally {
      setTranslateLoading(false);
    }
  };
  useEffect(() => {
    if (!selectedSource) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedSource(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSource]);

  const handleUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);

    try {
      setUploading(true);
      setUploadStage("Uploading document...");

      // Give the UI a moment to show the first stage
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUploadStage("Extracting text...");

      await new Promise((resolve) => setTimeout(resolve, 700));

      setUploadStage("Creating legal document chunks...");

      await new Promise((resolve) => setTimeout(resolve, 700));

      setUploadStage("Generating multilingual embeddings...");

      const responsePromise = fetch("http://127.0.0.1:8090/upload", {
        method: "POST",
        body: formData,
      });

      // While backend is processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUploadStage("Indexing in vector database...");

      const response = await responsePromise;
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setUploadStage("Document indexed successfully!");

      setTimeout(() => {
        setUploading(false);
        setUploadStage("");
      }, 1500);

    } catch (error) {
      console.error("Upload error:", error);

      setUploadStage("");
      setUploading(false);

      alert(`Upload failed: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  };
  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const question = message;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8090/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          language,
          session_id: sessionId
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || []
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect to NyayaVaani.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Scale size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h1>NyayaVaani</h1>
            <span>Legal information, simply explained.</span>
          </div>
        </div>

        <button className="new-chat" onClick={() => setMessages([])}>
          <Plus size={17} />
          New conversation
        </button>

        <div className="sidebar-section">
          <p className="section-label">Workspace</p>

          <button className="sidebar-item active">
            <MessageSquare size={17} />
            Conversations
          </button>

          <button className="sidebar-item">
            <FileText size={17} />
            My documents
          </button>
        </div>

        <div className="sidebar-bottom">
          <button className="sidebar-item">
            <Settings size={17} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">

        <header className="topbar">
          <div>
            <span className="topbar-title">New conversation</span>
          </div>

          <div className="language-select">
            <Globe size={16} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="chat-area">

          {messages.length === 0 ? (
            <>
              <div className="welcome">
                <div className="welcome-mark">
                  <Scale size={25} strokeWidth={1.7} />
                </div>

                <p className="eyebrow">NYAYAVAANI</p>

                <h2>
                  Understand the law.
                  <br />
                  <span>In your language.</span>
                </h2>

                <p className="welcome-text">
                  Ask questions about Indian law or upload a legal document.
                  NyayaVaani finds relevant information and explains it clearly.
                </p>
              </div>

              <div className="suggestions">
                <button onClick={() => setMessage("What is public law?")}>
                  What is public law?
                </button>

                <button onClick={() => setMessage("Explain this legal document")}>
                  Explain a legal document
                </button>

                <button onClick={() => setMessage("Explain this clause simply")}>
                  Explain a clause simply
                </button>
              </div>
            </>
          ) : (
            <div className="messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message-row ${msg.role}`}>
                  {msg.role === "assistant" && (
                    <div className="message-icon" aria-hidden="true">
                      <Scale size={15} />
                    </div>
                  )}

                  <div className="message-content">
                    <div className="message-bubble">
                      {msg.role === "assistant" ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {msg.role === "assistant" && msg.sources?.length > 0 && (
                      <div className="sources">
                        <div className="sources-header">
                          <FileText size={14} aria-hidden="true" />
                          <span>Sources</span>
                        </div>

                        <div className="source-list">
                          {msg.sources.map((source) => (
                            <button
                              className="source-card"
                              key={source.id}
                              onClick={() => setSelectedSource(source)}
                              aria-label={`Open source ${source.id}: ${source.document}`}
                            >
                              <span className="source-number">[{source.id}]</span>
                              <span className="source-name">{source.document}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-row assistant">
                  <div className="message-icon">
                    <Scale size={15} />
                  </div>

                  <div className="message-content">
                    <div className="message-bubble loading">
                    Thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </section>

        {/* Input */}
        <input
            id="document-upload"
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        <div className="composer-wrapper">
        {uploading && (
          <div className="upload-status">
            <div className="upload-spinner"></div>
            <span>{uploadStage}</span>
          </div>
        )}
          <div className="composer">

            <button
              className="attach-button"
              title={uploading ? "Uploading..." : "Upload document"}
              onClick={() => document.getElementById("document-upload").click()}
              disabled={uploading}
            >
              <Paperclip size={19} />
            </button>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask a question about the law..."
              rows={1}
            />

            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!message.trim()}
            >
              <ArrowUp size={18} />
            </button>

          </div>

          <p className="disclaimer">
            NyayaVaani provides legal information, not legal advice.
          </p>
        </div>

        {selectedSource && (
          <div
            className="source-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedSource(null);
            }}
          >
            <section
              className="source-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="source-modal-title"
            >
              <header className="source-modal-header">
                <div>
                  <p className="source-modal-kicker">Source {selectedSource.id}</p>
                  <h2 id="source-modal-title">{selectedSource.document}</h2>
                </div>
                <button
                  className="source-modal-close"
                  onClick={() => setSelectedSource(null)}
                  aria-label="Close source"
                >
                  <X size={18} />
                </button>
              </header>
              <div className="source-modal-text">
                {selectedSource.text || "No source text is available."}
              </div>
            </section>
          </div>
        )}
        {selectionPosition && !showExplainPopup && (
          <button
            className="explain-bubble"
            style={{
              top: selectionPosition.top,
              left: selectionPosition.left
            }}
            onClick={handleExplain}
          >
            ✨ Explain
          </button>
        )}
        {showExplainPopup && (
          <div
            className="explain-popup"
            style={{
              top: selectionPosition?.top + 45,
              left: selectionPosition?.left
            }}
          >
            <div className="explain-header">
              <span>Legal Explanation</span>

              <button
                className="explain-close"
                onClick={() => {
                  setShowExplainPopup(false);
                  setSelectionPosition(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="selected-term">
              "{selectedText}"
            </div>

            <div className="explanation-content">
              {explainLoading ? (
                <div className="explain-loading">
                  <div className="small-spinner"></div>
                  Explaining...
                </div>
              ) : (
                explanation
              )}
            </div>

            {!explainLoading && explanation && (
              <>
                <div className="translate-row">
                  <select
                    value={translationLanguage}
                    onChange={(e) =>
                      setTranslationLanguage(e.target.value)
                    }
                  >
                    <option>Hindi</option>
                    <option>Marathi</option>
                    <option>Malayalam</option>
                    <option>English</option>
                  </select>

                  <button
                    className="translate-button"
                    onClick={handleTranslate}
                    disabled={translateLoading}
                  >
                    {translateLoading
                      ? "Translating..."
                      : "Translate"}
                  </button>
                </div>

                {translation && (
                  <div className="translation-result">
                    {translation}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;