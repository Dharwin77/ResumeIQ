import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ResumeUploader from './components/ResumeUploader';
import ResultDashboard from './components/ResultDashboard';
import HistorySidebar from './components/HistorySidebar';
import { Sparkles, Play, RotateCcw, AlertTriangle, ChevronDown, CheckCircle, ExternalLink, Clock, ScanSearch } from 'lucide-react';

import confetti from 'canvas-confetti';

// Pre-populated Sample Job Descriptions for ease of testing
const SAMPLE_JDS = [
  {
    title: "Senior Full Stack Engineer",
    text: "Position: Senior Full Stack Engineer\n\nRequired Technical Skills:\n- Front-end: React, TypeScript, TailwindCSS, HTML5, CSS3\n- Back-end: Node.js, Express, REST APIs, GraphQL\n- Database: PostgreSQL, MongoDB, Redis\n- Cloud & DevOps: Docker, AWS (S3, EC2, ECS), CI/CD pipelines, GitHub Actions\n- Methods: Agile, Scrum, TDD, Clean Architecture\n\nResponsibilities:\n- Build robust, scalable web applications using React and Node.js.\n- Design and implement efficient database schemas and write optimized queries.\n- Collaborate with product managers and designers to deliver premium user interfaces.\n- Mentor junior developers and maintain high code quality through code reviews."
  },
  {
    title: "Data Scientist / Machine Learning Engineer",
    text: "Position: Data Scientist / Machine Learning Engineer\n\nRequired Technical Skills:\n- Languages: Python, SQL, R\n- ML Frameworks: PyTorch, TensorFlow, Scikit-Learn\n- Big Data & Data Warehouses: Spark, Hadoop, Snowflake\n- Core Skills: Feature Engineering, NLP, Linear Regression, Random Forests, Deep Learning\n- Tools: Jupyter, Git, Docker, Kubernetes\n\nResponsibilities:\n- Clean, preprocess, and analyze complex unstructured datasets.\n- Build, train, validate, and deploy predictive ML models in production.\n- Implement Natural Language Processing (NLP) models to extract insights from text data.\n- Communicate model metrics and findings to cross-functional business stakeholders."
  },
  {
    title: "DevOps & Cloud Engineer",
    text: "Position: DevOps & Cloud Infrastructure Engineer\n\nRequired Technical Skills:\n- Infrastructure: AWS (VPC, IAM, CloudFormation, Route53), Terraform\n- Containerization: Docker, Kubernetes, Helm\n- CI/CD: Jenkins, GitLab CI, GitHub Actions\n- Scripting: Bash, Python, Go\n- Monitoring: Prometheus, Grafana, ELK Stack\n- Security: SSL/TLS, Vault, AWS Security Groups\n\nResponsibilities:\n- Maintain and optimize cloud infrastructure and system reliability.\n- Automate CI/CD pipelines for zero-downtime microservice deployments.\n- Manage Kubernetes clusters and containerized applications in staging and production.\n- Implement monitoring, alerting, and performance tuning solutions."
  }
];

