import React from 'react';
import { useApp } from '../../store/AppContext.jsx';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { InlineOverridePicker } from './InlineOverridePicker.jsx';
import { highlightEvidenceSpans } from '../../utils/highlightEvidence.js';
import { api } from '../../services/api.js';

export const ReportDrawer = () => {
  const {
    selectedReport,
    drawerOpen,
    closeReport,
    openNextReport,
    setOverrideModalOpen,
    setCapaModalOpen,
    refreshReports,
    showToast,
    role
  } = useApp();

  const [historyExpanded, setHistoryExpanded] = React.useState(false);
  const [auditExpanded, setAuditExpanded] = React.useState(false);
  const [activeAction, setActiveAction] = React.useState(null);

  if (!drawerOpen || !selectedReport) return null;

  const handleVerify = async () => {
    try {
      await api.verifyReport(selectedReport.id, role);
      showToast(`Report ${selectedReport.id} verified as ${selectedReport.sps_tier} SIF Precursor.`);
      refreshReports();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleTagEdit = (tagType) => {
    setActiveAction('override');
    showToast(`Editing ${tagType}. Please provide an override reason.`);
  };

  const highlightedNarrative = highlightEvidenceSpans(
    selectedReport.narrative,
    selectedReport.evidence_spans
  );

  const tierColor = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
  }[selectedReport.sps_tier] || 'var(--accent-primary)';

  return (
    /* Full-screen backdrop */
    <div
      className="modal-backdrop show"
      onClick={closeReport}
      style={{ zIndex: 200, alignItems: 'flex-start', paddingTop: '40px' }}
    >
      {/* Modal panel — stop click propagation */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          animation: 'modalPop 0.22s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-subtle)',
          }}
        >
          {/* Tier pill */}
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              background: `${tierColor}20`,
              color: tierColor,
              border: `1px solid ${tierColor}50`,
              textTransform: 'uppercase',
            }}
          >
            {selectedReport.sps_tier}
          </span>

          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            #{selectedReport.id}
          </span>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {selectedReport.type || 'SIF Precursor Report'}
          </span>

          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
              padding: '3px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            SPS&nbsp;<strong style={{ color: 'var(--text-primary)' }}>{selectedReport.sps}</strong>
          </span>

          <button
            onClick={closeReport}
            aria-label="Close report"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '22px',
              color: 'var(--text-muted)',
              lineHeight: 1,
              padding: '0 4px',
              marginLeft: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Title */}
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35 }}>
            {selectedReport.title}
          </h2>

          {/* Meta grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '10px',
            }}
          >
            {[
              { label: 'Recorded Severity', value: selectedReport.recorded_severity || 'Unknown' },
              { label: 'AI Confidence', value: selectedReport.confidence != null ? `${(selectedReport.confidence * 100).toFixed(1)}%` : 'N/A' },
              { label: 'Reported Date', value: selectedReport.timestamp },
              {
                label: 'SLA Remaining',
                value: selectedReport.sla_hours_remaining > 0 ? `${selectedReport.sla_hours_remaining}h` : 'SLA Met / Escalated',
                urgent: selectedReport.sla_hours_remaining < 4,
              },
              { label: 'Asset / Site', value: selectedReport.asset || '—' },
              { label: 'Status', value: selectedReport.status || '—' },
            ].map(({ label, value, urgent }) => (
              <div
                key={label}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: urgent ? '#ef4444' : 'var(--text-primary)' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* SPS Score Breakdown */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: `1px solid ${tierColor}40`,
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: `conic-gradient(${tierColor} ${selectedReport.sps * 3.6}deg, var(--bg-elevated) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 0 0 4px ${tierColor}18`,
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    color: tierColor,
                  }}
                >
                  {selectedReport.sps}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>SIF Potential Score (SPS)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Multi-task NLP transformer inference</div>
              </div>
            </div>

            {selectedReport.sps_breakdown && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'High Energy Severity (40%)', value: selectedReport.sps_breakdown.energy_score, color: '#ef4444' },
                  { label: 'Barrier Degradation (35%)', value: selectedReport.sps_breakdown.barrier_score, color: '#f97316' },
                  { label: 'Personnel Line of Fire (25%)', value: selectedReport.sps_breakdown.exposure_score, color: '#eab308' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 700 }}>{value} / 10</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${value * 10}%`, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Counterfactual */}
            {selectedReport.counterfactual && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: selectedReport.counterfactual.could_be_fatal ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)',
                  border: `1px solid ${selectedReport.counterfactual.could_be_fatal ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)'}`,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ color: selectedReport.counterfactual.could_be_fatal ? '#ef4444' : '#22c55e' }}>
                  {selectedReport.counterfactual.could_be_fatal
                    ? '⚠️ High Likelihood of Fatality / Permanent Disability If Unchecked'
                    : 'ℹ️ Moderate / Low Permanent Injury Probability'}
                </strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  <strong>Counterfactual Rationale:</strong> {selectedReport.counterfactual.reasoning}
                </p>
              </div>
            )}
          </div>

          {/* Taxonomy Tags */}
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Standardized Safety Taxonomy
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { label: 'Energy Source', value: `${selectedReport.energy_source} (${selectedReport.energy_level} Energy)` },
                { label: 'Exposure Vector', value: selectedReport.exposure_type },
                { label: 'Critical Barrier Status', value: selectedReport.barrier_status },
                { label: 'Life-Saving Rule (LSR)', value: selectedReport.life_saving_rule },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  onClick={() => handleTagEdit(label)}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value} <span style={{ opacity: 0.5 }}>✎</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Narrative */}
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Incident Narrative
              <span style={{ fontSize: '0.7rem', color: '#22c55e', padding: '2px 6px', background: 'rgba(34,197,94,0.1)', borderRadius: '4px', fontWeight: 700 }}>✅ Verified Evidence Highlighted</span>
            </div>
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '0.875rem',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                maxHeight: '180px',
                overflowY: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: highlightedNarrative }}
            />
          </div>

          {/* Audit Trail accordion */}
          {selectedReport.audit_trail && selectedReport.audit_trail.length > 0 && (
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
              <button
                onClick={() => setAuditExpanded(!auditExpanded)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-subtle)',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                <span>📋 Audit & Governance Trail</span>
                <span>{auditExpanded ? '▲' : '▼'}</span>
              </button>
              {auditExpanded && (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedReport.audit_trail.map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{entry.time}</span>
                      <span><strong style={{ color: 'var(--text-primary)' }}>{entry.user}:</strong> {entry.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Override Picker inline */}
          {activeAction === 'override' && (
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px' }}>
              <InlineOverridePicker
                reportId={selectedReport.id}
                onCancel={() => setActiveAction(null)}
                onConfirm={(reason) => {
                  showToast(`Override confirmed with reason: ${reason}`);
                  setActiveAction(null);
                  refreshReports();
                  closeReport();
                }}
              />
            </div>
          )}
        </div>

        {/* ── Footer actions ─────────────────────────────────── */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Button variant="ghost" onClick={openNextReport} id="btn-next-report">
            Next Report (J)
          </Button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="danger" onClick={() => setActiveAction('override')} id="btn-override-tier">
              Override (O)
            </Button>
            <Button variant="secondary" onClick={() => setCapaModalOpen(true)} id="btn-escalate-capa">
              Escalate (E)
            </Button>
            <Button variant="primary" onClick={handleVerify} id="btn-verify-report">
              Agree (✓)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
