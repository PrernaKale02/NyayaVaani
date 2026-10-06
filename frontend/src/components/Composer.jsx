import { ArrowUp, Paperclip } from "lucide-react";

function Composer({
  message,
  onMessageChange,
  onSend,
  onUpload,
  uploading,
  uploadStage,
}) {
  return (
    <>
      <input
        id="document-upload"
        type="file"
        accept=".pdf"
        onChange={onUpload}
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
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask a question about the law..."
            rows={1}
          />

          <button
            className="send-button"
            onClick={onSend}
            disabled={!message.trim()}
          >
            <ArrowUp size={18} />
          </button>
        </div>

        <p className="disclaimer">
          NyayaVaani provides legal information, not legal advice.
        </p>
      </div>
    </>
  );
}

export default Composer;