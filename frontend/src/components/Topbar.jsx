import { Globe } from "lucide-react";

const languages = [
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिंदी" },
  { code: "Marathi", label: "मराठी" },
  { code: "Malayalam", label: "മലയാളം" },
];

function Topbar({ language, onLanguageChange }) {
  return (
    <header className="topbar">
      <div>
        <span className="topbar-title">New conversation</span>
      </div>

      <div className="language-select">
        <Globe size={16} />
        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

export default Topbar;