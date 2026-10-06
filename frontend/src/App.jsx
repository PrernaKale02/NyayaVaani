import { useEffect, useState } from "react";
import "./index.css";
import translations from "./i18n";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ChatArea from "./components/ChatArea";
import Composer from "./components/Composer";
import SourceModal from "./components/SourceModal";
import ExplainPopup from "./components/ExplainPopup";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut  } from "firebase/auth";
import Login from "./auth/Login";
import Signup from "./auth/Signup";

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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

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

      const token = await auth.currentUser.getIdToken();

      const responsePromise = fetch("http://127.0.0.1:8090/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
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
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("http://127.0.0.1:8090/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
  if (authLoading) {
  return (
    <div className="auth-page">
      <div className="auth-card auth-loading">
        <h1>NyayaVaani</h1>
        <p>Loading...</p>
      </div>
    </div>
  );
}

  if (!user) {
    return showSignup ? (
      <Signup
        onLogin={() => setShowSignup(false)}
        onSignup={() => setShowSignup(false)}
      />
    ) : (
      <Login
        onSignup={() => setShowSignup(true)}
        onLogin={() => {}}
      />
    );
  }
  return (
    <div className="app">
      <Sidebar
        onNewChat={() => setMessages([])}
        user={user}
        onLogout={handleLogout}
      />
      <main className="main">
        <Topbar language={language} onLanguageChange={setLanguage} />
        <ChatArea
          messages={messages}
          loading={loading}
          onSuggestionSelect={setMessage}
          onSourceSelect={setSelectedSource}
        />
        <Composer
          message={message}
          onMessageChange={setMessage}
          onSend={sendMessage}
          onUpload={handleUpload}
          uploading={uploading}
          uploadStage={uploadStage}
        />
        <SourceModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
        <ExplainPopup
          selectionPosition={selectionPosition}
          showExplainPopup={showExplainPopup}
          selectedText={selectedText}
          explanation={explanation}
          explainLoading={explainLoading}
          translation={translation}
          translationLanguage={translationLanguage}
          translateLoading={translateLoading}
          onExplain={handleExplain}
          onTranslate={handleTranslate}
          onTranslationLanguageChange={setTranslationLanguage}
          onClose={() => {
            setShowExplainPopup(false);
            setSelectionPosition(null);
          }}
        />
      </main>
    </div>
  );
}

export default App;