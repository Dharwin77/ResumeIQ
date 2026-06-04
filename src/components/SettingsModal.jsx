import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, Key, AlertTriangle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, currentKey, currentModel, onSave }) {
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [model, setModel] = useState(currentModel || 'llama-3.3-70b-versatile');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(currentKey || '');
    setModel(currentModel || 'llama-3.3-70b-versatile');
  }, [currentKey, currentModel, isOpen]);

  const handleSave = (e) => {
    e.preventDefault();
    onSave({ apiKey: apiKey.trim(), model });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in">
        <div className="modal-header">
          <div className="modal-title">
            <Key size={18} className="text-primary" />
            <h2>Settings</h2>
          </div>
          <button className="close-btn" onClick={onClose} title="Close Settings">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="model-select">AI Model (Groq — Free Tier)</label>
              <select
                id="model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="form-input"
              >
                <option value="llama-3.3-70b-versatile">(Recommended) LLaMA 3.3 70B — Best Quality</option>
                <option value="llama3-70b-8192">LLaMA 3 70B — Fast & Accurate</option>
                <option value="llama3-8b-8192">LLaMA 3 8B — Ultra Fast</option>
                <option value="gemma2-9b-it">Gemma 2 9B — Google Open Model</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B — Large Context</option>
              </select>
              <p className="field-help">
                All models run on Groq's free tier with ultra-low latency. LLaMA 3.3 70B gives the most accurate ATS analysis.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="api-key-input">
                Groq API Key
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="get-key-link">
                  Get free key →
                </a>
              </label>
              <div className="api-input-wrapper">
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentKey ? '••••••••••••••••••••••••••••••••' : 'gsk_...your_groq_api_key'}
                  className="form-input key-input"
                />
                <button
                  type="button"
                  className="toggle-visibility-btn"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="field-help">
                Your Groq key starts with <code>gsk_</code>. Get one free at{' '}
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">console.groq.com/keys</a>.
                It is stored locally in your browser only.
              </p>
            </div>

            {!apiKey && (
              <div className="alert alert-info">
                <AlertTriangle size={16} />
                <span>Using server .env key. Enter your own key above to override it.</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-center">
              <Save size={16} className="mr-1" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
