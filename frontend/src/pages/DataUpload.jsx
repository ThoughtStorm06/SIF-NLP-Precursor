import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { api } from '../services/api.js';
import { Button } from '../components/common/Button.jsx';

const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.txt', '.csv', '.docx'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const DataUpload = () => {
  const { addReport, openReport, role } = useApp();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Stats for the batch summary panel
  const totalFiles = files.length;
  const completedCount = files.filter(f => f.status === 'Complete').length;
  const processingCount = files.filter(f => ['Queued', 'Validating', 'Extracting/OCR', 'Classifying'].includes(f.status)).length;
  const rejectedCount = files.filter(f => f.status === 'Rejected').length;

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `This file type isn't supported. Please upload a PDF, an image of a handwritten form (JPG, PNG, TIFF), or a text file (TXT, CSV, DOCX).`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File exceeds the 25MB limit.`;
    }
    return null; // Valid
  };

  const processFilePipeline = async (fileId, fileObj) => {
    const updateFileStatus = (status, error = null, reportId = null) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status, error, reportId } : f));
    };

    // 1. Validating
    updateFileStatus('Validating');

    try {
      // Start API call
      const uploadPromise = api.uploadFile(fileObj, role);
      
      // Simulate UI transitions for the prototype
      setTimeout(() => {
        setFiles(prev => prev.map(f => f.id === fileId && !['Complete', 'Rejected'].includes(f.status) ? { ...f, status: 'Extracting/OCR' } : f));
      }, 600);
      setTimeout(() => {
        setFiles(prev => prev.map(f => f.id === fileId && !['Complete', 'Rejected'].includes(f.status) ? { ...f, status: 'Classifying' } : f));
      }, 1500);

      const newReport = await uploadPromise;
      
      updateFileStatus('Complete', null, newReport.id);
      addReport(newReport); // Inject into global context
    } catch (err) {
      updateFileStatus('Rejected', 'Processing failed: ' + err.message);
    }
  };

  const handleFilesAdded = (addedFiles) => {
    const newFiles = Array.from(addedFiles).map(file => {
      const error = validateFile(file);
      return {
        id: Math.random().toString(36).substr(2, 9),
        fileObj: file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        status: error ? 'Rejected' : 'Queued',
        error: error
      };
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Start processing for valid files
    newFiles.forEach(f => {
      if (f.status === 'Queued') {
        processFilePipeline(f.id, f.fileObj);
      }
    });
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Complete': return '#22c55e'; // Green
      case 'Rejected': return '#ef4444'; // Red
      case 'Queued': return '#94a3b8'; // Slate
      default: return '#3b82f6'; // Blue (Processing)
    }
  };

  return (
    <div className="page-container upload-page" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <h2>Secure Document Ingestion & Admin Upload Console</h2>
        <p className="subtitle">Upload UAR/UCR/Near-Miss forms for OCR and automated NLP classification.</p>
      </header>

      {/* Drag & Drop Zone */}
      <div 
        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
          background: isDragging ? 'rgba(234,88,12,0.05)' : 'var(--bg-surface)',
          borderRadius: '12px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '24px'
        }}
      >
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>☁️</div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Drag and drop files here, or click to browse.</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Accepted: PDF, JPG, PNG, TIFF, TXT, CSV, DOCX — up to 50 files or 200MB per batch
        </p>
      </div>

      {/* Batch Summary */}
      {totalFiles > 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          fontSize: '0.9rem'
        }}>
          <strong>Batch Summary:</strong>
          <span>{totalFiles} files total</span>
          <span style={{ color: '#22c55e' }}>• {completedCount} complete</span>
          <span style={{ color: '#3b82f6' }}>• {processingCount} processing</span>
          <span style={{ color: '#ef4444' }}>• {rejectedCount} rejected</span>
        </div>
      )}

      {/* File List */}
      <div className="upload-file-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {files.map(file => (
          <div key={file.id} style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${file.status === 'Rejected' ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ fontSize: '24px' }}>
              {file.name.endsWith('.pdf') ? '📄' : file.name.match(/\.(jpg|jpeg|png|tiff)$/i) ? '🖼️' : '📝'}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{file.size}</div>
              
              {file.status === 'Rejected' && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
                  {file.error}
                </div>
              )}
            </div>

            <div style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: `${getStatusColor(file.status)}20`,
              color: getStatusColor(file.status),
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {['Validating', 'Extracting/OCR', 'Classifying'].includes(file.status) && (
                <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              )}
              {file.status}
            </div>

            {file.status === 'Complete' && (
              <Button variant="ghost" size="sm" onClick={() => openReport(file.reportId)}>
                View Report →
              </Button>
            )}

            {file.status === 'Rejected' && (
              <button 
                onClick={() => removeFile(file.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
