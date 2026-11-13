import { FileText, Headphones, MessageCircle, Plus } from 'lucide-react';

function Sidebar({ onNewChat }) {
  return (
    <aside className="app-sidebar">
      <a className="sidebar-brand" href="#" aria-label="QueryCare home">
        <span className="sidebar-brand-mark"><Headphones size={21} strokeWidth={2.2} /></span>
        <span>
          <span className="sidebar-brand-name">QueryCare</span>
          <span className="sidebar-brand-caption">Customer care, made clear</span>
        </span>
      </a>

      <button className="btn new-chat-button" type="button" onClick={onNewChat}>
        <Plus size={17} strokeWidth={2.4} />
        New chat
      </button>

      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <a className="sidebar-link sidebar-link-active" href="#chat-area">
          <MessageCircle size={17} />
          <span>Chat</span>
          <span className="nav-current-dot" />
        </a>
        <a className="sidebar-link" href="#documents">
          <FileText size={17} />
          <span>Documents</span>
        </a>
      </nav>

    </aside>
  );
}

export default Sidebar;
