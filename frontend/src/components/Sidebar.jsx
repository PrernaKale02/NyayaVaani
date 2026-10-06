import {
  FileText,
  MessageSquare,
  Plus,
  Scale,
  Settings,
} from "lucide-react";

function Sidebar({ onNewChat, user, onLogout }) {
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

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user?.email}
            </div>
            <div className="sidebar-user-label">
              Signed in
            </div>
          </div>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;