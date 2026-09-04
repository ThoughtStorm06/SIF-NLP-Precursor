import React from 'react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';

export const CapaListView = ({ actions, openReport, onVerifyClick, onEscalateClick }) => {
  if (!actions || actions.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No CAPA actions found in current view.
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-surface, #ffffff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '2px solid var(--border-subtle, #e2e8f0)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              <th style={{ padding: '12px 16px' }}>CAPA ID / Priority</th>
              <th style={{ padding: '12px 16px' }}>Action Title & Source Safety Context</th>
              <th style={{ padding: '12px 16px' }}>Owner & Asset</th>
              <th style={{ padding: '12px 16px' }}>SLA Status / Aging</th>
              <th style={{ padding: '12px 16px' }}>Current Stage</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {actions.map(action => {
              const isOverdue = action.sla_hours_remaining < 0 || action.sla_status === 'Overdue';
              const isNearBreach = action.sla_hours_remaining > 0 && action.sla_hours_remaining < 6;

              return (
                <tr key={action.id} style={{ borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-primary)', marginBottom: '4px' }}>
                      {action.id}
                    </div>
                    <Badge tier={action.priority} />
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '360px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                      {action.title}
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)' }}>
                      "{action.evidence_phrase || 'Inherited precursor evidence phrase'}"
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Source: <strong>#{action.source_report}</strong></span>
                      <span style={{ color: 'var(--text-muted)' }}>• {action.energy_source}</span>
                      <span style={{ color: 'var(--text-muted)' }}>• {action.life_saving_rule}</span>
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{action.owner}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{action.asset}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>SAP WO: {action.sap_work_order || 'N/A'}</div>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: isOverdue ? 'rgba(239, 68, 68, 0.15)' : isNearBreach ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: isOverdue ? '#ef4444' : isNearBreach ? '#d97706' : '#16a34a',
                      border: `1px solid ${isOverdue ? '#ef4444' : isNearBreach ? '#f59e0b' : '#22c55e'}`
                    }}>
                      <span>{isOverdue ? '🚨' : isNearBreach ? '⏳' : '✅'}</span>
                      <span>{isOverdue ? `${Math.abs(action.sla_hours_remaining)}h Overdue` : `${action.sla_hours_remaining}h Remaining`}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Due: {action.due_date}</div>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: action.status === 'Closed & Verified' ? 'rgba(34, 197, 94, 0.15)' : action.status === 'Ready for Verification' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-subtle)',
                      color: action.status === 'Closed & Verified' ? '#16a34a' : action.status === 'Ready for Verification' ? '#2563eb' : 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {action.status}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <Button variant="secondary" size="sm" onClick={() => openReport(action.source_report)}>
                        🔍 View Report
                      </Button>

                      {action.status === 'Ready for Verification' && (
                        <Button variant="primary" size="sm" onClick={() => onVerifyClick(action)}>
                          🛡️ Review Verification
                        </Button>
                      )}

                      {(isOverdue || isNearBreach) && action.status !== 'Closed & Verified' && (
                        <Button variant="danger" size="sm" onClick={() => onEscalateClick(action)}>
                          ⚡ Notify Owner
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