export default function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [quotaError, setQuotaError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showJdDropdown, setShowJdDropdown] = useState(false);

  const [model] = useState('llama-3.3-70b-versatile');
  const [historyList, setHistoryList] = useState(() => {
    try {
      const saved = localStorage.getItem('ats_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSelectHistory = (historyItem) => {
    setResult(historyItem.result);
    setJd(historyItem.jd);
    // Note: PDF files cannot be easily recreated from buffer in browser file state,
    // so we just show the results directly.
    setFile({ name: historyItem.fileName, size: 0 }); 
    setError('');
  };

  const handleDeleteHistory = (id) => {
    const updated = historyList.filter(item => item.id !== id);
    setHistoryList(updated);
    localStorage.setItem('ats_history', JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all analysis history?')) {
      setHistoryList([]);
      localStorage.removeItem('ats_history');
    }
  };

  const selectSampleJd = (sample) => {
    setJd(sample.text);
    setShowJdDropdown(false);
  };

  // Run ATS analysis
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF resume.');
      return;
    }
    if (!jd.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setLoading(true);
    setError('');
    setQuotaError(null);
    setResult(null);

    // Simulate backend loading stages for smoother UX
    const stages = [
      'Reading PDF file...',
      'Extracting resume text content...',
      'Formatting Job Description...',
      'Initiating Groq AI analysis...',
      'Scoring match and extracting keywords...',
      'Finalizing recommendations...'
    ];

    let stageIdx = 0;
    setLoadingStage(stages[0]);
    const stageInterval = setInterval(() => {
      if (stageIdx < stages.length - 1) {
        stageIdx++;
        setLoadingStage(stages[stageIdx]);
      }
    }, 1500);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jd', jd);
    formData.append('model', model);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      // Handle quota exceeded specifically
      if (response.status === 429 || data.error === 'QUOTA_EXCEEDED') {
        setQuotaError(data);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Server error during analysis.');
      }

      setResult(data);
      clearInterval(stageInterval);

      // Trigger Confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#3b82f6', '#10b981']
      });

      // Save to History
      const newHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        fileName: file.name,
        jd: jd,
        result: data
      };
      
      const updatedHistory = [newHistoryItem, ...historyList];
      setHistoryList(updatedHistory);
      localStorage.setItem('ats_history', JSON.stringify(updatedHistory));

    } catch (err) {
      setError(err.message || 'An error occurred. Check your network or API Key.');
    } finally {
      clearInterval(stageInterval);
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setJd('');
    setResult(null);
    setError('');
    setQuotaError(null);
  };

  return (
    <div className="app-wrapper">
      <Header
        onToggleHistory={() => setShowHistory(!showHistory)}
        currentModel={model}
        hasHistory={historyList.length > 0}
      />

      <main className="app-container">
        {/* Main Interface Layout */}
        <div className="layout-grid">
          {/* Form Side */}
          <div className="form-column">
            <div className="dashboard-card main-form-card">
              <div className="card-header-main">
                <div className="title-area">
                  <h2><Sparkles />Analyze Resume</h2>
                  <p>AI-powered ATS compatibility check</p>
                </div>
                <button className="reset-btn" onClick={handleReset} title="Clear inputs">
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>

              <form onSubmit={handleAnalyze} className="ats-form">
                {/* PDF Resume Uploader */}
                <div className="form-section">
                <label className="section-label">01 — Resume PDF</label>
                  <ResumeUploader file={file} setFile={setFile} />
                </div>

                {/* Job Description Area */}
                <div className="form-section">
                  <div className="jd-header-row">
                    <label className="section-label">02 — Job Description</label>
                    <div className="jd-sample-dropdown-container">
                      <button
                        type="button"
                        className="jd-dropdown-toggle-btn"
                        onClick={() => setShowJdDropdown(!showJdDropdown)}
                      >
                        <span>Insert Sample JD</span>
                        <ChevronDown size={14} />
                      </button>
                      
                      {showJdDropdown && (
                        <div className="jd-dropdown-menu">
                          {SAMPLE_JDS.map((sample, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="jd-dropdown-item"
                              onClick={() => selectSampleJd(sample)}
                            >
                              {sample.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <textarea
                    className="jd-textarea"
                    placeholder="Paste the target job description here..."
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    rows={13}
                  />
                  <div className="textarea-footer">
                    <span>{jd.length} characters</span>
                    <span>Supports copy/paste formatting</span>
                  </div>
                </div>




                {/* Quota Error Panel */}
                {quotaError && (
                  <div className="quota-error-panel fade-in">
                    <div className="quota-error-header">
                      <AlertTriangle size={20} className="text-warning" />
                      <h3>API Quota Exceeded</h3>
                    </div>
                    <p className="quota-error-msg">{quotaError.message}</p>
                    <div className="quota-steps">
                      {(quotaError.details || []).map((step, i) => (
                        <div key={i} className="quota-step">
                          <span className="quota-step-num">{i + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div className="quota-links">
                      <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="quota-link-btn">
                        <ExternalLink size={14} />
                        Groq Keys Console
                      </a>
                      <a href="https://console.groq.com/settings/limits" target="_blank" rel="noreferrer" className="quota-link-btn secondary">
                        <ExternalLink size={14} />
                        View Limits
                      </a>
                    </div>
                  </div>
                )}

                {/* Generic Error Banner */}
                {error && !quotaError && (
                  <div className="alert alert-danger fade-in">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  className={`submit-btn ${loading ? 'btn-loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading-spinner-container">
                      <div className="loading-spinner"></div>
                      <span>{loadingStage}</span>
                    </div>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Run ATS Scan</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Side */}
          <div className="results-column">
            {result ? (
              <div className="results-display-area">
                <div className="results-header-banner">
                  <CheckCircle className="text-success" />
                  <div>
                    <h3>Analysis Complete</h3>
                  </div>
                </div>
                <ResultDashboard result={result} />
              </div>
            ) : (
              <div className="results-placeholder flex-center">
                <div className="placeholder-content">
                  <div className="placeholder-icon-ring">
                    <ScanSearch size={26} className="placeholder-icon" />
                  </div>
                  <h3>Awaiting Analysis</h3>
                  <p>Upload your resume and paste a job description, then click <strong>Run ATS Scan</strong>.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* History Sidebar Panel */}
      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        historyList={historyList}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearHistory={handleClearHistory}
      />

    </div>
  );
}
