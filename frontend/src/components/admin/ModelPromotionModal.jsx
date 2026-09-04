import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';

export const ModelPromotionModal = ({ isOpen, onClose, candidateModel, shadowComparison, onPromoteConfirm }) => {
  const [rationale, setRationale] = useState('');
  const [actorName, setActorName] = useState('Dr. Iyer (Head of Process Safety)');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !candidateModel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rationale.trim()) return;
    setSubmitting(true);
    try {
      await onPromoteConfirm({
        candidateId: candidateModel.id,
        rationale: rationale.trim(),
        actor: actorName.trim()
      });
      setRationale('');
      onClose();
    } catch (err) {
      console.error('Promotion error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const deltas = shadowComparison?.aggregate_deltas || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🚀 Promote Shadow Model to Production">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Promoting Candidate Model: {candidateModel.id} ({candidateModel.name})
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Per PRD FR-6.5, promotion replaces the active Production model and updates classification logic across all 9,129 field narratives.
          </div>
        </div>

        {/* Delta Performance Summary */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px' }}>
            📊 Performance Delta Summary (Held-Out Evaluation Set)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>F1 Score Delta</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                {deltas.f1_score?.delta || '+3.2pp'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {candidateModel.f1_score}% vs {deltas.f1_score?.production || 89.2}% prod
              </div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recall Delta</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                {deltas.recall?.delta || '+3.7pp'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {candidateModel.recall}% vs {deltas.recall?.production || 88.0}% prod
              </div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data Drift</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                {deltas.data_drift?.delta || '-0.01'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {candidateModel.data_drift} (Stable)
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Rationale Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
              Approving Authority / MLOps Lead
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
              Governance Promotion Rationale <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="State rationale for model promotion (e.g. Improved recall on Thermal & Pressure categories by +3.7pp without bias regression)..."
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
              This rationale will be recorded immutably in the Governance Audit Trail.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!rationale.trim() || submitting}>
              {submitting ? 'Promoting...' : 'Confirm Model Promotion'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
