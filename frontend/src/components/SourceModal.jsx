import { X } from "lucide-react";

function SourceModal({ source, onClose }) {
  if (!source) return null;

  return (
    <div
      className="source-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
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
            <p className="source-modal-kicker">Source {source.id}</p>
            <h2 id="source-modal-title">{source.document}</h2>
          </div>
          <button
            className="source-modal-close"
            onClick={onClose}
            aria-label="Close source"
          >
            <X size={18} />
          </button>
        </header>
        <div className="source-modal-text">
          {source.text || "No source text is available."}
        </div>
      </section>
    </div>
  );
}

export default SourceModal;