import {
  FileText,
  MessageSquare,
  Plus,
  Scale,
  Settings,
} from "lucide-react";

function Sidebar({ onNewChat }) {
  return (
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

      <button className="new-chat" onClick={onNewChat}>
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
  );
}

export default Sidebar;