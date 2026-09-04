import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { api } from '../services/api.js';
import { CapaVerificationModal } from '../components/capa/CapaVerificationModal.jsx';
import { CapaListView } from '../components/capa/CapaListView.jsx';

export const CapaTracker = () => {
  const { openReport, showToast, role } = useApp();
  const [actions, setActions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Controls
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [ownerMode, setOwnerMode] = useState(false); // Owner-simplified view toggle (FR-5.8)
  const [filterSla, setFilterSla] = useState('all'); // 'all', 'overdue', 'near_breach', 'verification'
  const [dismissBanner, setDismissBanner] = useState(false);

  // Verification Modal state
  const [verifyingAction, setVerifyingAction] = useState(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  const fetchCapaData = async () => {
    try {
      const [actionsData, summaryData] = await Promise.all([
        api.getCapaActions(),
        api.getCapaSummary()
      ]);
      setActions(actionsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load CAPA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapaData();
  }, []);

  const handleAdvanceStatus = async (id, currentStatus) => {
    let nextStatus = currentStatus;
    if (currentStatus === 'In Progress') nextStatus = 'Ready for Verification';
    else if (currentStatus === 'Ready for Verification') nextStatus = 'Closed & Verified';

    try {
      await api.updateCapaStatus(id, nextStatus);
      showToast(`CAPA #${id} moved to '${nextStatus}'`);
      fetchCapaData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleVerifyClick = (action) => {
    setVerifyingAction(action);
    setVerificationModalOpen(true);
  };

  const handleConfirmVerification = async (id, comment) => {
    try {
      await api.verifyCapaClosure(id, comment);
      showToast(`CAPA #${id} closure verified and closed on-time.`);
      setVerificationModalOpen(false);
      setVerifyingAction(null);
      fetchCapaData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleConfirmReopen = async (id, reason) => {
    try {
      await api.reopenCapaAction(id, reason);
      showToast(`CAPA #${id} reopened for revision. Reason attached.`);
      setVerificationModalOpen(false);
      setVerifyingAction(null);
      fetchCapaData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleEscalateClick = async (action) => {
    try {
      await api.escalateCapaAction(action.id, 'SLA Near Breach Alert');
      showToast(`⚡ Urgency notification sent to ${action.owner} for CAPA #${action.id}`);
      fetchCapaData();
    } catch (err) {
      showToast(err.message);
    }
  };

  // Filter actions based on SLA selection
  const filteredActions = actions.filter(a => {
    if (filterSla === 'overdue') return a.sla_hours_remaining < 0 || a.sla_status === 'Overdue';
    if (filterSla === 'near_breach') return a.sla_hours_remaining > 0 && a.sla_hours_remaining < 6;
    if (filterSla === 'verification') return a.status === 'Ready for Verification';
    return true;
  });

  const columns = [
    { id: 'in_progress', label: 'In Progress / Assigned', status: 'In Progress' },
    { id: 'verification', label: 'Ready for Verification', status: 'Ready for Verification' },
    { id: 'closed', label: 'Closed & Verified', status: 'Closed & Verified' }
  ];

  const overdueCriticalCount = summary?.overdueCriticalCount || actions.filter(a => a.priority === 'Critical' && (a.sla_hours_remaining < 0 || a.sla_status === 'Overdue')).length;

  if (loading) {
    return <div className="view-container" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading CAPA Tracker & SLA Intelligence...</div>;
  }

  return (
    <div className="view-container page-capa-tracker" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              CAPA Tracking & Closure Governance
            </h2>
            <Badge variant="primary">Module 5 PRD 26165-PRD-SIF-NLP-05-M5</Badge>
          </div>
          <p className="subtitle" style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Closure Governance — Ensuring SIF barrier repairs close within SLA (24–48 hrs) with verified completion.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Owner Simplified View Toggle (FR-5.8) */}
          <button 
            onClick={() => setOwnerMode(!ownerMode)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: `1px solid ${ownerMode ? '#3b82f6' : 'var(--border-subtle)'}`,
              background: ownerMode ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
              color: ownerMode ? '#3b82f6' : 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>👤</span> {ownerMode ? 'Full Manager View Mode' : 'Owner-Simplified View Mode'}
          </button>

          {/* Kanban vs List View Switcher (FR-5.9) */}
          <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
            <button 
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'kanban' ? 'var(--accent-primary, #2563eb)' : 'var(--bg-surface)',
                color: viewMode === 'kanban' ? '#fff' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              📊 Kanban Board
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'list' ? 'var(--accent-primary, #2563eb)' : 'var(--bg-surface)',
                color: viewMode === 'list' ? '#fff' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              📋 Table List View
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Persistent Overdue Critical Alert Banner (FR-5.2) */}
      {overdueCriticalCount > 0 && !dismissBanner && (
        <div 
          className="sla-overdue-alert-banner"
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.25) 100%)',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🚨</span>
            <div>
              <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.95rem' }}>
                URGENT SLA BREACH: {overdueCriticalCount} Critical CAPA Action(s) Overdue
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Per parent PRD KPI target (≥ 95% SLA closure within 24–48 hrs). Action owner notifications active.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button variant="danger" size="sm" onClick={() => setFilterSla('overdue')}>
              Filter Overdue Items
            </Button>
            <button 
              onClick={() => setDismissBanner(true)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
              title="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SLA Health KPI Counter Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL CAPA ACTIONS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{summary?.totalActions || actions.length}</div>
        </div>

        <div 
          onClick={() => setFilterSla(filterSla === 'overdue' ? 'all' : 'overdue')}
          style={{
            background: filterSla === 'overdue' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>OVERDUE ACTIONS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{summary?.overdueCriticalCount || 1}</div>
        </div>

        <div 
          onClick={() => setFilterSla(filterSla === 'near_breach' ? 'all' : 'near_breach')}
          style={{
            background: filterSla === 'near_breach' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
            border: '1px solid #f59e0b',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>NEAR BREACH (&lt; 6 HRS)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{summary?.nearBreachCount || 1}</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>ON-TIME CLOSURE RATE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{summary?.onTimeRate || '95%'}</div>
        </div>
      </div>

      {/* Main View Area: Kanban vs List View */}
      {viewMode === 'list' ? (
        <CapaListView 
          actions={filteredActions} 
          openReport={openReport}
          onVerifyClick={handleVerifyClick}
          onEscalateClick={handleEscalateClick}
        />
      ) : (
        /* Side-by-Side 3-Column Kanban Board with Persistent Context Strips (FR-5.4) & SLA Progress (FR-5.1) */
        <div 
          className="kanban-board"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '16px',
            alignItems: 'flex-start',
            width: '100%'
          }}
        >
          {columns.map(col => {
            const colActions = filteredActions.filter(a => a.status === col.status);

            return (
              <div 
                key={col.id} 
                className="kanban-column"
                style={{
                  background: 'var(--bg-surface, #ffffff)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '18px',
                  minHeight: '440px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div 
                  className="kanban-col-header"
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '14px',
                    marginBottom: '16px',
                    borderBottom: '2px solid var(--border-subtle, #e2e8f0)'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {col.label}
                  </h3>
                  <span 
                    className="col-count"
                    style={{
                      background: 'var(--bg-subtle, #f1f5f9)',
                      color: 'var(--accent-primary, #2563eb)',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    {colActions.length}
                  </span>
                </div>

                <div className="kanban-card-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {colActions.length === 0 ? (
                    <div 
                      className="kanban-empty"
                      style={{
                        padding: '28px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted, #64748b)',
                        fontSize: '0.85rem',
                        fontStyle: 'italic',
                        border: '1px dashed var(--border-subtle, #cbd5e1)',
                        borderRadius: '8px',
                        background: 'var(--bg-subtle, #f8fafc)'
                      }}
                    >
                      No actions in this stage.
                    </div>
                  ) : (
                    colActions.map(action => {
                      const isOverdue = action.sla_hours_remaining < 0 || action.sla_status === 'Overdue';
                      const isNearBreach = action.sla_hours_remaining > 0 && action.sla_hours_remaining < 6;

                      return (
                        <div 
                          key={action.id} 
                          className="kanban-card"
                          onClick={() => openReport(action.source_report)}
                          style={{
                            background: 'var(--bg-surface, #ffffff)',
                            border: `1px solid ${isOverdue ? '#ef4444' : isNearBreach ? '#f59e0b' : 'var(--border-subtle, #e2e8f0)'}`,
                            borderRadius: '10px',
                            padding: '16px',
                            boxShadow: isOverdue ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'var(--shadow-sm, 0 2px 6px rgba(0,0,0,0.06))',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          {/* SLA Aging Progress Countdown Bar (FR-5.1) */}
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: isOverdue ? '#ef4444' : isNearBreach ? '#d97706' : '#16a34a', marginBottom: '4px' }}>
                              <span>{isOverdue ? `🚨 SLA OVERDUE (${Math.abs(action.sla_hours_remaining)}h past SLA)` : isNearBreach ? `⏳ SLA NEAR BREACH (${action.sla_hours_remaining}h left)` : `⏱️ SLA ON TRACK (${action.sla_hours_remaining}h left)`}</span>
                              <span>{action.priority} ({action.sla_window_hours}h SLA)</span>
                            </div>

                            <div style={{ height: '6px', background: 'var(--bg-subtle, #e2e8f0)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: isOverdue ? '100%' : `${Math.max(10, (1 - action.sla_hours_remaining / action.sla_window_hours) * 100)}%`,
                                background: isOverdue ? '#ef4444' : isNearBreach ? '#f59e0b' : '#22c55e',
                                borderRadius: '3px'
                              }} />
                            </div>
                          </div>

                          {/* Top Row with Clean Badge Separation */}
                          <div 
                            className="card-top-row"
                            style={{
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px',
                              gap: '12px'
                            }}
                          >
                            <span 
                              className="capa-id"
                              style={{
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color: 'var(--accent-primary, #2563eb)',
                                fontFamily: 'monospace'
                              }}
                            >
                              {action.id}
                            </span>
                            <Badge tier={action.priority} />
                          </div>

                          <h4 
                            className="capa-title"
                            style={{
                              margin: '0 0 10px 0',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              lineHeight: 1.4
                            }}
                          >
                            {action.title}
                          </h4>

                          {/* Inherited Source-Report Context Strip (FR-5.4) */}
                          {!ownerMode && (
                            <div 
                              className="context-strip"
                              style={{
                                background: 'var(--bg-subtle, #f8fafc)',
                                borderLeft: '3px solid var(--accent-primary, #2563eb)',
                                padding: '8px 10px',
                                borderRadius: '0 6px 6px 0',
                                marginBottom: '10px',
                                fontSize: '0.78rem'
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                                📌 Source Precursor Context (SPS: {action.sps || 75})
                              </div>
                              <div style={{ fontStyle: 'italic', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.3 }}>
                                "{action.evidence_phrase || 'High energy precursor barrier failure.'}"
                              </div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                <span>⚡ {action.energy_source}</span>
                                <span>• 🛡️ {action.life_saving_rule}</span>
                              </div>
                            </div>
                          )}

                          <div 
                            className="capa-details"
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              marginBottom: '12px',
                              background: 'var(--bg-subtle, #f8fafc)',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle, #e2e8f0)'
                            }}
                          >
                            <div><strong style={{ color: 'var(--text-muted)' }}>Asset:</strong> {action.asset}</div>
                            <div><strong style={{ color: 'var(--text-muted)' }}>Owner:</strong> {action.owner}</div>
                            <div><strong style={{ color: 'var(--text-muted)' }}>Due Date:</strong> {action.due_date}</div>
                            <div><strong style={{ color: 'var(--text-muted)' }}>SAP WO:</strong> {action.sap_work_order || 'SAP-WO-2026-8819'}</div>
                          </div>

                          {/* Action Controls */}
                          <div 
                            className="card-actions-row" 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                              gap: '8px',
                              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
                              paddingTop: '10px'
                            }}
                          >
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openReport(action.source_report)}
                            >
                              🔍 View Report ({action.source_report})
                            </Button>

                            {action.status === 'Ready for Verification' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleVerifyClick(action)}
                              >
                                🛡️ Review
                              </Button>
                            ) : action.status !== 'Closed & Verified' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAdvanceStatus(action.id, action.status)}
                              >
                                Advance →
                              </Button>
                            )}

                            {(isOverdue || isNearBreach) && action.status !== 'Closed & Verified' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleEscalateClick(action)}
                              >
                                ⚡ Alert
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Second-Reviewer Closure Verification Modal (FR-5.6, FR-5.7) */}
      <CapaVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          setVerifyingAction(null);
        }}
        action={verifyingAction}
        onVerify={handleConfirmVerification}
        onReopen={handleConfirmReopen}
      />
    </div>
  );
};


