import React from 'react';
import { History, ScanSearch } from 'lucide-react';

export default function Header({ onToggleHistory, currentModel, hasHistory }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-icon">
          <ScanSearch />
        </div>
        <div className="logo-text">
          <h1>Resume<span>IQ</span></h1>
        </div>
      </div>

      <div className="header-actions">

        <button className="icon-btn" onClick={onToggleHistory} title="Scan History">
          <History />
          {hasHistory && <span className="badge-indicator" />}
        </button>
      </div>
    </header>
  );
}
