import React, { useState } from 'react';
import { useApp } from '../../store/AppContext.jsx';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { api } from '../../services/api.js';

export const OverrideModal = () => {
  const { 
    selectedReport, 
    overrideModalOpen, 
    setOverrideModalOpen, 
    refreshReports, 
    showToast,
    role 
  } = useApp();

  const [newTier, setNewTier] = useState('High');
  const [reason, setReason] = useState('Mitigating Context Not Captured');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!overrideModalOpen || !selectedReport) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validation: mandatory minimum 10 chars notes
    if (!notes || notes.trim().length < 10) {
      setError('Audit compliance violation: Mandatory justification notes must be at least 10 characters long (PRD Section 11).');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.overrideReport(selectedReport.id, { newTier, reason, notes }, role);
      showToast(`SIF Tier overridden to ${newTier} for report ${selectedReport.id}`);
      setOverrideModalOpen(false);
      setNotes('');
      refreshReports();
    } catch (err) {
      setError(err.message || 'Failed to submit override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setOverrideModalOpen(false);
  };

  return (
    <Modal
      isOpen={overrideModalOpen}
      onClose={handleClose}
      title={`Human Override: SIF Tier (${selectedReport.id})`}
      footer={(
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting} id="btn-submit-override">
            {isSubmitting ? 'Submitting...' : 'Confirm Override'}
          </Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="override-form">
        <div className="current-tier-display">
          <span>Current Assigned AI Tier:</span>
          <strong>{selectedReport.sps_tier} (SPS: {selectedReport.sps})</strong>
        </div>

        {error && (
          <div className="form-error-alert" id="override-error-msg" role="alert">
            ⚠️ {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="override-tier-select">Target SIF Classification Tier *</label>
          <select 
            id="override-tier-select"
            value={newTier} 
            onChange={(e) => setNewTier(e.target.value)}
            className="form-control"
          >
            <option value="Critical">Critical SIF Precursor (SPS 85-100)</option>
            <option value="High">High SIF Precursor (SPS 70-84)</option>
            <option value="Medium">Medium Severity (SPS 45-69)</option>
            <option value="Low">Low / Pure Housekeeping (SPS 0-44)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="override-reason-select">Override Justification Category *</label>
          <select
            id="override-reason-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="form-control"
          >
            <option value="Mitigating Context Not Captured">Physical barrier was active but unmentioned in text</option>
            <option value="False Positive Hazard Keywords">Narrative described past training, not active incident</option>
            <option value="Underestimated Energy Level">High pressure line rating exceeds initial estimate</option>
            <option value="DGMS / OISD Regulatory Flag">Mandatory escalation under statutory safety rule</option>
            <option value="Other Safety Engineering Rationale">Other Field Safety Engineering rationale</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="override-notes-input">
            Mandatory Justification Notes (Min. 10 chars) *
          </label>
          <textarea
            id="override-notes-input"
            rows="4"
            className="form-control"
            placeholder="Explain why the AI model's assessment requires modification for audit trail..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <small className="form-hint">
            Characters entered: {notes.trim().length} / 10 required.
          </small>
        </div>
      </form>
    </Modal>
  );
};
