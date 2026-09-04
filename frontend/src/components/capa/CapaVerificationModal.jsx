import React, { useState } from 'react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';

export const CapaVerificationModal = ({ isOpen, onClose, action, onVerify, onReopen }) => {
  const [comment, setComment] = useState('');
  const [mode, setMode] = useState('verify'); // 'verify' or 'reopen'

  if (!isOpen || !action) return null;

  const handleSubmit = () => {
    if (mode === 'verify') {
      onVerify(action.id, comment);
    } else {
      if (!comment.trim()) {
        alert('Please provide a reason for reopening this action.');
        return;
      }
      onReopen(action.id, comment);
    }
  };

  return (
    <>
      <div className="drawer-backdrop show" onClick={onClose} />
      <div 
        className="modal-container"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '650px',
          background: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, #cbd5e1)',
          boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0,0,0,0.3))',
          zIndex: 1100,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'var(--bg-subtle, #f8fafc)',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                Second-Reviewer Closure Verification (FR-5.6)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Segregation of duties check — Verify physical completion before final archival.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Action Header Card */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px', background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{action.id}</span>
              <Badge tier={action.priority} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700 }}>{action.title}</h4>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Asset: <strong>{action.asset}</strong> | Owner: <strong>{action.owner}</strong>
            </div>
          </div>

          {/* Inherited Source-Report Context Strip (FR-5.4) */}
          <div style={{
            borderLeft: '4px solid var(--accent-primary, #2563eb)',
            background: 'var(--bg-subtle, #f1f5f9)',
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '4px' }}>
              📌 Inherited Source Report Context (Report #{action.source_report})
            </div>
            <div style={{ fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: '6px' }}>
              "{action.evidence_phrase || 'High energy precursor barrier degradation requiring physical repair.'}"
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
              <span style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>⚡ {action.energy_source}</span>
              <span style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>🚧 {action.barrier_status}</span>
              <span style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>🛡️ {action.life_saving_rule}</span>
            </div>
          </div>

          {/* Owner Completion Summary ("What Changed") */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px', background: 'var(--bg-surface)' }}>
            <h5 style={{ margin: '0 0 6px 0', fontSize: '0.875rem', fontWeight: 700, color: '#059669' }}>
              ✅ Action Owner Completion Statement:
            </h5>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: '6px', fontStyle: 'italic' }}>
              "{action.owner_notes || 'Corrective barrier repairs completed and verified on site. Attached SAP WO completion certificate.'}"
            </div>
          </div>

          {/* Verification Mode Selector & Comments */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
              Verification Action:
            </label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <button 
                type="button"
                onClick={() => setMode('verify')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: `2px solid ${mode === 'verify' ? '#059669' : 'var(--border-subtle)'}`,
                  background: mode === 'verify' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-subtle)',
                  color: mode === 'verify' ? '#059669' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✅ Verify & Close Action
              </button>
              <button 
                type="button"
                onClick={() => setMode('reopen')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: `2px solid ${mode === 'reopen' ? '#dc2626' : 'var(--border-subtle)'}`,
                  background: mode === 'reopen' ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-subtle)',
                  color: mode === 'reopen' ? '#dc2626' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ↩️ Reopen for Revision
              </button>
            </div>

            <textarea 
              rows={3}
              placeholder={mode === 'verify' ? "Optional second-reviewer verification notes..." : "Required reason for reopening this action..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--bg-subtle, #f8fafc)',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            variant={mode === 'verify' ? 'primary' : 'danger'}
            onClick={handleSubmit}
          >
            {mode === 'verify' ? 'Confirm Closure (✓)' : 'Submit Reopen Request'}
          </Button>
        </div>
      </div>
    </>
  );
};
