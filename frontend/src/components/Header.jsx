import { AlertCircle, CheckCircle2, LoaderCircle, RefreshCw } from 'lucide-react';

function Header({ apiStatus, onRetry }) {
  const statusContent = {
    checking: {
      icon: <LoaderCircle size={14} className="api-status-spin" />,
      label: 'Checking API',
      className: 'api-status-checking',
    },
    connected: {
      icon: <CheckCircle2 size={14} />,
      label: 'Ready',
      className: 'api-status-connected',
    },
    error: {
      icon: <AlertCircle size={14} />,
      label: 'API unavailable',
      className: 'api-status-error',
    },
  }[apiStatus];

  return (
    <header className="workspace-header">
      <div>
        <p className="header-eyebrow">CUSTOMER SUPPORT WORKSPACE</p>
        <h1 className="header-title">Support inbox</h1>
        <p className="header-subtitle">A friendly place to find answers to customer questions.</p>
      </div>
      <div className="header-actions">
        <span
          className={`api-status ${statusContent.className}`}
          role="status"
          aria-live="polite"
          title={apiStatus === 'error' ? 'Start the backend with npm run dev:backend, then retry.' : undefined}
        >
          {statusContent.icon}
          {statusContent.label}
          {apiStatus === 'error' && (
            <button
              className="api-retry-button"
              type="button"
              onClick={onRetry}
              aria-label="Retry API connection"
            >
              <RefreshCw size={12} />
            </button>
          )}
        </span>
      </div>
    </header>
  );
}

export default Header;
