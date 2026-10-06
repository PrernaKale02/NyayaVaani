function ExplainPopup({
  selectionPosition,
  showExplainPopup,
  selectedText,
  explanation,
  explainLoading,
  translation,
  translationLanguage,
  translateLoading,
  onExplain,
  onTranslate,
  onTranslationLanguageChange,
  onClose,
}) {
  return (
    <>
      {selectionPosition && !showExplainPopup && (
        <button
          className="explain-bubble"
          style={{
            top: selectionPosition.top,
            left: selectionPosition.left,
          }}
          onClick={onExplain}
        >
          ✨ Explain
        </button>
      )}
      {showExplainPopup && (
        <div
          className="explain-popup"
          style={{
            top: selectionPosition?.top + 45,
            left: selectionPosition?.left,
          }}
        >
          <div className="explain-header">
            <span>Legal Explanation</span>

            <button className="explain-close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="selected-term">"{selectedText}"</div>

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
                  onChange={(event) =>
                    onTranslationLanguageChange(event.target.value)
                  }
                >
                  <option>Hindi</option>
                  <option>Marathi</option>
                  <option>Malayalam</option>
                  <option>English</option>
                </select>

                <button
                  className="translate-button"
                  onClick={onTranslate}
                  disabled={translateLoading}
                >
                  {translateLoading ? "Translating..." : "Translate"}
                </button>
              </div>

              {translation && (
                <div className="translation-result">{translation}</div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default ExplainPopup;