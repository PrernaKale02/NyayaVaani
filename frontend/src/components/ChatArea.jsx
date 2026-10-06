import { FileText, Scale } from "lucide-react";
import ReactMarkdown from "react-markdown";

function ChatArea({ messages, loading, onSuggestionSelect, onSourceSelect }) {
  return (
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
            <button onClick={() => onSuggestionSelect("What is public law?")}>
              What is public law?
            </button>

            <button
              onClick={() => onSuggestionSelect("Explain this legal document")}
            >
              Explain a legal document
            </button>

            <button
              onClick={() => onSuggestionSelect("Explain this clause simply")}
            >
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
                          onClick={() => onSourceSelect(source)}
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
                <div className="message-bubble loading">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ChatArea;