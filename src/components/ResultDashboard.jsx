import React, { useEffect, useState } from 'react';
import { Target, Search, Copy, Check, Info, FileSpreadsheet } from 'lucide-react';

export default function ResultDashboard({ result }) {
  const [copiedKeyword, setCopiedKeyword] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  const matchStr = result?.['JD Match'] || '0%';
  const matchNumber = parseInt(matchStr.replace(/[^0-9]/g, ''), 10) || 0;

  useEffect(() => {
    setAnimatedScore(0);
    const duration = 1400;
    const startTime = performance.now();
    const animate = (t) => {
      const progress = Math.min((t - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setAnimatedScore(Math.round(ease * matchNumber));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [matchNumber]);

  const getScoreStatus = (score) => {
    if (score >= 80) return { text: 'Excellent Match', cls: 'score-excellent' };
    if (score >= 60) return { text: 'Good Match',      cls: 'score-good'      };
    if (score >= 40) return { text: 'Moderate Match',  cls: 'score-moderate'  };
    return              { text: 'Needs Work',          cls: 'score-weak'      };
  };

  const status = getScoreStatus(matchNumber);

  const copyKeyword = (kw) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 1500);
  };

  return (
    <div className="dashboard-grid fade-in">

      {/* ── Score Card ── */}
      <div className="dashboard-card score-card">
        {/* Left: big number */}
        <div className="gauge-container">
          <span className={`score-number-large ${status.cls}`}>{animatedScore}<span style={{fontSize:'1.4rem',letterSpacing:0}}>%</span></span>
          <span className="score-label-tag">ATS Score</span>
        </div>

        {/* Right: track + verdict */}
        <div className="score-right">
          <div className="score-track-container">
            <div className="score-track-labels">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
            <div className="score-track">
              <div
                className={`score-track-fill ${status.cls}`}
                style={{ width: `${animatedScore}%` }}
              />
            </div>
          </div>

          <div className="score-verdict-row">
            <span className={`verdict-pill ${status.cls}`}>{status.text}</span>
          </div>

          <p className="score-sub-text">
            Your resume aligns with <strong>{matchNumber}%</strong> of the
            requirements in this job description. Address the missing keywords
            below to raise your score.
          </p>
        </div>
      </div>

      {/* ── Profile Summary ── */}
      <div className="dashboard-card">
        <div className="card-header">
          <Target size={15} className="text-primary" />
          <h2>Profile Analysis</h2>
        </div>
        <p className="profile-summary-text">{result?.['Profile Summary']}</p>
      </div>

      {/* ── Missing Keywords ── */}
      <div className="dashboard-card">
        <div className="card-header">
          <Search size={15} className="text-secondary" />
          <h2>Missing Keywords</h2>
        </div>

        {result?.['MissingKeywords']?.length > 0 ? (
          <>
            <p className="small text-muted mb-3">
              Add these terms naturally in your experience bullets to pass filters:
            </p>
            <div className="keywords-tags">
              {result['MissingKeywords'].map((kw, i) => (
                <div key={i} className="keyword-tag">
                  <span>{kw}</span>
                  <div className="tag-actions">
                    <button onClick={() => copyKeyword(kw)} className="tag-action-btn" title="Copy">
                      {copiedKeyword === kw
                        ? <Check size={11} className="text-success" />
                        : <Copy size={11} />}
                    </button>
                    <a
                      href={`https://www.google.com/search?q=how+to+add+${encodeURIComponent(kw)}+to+resume`}
                      target="_blank" rel="noreferrer"
                      className="tag-action-btn" title="Learn more"
                    >
                      <Info size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="success-state">
            <Check size={28} className="text-success" />
            <h3>All Keywords Present</h3>
            <p className="text-muted small">Your resume covers all critical keywords in this JD.</p>
          </div>
        )}
      </div>

      {/* ── Recommendations ── */}
      <div className="dashboard-card">
        <div className="card-header">
          <FileSpreadsheet size={15} className="text-primary" />
          <h2>Recommendations</h2>
        </div>
        <ul className="recommendations-list">
          {(result?.['Recommendations'] || []).map((rec, i) => (
            <li key={i} className="recommendation-item">
              <div className="bullet">0{i + 1}</div>
              <div className="text">{rec}</div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
