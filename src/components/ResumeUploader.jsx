import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

export default function ResumeUploader({ file, setFile }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF resumes are supported.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="uploader-container">
      <input
        ref={fileInputRef}
        type="file"
        id="resume-upload"
        accept=".pdf"
        className="hidden-input"
        onChange={handleFileChange}
      />
      
      {!file ? (
        <label
          htmlFor="resume-upload"
          className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="dropzone-content">
            <div className="upload-icon-container">
              <UploadCloud size={40} className="upload-icon" />
            </div>
            <h3>Upload PDF Resume</h3>
            <p className="description">Drag & drop your resume here, or click to browse</p>
            <span className="file-info-limit">Supports PDF format up to 10MB</span>
          </div>
        </label>
      ) : (
        <div className="file-details-card">
          <div className="file-icon-container">
            <FileText size={32} className="file-icon" />
          </div>
          <div className="file-meta">
            <span className="file-name" title={file.name}>{file.name}</span>
            <span className="file-size">{formatFileSize(file.size)}</span>
          </div>
          <button className="clear-btn" onClick={clearFile} title="Remove file">
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="uploader-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
