import React from 'react';
import { X, Trash2, Calendar, FileText, ChevronRight } from 'lucide-react';

export default function HistorySidebar({ isOpen, onClose, historyList, onSelectHistory, onDeleteHistory, onClearHistory }) {
  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}
      
      {/* Sidebar Drawer */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Scan History</h2>
          <button className="close-btn" onClick={onClose} title="Close Panel">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          {historyList && historyList.length > 0 ? (
            <>
              <div className="sidebar-actions-top">
                <span className="count">{historyList.length} analysis saved</span>
                <button className="text-danger-btn small-btn" onClick={onClearHistory}>
                  Clear All
                </button>
              </div>
              
              <div className="history-list">
                {historyList.map((item) => (
                  <div key={item.id} className="history-item-card">
                    <div 
                      className="history-item-body"
                      onClick={() => {
                        onSelectHistory(item);
                        onClose();
                      }}
                    >
                      <div className="history-item-header">
                        <span className="history-score">{item.result?.['JD Match'] || '0%'}</span>
                        <div className="date-meta">
                          <Calendar size={12} />
                          <span>{formatDate(item.timestamp)}</span>
                        </div>
                      </div>
                      
                      <div className="history-file-name">
                        <FileText size={14} className="text-secondary" />
                        <span title={item.fileName}>{item.fileName}</span>
                      </div>

                      <div className="history-jd-preview">
                        {item.jd.substring(0, 75)}...
                      </div>
                    </div>
                    
                    <div className="history-item-footer">
                      <button 
                        className="delete-item-btn" 
                        onClick={() => onDeleteHistory(item.id)}
                        title="Delete record"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button 
                        className="load-item-btn"
                        onClick={() => {
                          onSelectHistory(item);
                          onClose();
                        }}
                      >
                        <span>View</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="sidebar-empty">
              <FileText size={48} className="text-muted" />
              <h3>No History Found</h3>
              <p>Your previous scan reports will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
