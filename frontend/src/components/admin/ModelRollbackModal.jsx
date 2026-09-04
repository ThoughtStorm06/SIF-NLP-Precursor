import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';

export const ModelRollbackModal = ({ isOpen, onClose, targetModel, currentProductionModel, onRollbackConfirm }) => {
  const [rationale, setRationale] = useState('');
  const [actorName, setActorName] = useState('R. Kalita (MLOps Lead)');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !targetModel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rationale.trim()) return;
    setSubmitting(true);
    try {
      await onRollbackConfirm({
        targetVersionId: targetModel.id,
        rationale: rationale.trim(),
        actor: actorName.trim()
      });
      setRationale('');
      onClose();
    } catch (err) {
      console.error('Rollback error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚠️ Emergency Model Rollback (PRD FR-6.6)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ef4444' }}>
            Initiating Rollback to Version: {targetModel.id} ({targetModel.name})
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Per PRD FR-6.6, rollback restores the previous verified model version to Production in ≤ 2 steps as an incident response action.
          </div>
        </div>

        {/* What Changes Preview (PRD FR-6.6) */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px' }}>
            🔍 "What Changes" Metric Preview
          </div>
          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', paddingBottom: '6px' }}>Metric</th>
                <th style={{ textAlign: 'center', paddingBottom: '6px' }}>Active Production ({currentProductionModel?.id || 'Current'})</th>
                <th style={{ textAlign: 'center', paddingBottom: '6px' }}>Target Version ({targetModel.id})</th>
                <th style={{ textAlign: 'right', paddingBottom: '6px' }}>Diff</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 0', fontWeight: 600 }}>F1 Score</td>
                <td style={{ textAlign: 'center' }}>{currentProductionModel?.f1_score || 89.2}%</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{targetModel.f1_score}%</td>
                <td style={{ textAlign: 'right', color: targetModel.f1_score >= (currentProductionModel?.f1_score || 89.2) ? '#10b981' : '#f59e0b' }}>
                  {(targetModel.f1_score - (currentProductionModel?.f1_score || 89.2)).toFixed(1)}pp
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 0', fontWeight: 600 }}>Precision</td>
                <td style={{ textAlign: 'center' }}>{currentProductionModel?.precision || 90.5}%</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{targetModel.precision}%</td>
                <td style={{ textAlign: 'right', color: targetModel.precision >= (currentProductionModel?.precision || 90.5) ? '#10b981' : '#f59e0b' }}>
                  {(targetModel.precision - (currentProductionModel?.precision || 90.5)).toFixed(1)}pp
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 600 }}>Recall</td>
                <td style={{ textAlign: 'center' }}>{currentProductionModel?.recall || 88.0}%</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{targetModel.recall}%</td>
                <td style={{ textAlign: 'right', color: targetModel.recall >= (currentProductionModel?.recall || 88.0) ? '#10b981' : '#f59e0b' }}>
                  {(targetModel.recall - (currentProductionModel?.recall || 88.0)).toFixed(1)}pp
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mandatory Rationale Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
              Executing Authority / MLOps Lead
            </label>
            <input
              type="text"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
              Rollback Rationale & Incident Context <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="State reason for emergency rollback (e.g. Rollback initiated due to prediction drift anomaly detected in latest production model batch)..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                resize: 'vertical'
              }}
              required
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Logged immutably to the Governance Audit Trail and communicated to Administration users.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={!rationale.trim() || submitting}>
              {submitting ? 'Executing Rollback...' : 'Execute Emergency Rollback'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
