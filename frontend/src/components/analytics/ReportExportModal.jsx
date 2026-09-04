import React from 'react';
import { Button } from '../common/Button.jsx';

export const ReportExportModal = ({ isOpen, onClose, reportData }) => {
  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="drawer-backdrop show" onClick={onClose}></div>
      <div 
        className="export-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '750px',
          maxHeight: '90vh',
          background: 'var(--bg-surface-elevated, #1a1a1a)',
          color: 'var(--text-primary, #fafaf9)',
          borderRadius: '12px',
          border: '1px solid var(--border-strong, #404040)',
          boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0, 0, 0, 0.5))',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle, #262626)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface, #111111)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              📄 Board-Ready Executive Report Builder
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              PRD Requirement FR-4.10 — PDF/Excel Export Preview with Recency Stamp & Model Version
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: 'red' }}
          >
            ✕
          </button>
        </div>

        {/* Live Export Preview Surface */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: 'var(--bg-app, #000000)', color: 'var(--text-primary, #fafaf9)' }}>
          <div style={{ border: '2px solid var(--border-strong, #404040)', padding: '24px', borderRadius: '8px', background: 'var(--bg-surface-elevated, #1a1a1a)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-strong, #404040)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{reportData.organization}</h2>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.05rem', color: 'var(--accent-primary, #ea580c)' }}>{reportData.title}</h3>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div><strong>{reportData.recencyStamp}</strong></div>
                <div>Model: <strong>{reportData.modelVersion}</strong></div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle, #0a0a0a)', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem', border: '1px solid var(--border-subtle)' }}>
              <strong>Executive Summary:</strong> {reportData.summaryText}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: '6px', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL INGESTED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{reportData.totalReportsIngested.toLocaleString()}</div>
              </div>
              <div style={{ border: '1px solid var(--sif-critical-border)', background: 'var(--sif-critical-bg)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--sif-critical)' }}>CRITICAL PRECURSORS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sif-critical)' }}>{reportData.criticalPrecursors.toLocaleString()}</div>
              </div>
              <div style={{ border: '1px solid var(--sif-high-border)', background: 'var(--sif-high-bg)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--sif-high)' }}>HIGH PRECURSORS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sif-high)' }}>{reportData.highPrecursors.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              This executive report is formatted for Oil India Limited (OIL) Corporate Safety Review & Board Deck Presentations.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle, #262626)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface, #111111)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Status: Board-ready report preview loaded
          </span>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              🖨️ Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
