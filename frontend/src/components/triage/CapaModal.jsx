import React, { useState } from 'react';
import { useApp } from '../../store/AppContext.jsx';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { api } from '../../services/api.js';

export const CapaModal = () => {
  const { 
    selectedReport, 
    capaModalOpen, 
    setCapaModalOpen, 
    refreshReports, 
    showToast,
    role 
  } = useApp();

  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('Er. Rakesh Borah (Lead Mechanical)');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
  const [priority, setPriority] = useState('Critical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!capaModalOpen || !selectedReport) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const actionTitle = title || `Remediate ${selectedReport.barrier_status || 'barrier failure'} on ${selectedReport.asset}`;

    setIsSubmitting(true);
    try {
      const res = await api.escalateReport(selectedReport.id, {
        title: actionTitle,
        owner,
        due_date: dueDate,
        priority
      }, role);

      showToast(`CAPA Action #${res.capa.id} dispatched to ${owner}`);
      setCapaModalOpen(false);
      setTitle('');
      refreshReports();
    } catch (err) {
      setError(err.message || 'Failed to dispatch CAPA action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setCapaModalOpen(false);
  };

  return (
    <Modal
      isOpen={capaModalOpen}
      onClose={handleClose}
      title={`Dispatch CAPA Escalation (${selectedReport.id})`}
      footer={(
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} id="btn-submit-capa">
            {isSubmitting ? 'Dispatching...' : 'Dispatch CAPA Action'}
          </Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="capa-form">
        {error && (
          <div className="form-error-alert" role="alert">
            ⚠️ {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="capa-title-input">Corrective & Preventive Action Title *</label>
          <input
            type="text"
            id="capa-title-input"
            className="form-control"
            placeholder={`e.g. Inspect and re-weld monkey board latch bracket`}
            defaultValue={`Remediate ${selectedReport.barrier_status} on ${selectedReport.asset}`}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="capa-owner-select">Designated Action Owner *</label>
          <select
            id="capa-owner-select"
            className="form-control"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="Er. Rakesh Borah (Lead Mechanical)">Er. Rakesh Borah (Lead Mechanical Maintenance)</option>
            <option value="B. Saikia (Rig Toolpusher)">B. Saikia (Rig Toolpusher / Drilling Operations)</option>
            <option value="K. Baruah (Process Safety)">K. Baruah (Process Safety Lead)</option>
            <option value="Instrument Team Dikom">Central Instrumentation Team Dikom</option>
          </select>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="capa-date-input">Target Resolution Date *</label>
            <input
              type="date"
              id="capa-date-input"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="capa-priority-select">Action Priority</label>
            <select
              id="capa-priority-select"
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Critical">Critical (P1 - 24-48h)</option>
              <option value="High">High (P2 - 7 days)</option>
              <option value="Medium">Medium (P3 - 14 days)</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
};
