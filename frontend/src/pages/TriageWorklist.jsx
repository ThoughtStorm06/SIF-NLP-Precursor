import React, { useState } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { InlineOverridePicker } from '../components/triage/InlineOverridePicker.jsx';

export const TriageWorklist = () => {
  const { 
    reports, 
    subView, 
    setSubView, 
    filterAsset, 
    setFilterAsset, 
    filterStatus, 
    setFilterStatus,
    undoQueue,
    setUndoQueue,
    selectedReports,
    setSelectedReports,
    openReport,
    showToast,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    totalCount,
    totalPages
  } = useApp();

  const [activePickerRow, setActivePickerRow] = useState(null);

  const subViewOptions = [
    { id: 'critical_high', label: '🔥 Critical & High Queue' },
    { id: 'my_assigned', label: 'My Assigned' },
    { id: 'all', label: 'All Reports' },
    { id: 'bulk', label: 'Bulk Review (Low SPS)' },
    { id: 'escalated', label: 'Escalated / In CAPA' }
  ];

  const assetOptions = [
    'all',
    'Rig-04 Dibrugarh (Upstream Drilling)',
    'Moran Gas Gathering Station (GGS-02)',
    'Central Tank Farm (CTF) Dikom',
    'Duliajan Gas Processing Plant',
    'Rig-07 Naharkatiya (Drilling)',
    'Central Warehouse Duliajan',
    'Brahmaputra Pipeline River Crossing (ROW-08)'
  ];

  // Inline Actions
  const handleAction = (reportId, actionType, reason = null) => {
    // Hide picker if open
    if (activePickerRow === reportId) setActivePickerRow(null);
    
    // Add to undo queue
    const pendingItem = { id: reportId, action: actionType, reason, timestamp: Date.now() };
    setUndoQueue(prev => [...prev, pendingItem]);
    
    // Auto-commit after 5 seconds
    setTimeout(() => {
      setUndoQueue(prev => {
        const stillPending = prev.find(p => p.id === reportId);
        if (stillPending) {
          // Commit action here (in a real app, call API)
          showToast(`Action '${actionType}' committed for ${reportId}`);
          return prev.filter(p => p.id !== reportId);
        }
        return prev;
      });
    }, 5000);
  };

  const handleUndo = (reportId) => {
    setUndoQueue(prev => prev.filter(p => p.id !== reportId));
  };

  const handleBulkSelect = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) ? prev.filter(id => id !== reportId) : [...prev, reportId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReports(reports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleBulkClose = () => {
    if (selectedReports.length === 0) return;
    showToast(`Bulk closed ${selectedReports.length} reports.`);
    setSelectedReports([]);
  };

  // Filter out items in the undo queue from the main display, unless we're rendering them specially
  // For the UI, we'll render the row as a "pending undo" state.

  return (
    <div className="view-container page-triage-worklist">
      {/* Page Header */}
      <div className="view-header" style={{ alignItems: 'flex-start' }}>
        <div className="view-title-group">
          <h2>SIF Precursor Triage Worklist</h2>
          <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            HSE Officer Queue — Automated Energy & Barrier Precursor Inference
            <Badge variant="primary" style={{ fontWeight: 600 }}>
              {totalCount > 0 ? `${totalCount.toLocaleString()} Incident Reports Loaded` : 'Loading Dataset...'}
            </Badge>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="filter-group">
            <label htmlFor="asset-filter">Installation / Asset:</label>
            <select
              id="asset-filter"
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value)}
              className="filter-select"
            >
              <option value="all">All OIL Installations</option>
              {assetOptions.filter(a => a !== 'all').map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>

          {subView !== 'critical_high' && subView !== 'bulk' && (
            <div className="filter-group">
              <label htmlFor="status-filter">Workflow Status:</label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Workflow States</option>
                <option value="Pending Triage">Pending Triage</option>
                <option value="Escalated to CAPA">Escalated to CAPA</option>
                <option value="Verified / In CAPA">Verified / In CAPA</option>
                <option value="Closed (Bulk)">Closed (Bulk)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Sub-View Navigation */}
      <div className="sub-view-tabs">
        {subViewOptions.map(opt => (
          <button
            key={opt.id}
            className={`sub-view-tab ${subView === opt.id ? 'active' : ''}`}
            onClick={() => {
              setSubView(opt.id);
              setSelectedReports([]);
            }}
            id={`tab-${opt.id}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Triage Worklist Table */}
      <div className="worklist-table-card">
        <div className="table-status-bar">
          <div className="status-left">
            <span>Showing <strong>{reports.length}</strong> prioritized incidents</span>
            {loading && <span className="loading-spinner">Refreshing...</span>}
          </div>
          {subView === 'bulk' && (
            <div className="status-right">
              <Button variant="primary" onClick={handleBulkClose} disabled={selectedReports.length === 0}>
                Confirm & Close Selected ({selectedReports.length})
              </Button>
            </div>
          )}
        </div>

        <div className="table-responsive">
          <table className={`custom-table triage-table ${subView === 'bulk' ? 'table-bulk' : ''}`}>
            <thead>
              <tr>
                {subView === 'bulk' && (
                  <th width="40"><input type="checkbox" onChange={handleSelectAll} checked={reports.length > 0 && selectedReports.length === reports.length} /></th>
                )}
                <th>SIF Potential Score</th>
                <th>Case ID</th>
                <th>Title</th>
                <th>Energy Source & Level</th>
                <th>Barrier Status & LSR</th>
                <th>Severity & Confidence</th>
                <th>Status</th>
                <th width="200">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={subView === 'bulk' ? 9 : 8} className="empty-state">
                    No safety reports found matching the selected filters.
                  </td>
                </tr>
              ) : (
                reports.map(r => {
                  const pendingAction = undoQueue.find(p => p.id === r.id);
                  
                  if (pendingAction) {
                    return (
                      <tr key={r.id} className="row-undo-state">
                        <td colSpan={subView === 'bulk' ? 9 : 8}>
                          <div className="undo-container">
                            <span>Action <strong>{pendingAction.action}</strong> pending...</span>
                            <div className="undo-timer-bar"></div>
                            <Button variant="secondary" size="sm" onClick={() => handleUndo(r.id)}>Undo</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const isCritical = ['Critical', 'High'].includes(r.sps_tier);
                  const isOverdue = r.sla_hours_remaining !== undefined && r.sla_hours_remaining <= 0;

                  return (
                    <React.Fragment key={r.id}>
                      <tr 
                        className={`clickable-row triage-row row-tier-${(r.sps_tier || 'default').toLowerCase()}`}
                        id={`report-row-${r.id}`}
                      >
                        {subView === 'bulk' && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedReports.includes(r.id)}
                              onChange={() => handleBulkSelect(r.id)}
                            />
                          </td>
                        )}
                        <td className="sps-cell" onClick={() => openReport(r.id)}>
                          <div className="sps-score-badge group-hover">
                            <span className="sps-num">{r.sps}</span>
                            <div className="sps-tooltip">
                              <div className="sps-breakdown">
                                <div>E: {r.sps_breakdown?.energy_score}</div>
                                <div>B: {r.sps_breakdown?.barrier_score}</div>
                                <div>X: {r.sps_breakdown?.exposure_score}</div>
                              </div>
                              <div className="sps-evidence">
                                "{r.evidence_spans?.[0]?.text || 'No verified evidence'}"
                              </div>
                            </div>
                          </div>
                        </td>
                        <td onClick={() => openReport(r.id)}>
                          <div className="report-id">{r.id}</div>
                        </td>
                        <td onClick={() => openReport(r.id)}>
                          <div className="report-title-bold" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                        </td>
                        <td onClick={() => openReport(r.id)}>
                          <div className="asset-name">{r.energy_source}</div>
                          <small className="location-name">{r.energy_level} Energy</small>
                        </td>
                        <td onClick={() => openReport(r.id)}>
                          <div className="barrier-info">{r.barrier_status}</div>
                          {r.life_saving_rule && <small className="lsr-badge">{r.life_saving_rule.split(':')[0]}</small>}
                        </td>
                        <td onClick={() => openReport(r.id)}>
                          <div className="severity-info">{r.recorded_severity}</div>
                          <small className="confidence-info">Conf: {(r.confidence * 100).toFixed(0)}%</small>
                        </td>
                        <td onClick={() => openReport(r.id)}>
                          <span className={`status-tag status-${(r.status || '').toLowerCase().replace(/[^a-z]/g, '-')}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="inline-actions-cell">
                          {subView !== 'bulk' ? (
                            <div className="inline-actions">
                              <button className="btn-inline btn-agree" onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'Agree'); }}>✓</button>
                              <button className="btn-inline btn-override" onClick={(e) => { e.stopPropagation(); setActivePickerRow(activePickerRow === r.id ? null : r.id); }}>✎</button>
                              <button className="btn-inline btn-escalate" onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'Escalate'); }}>↗</button>
                            </div>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => openReport(r.id)}>View</Button>
                          )}
                        </td>
                      </tr>
                      
                      {activePickerRow === r.id && (
                        <tr className="picker-row">
                          <td colSpan={subView === 'bulk' ? 9 : 8}>
                            <InlineOverridePicker 
                              reportId={r.id} 
                              onCancel={() => setActivePickerRow(null)} 
                              onConfirm={(reason) => handleAction(r.id, 'Override', reason)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color, #e2e8f0)',
          background: 'var(--bg-secondary, #f8fafc)',
          borderRadius: '0 0 8px 8px',
          fontSize: '0.875rem'
        }}>
          <div style={{ color: 'var(--text-muted, #64748b)' }}>
            Showing <strong>{((page - 1) * limit) + (reports.length > 0 ? 1 : 0)}</strong> - <strong>{Math.min(page * limit, totalCount)}</strong> of <strong>{totalCount.toLocaleString()}</strong> reports
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="limit-select" style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>Per Page:</label>
              <select
                id="limit-select"
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-card, #fff)',
                  fontSize: '0.8rem'
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
              >
                ◀ Previous
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: 600 }}>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              >
                Next ▶
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
