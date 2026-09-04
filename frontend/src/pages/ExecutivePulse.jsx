import React from 'react';
import { useApp } from '../store/AppContext.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';

export const ExecutivePulse = () => {
  const { 
    reports, 
    setCurrentView, 
    openReport,
    lastUpdated,
    refreshReports,
    filterTimeRange,
    setFilterTimeRange,
    filterAsset,
    setFilterAsset,
    setFilterTier
  } = useApp();

  const total = reports.length;
  const critical = reports.filter(r => r.sps_tier === 'Critical').length;
  const high = reports.filter(r => r.sps_tier === 'High').length;
  const medium = reports.filter(r => r.sps_tier === 'Medium').length;
  const low = reports.filter(r => r.sps_tier === 'Low').length;
  const precursorRate = total > 0 ? ((critical + high) / total * 100).toFixed(1) : '-';

  const topUrgent = reports.filter(r => r.sps_tier === 'Critical' || r.sps_tier === 'High').slice(0, 4);

  return (
    <div className="view-container page-executive-pulse">
      {/* Page Header */}
      <div className="view-header" style={{ alignItems: 'flex-start' }}>
        <div className="view-title-group">
          <h2>Executive Safety Pulse & Leading Indicators</h2>
          <p>
            Oil India Limited — Real-Time SIF Precursor Intelligence (DGMS / OISD Benchmark)
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="freshness-indicator">
              <span className="last-updated">
                Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </span>
            </div>
            <Button variant="primary" onClick={() => setCurrentView('triage')} id="btn-goto-triage">
              Open Triage Worklist ({critical + high})
            </Button>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="filter-group">
              <label htmlFor="time-range-filter">Time Range:</label>
              <select 
                id="time-range-filter" 
                className="filter-select"
                value={filterTimeRange} 
                onChange={(e) => setFilterTimeRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="asset-filter-dash">Asset:</label>
              <select 
                id="asset-filter-dash" 
                className="filter-select"
                value={filterAsset} 
                onChange={(e) => setFilterAsset(e.target.value)}
              >
                <option value="all">All Installations</option>
                <option value="Rig-04 Dibrugarh (Upstream Drilling)">Rig-04 Dibrugarh</option>
                <option value="Central Tank Farm (CTF) Dikom">CTF Dikom</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => { setFilterTier('critical'); setCurrentView('triage'); }}>
          <div className="stat-top">
            <div className="stat-label">Critical SIF Precursors</div>
            <div className="stat-icon">🚨</div>
          </div>
          <div className="stat-value">{critical}</div>
          <div className="stat-sub">
            <span className="stat-trend-up">SPS 85-100</span> (Immediate Life Hazard)
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => { setFilterTier('high'); setCurrentView('triage'); }}>
          <div className="stat-top">
            <div className="stat-label">High SIF Precursors</div>
            <div className="stat-icon">⚡</div>
          </div>
          <div className="stat-value">{high}</div>
          <div className="stat-sub">
            <span className="stat-trend-up">SPS 70-84</span> (Severe Injury Potential)
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => { setFilterTier('critical,high'); setCurrentView('triage'); }} title={total > 0 ? `${critical + high} of ${total} reports` : 'No data'}>
          <div className="stat-top">
            <div className="stat-label">SIF Precursor Ratio</div>
            <div className="stat-icon">📊</div>
          </div>
          <div className="stat-value">{precursorRate !== '-' ? `${precursorRate}%` : '—'}</div>
          <div className="stat-sub">Percent of reports with fatal potential</div>
        </div>

        <div className="stat-card clickable" onClick={() => { setFilterTier('all'); setCurrentView('triage'); }} title="All Near Misses, Unsafe Acts, and Conditions">
          <div className="stat-top">
            <div className="stat-label">Total Reports Ingested</div>
            <div className="stat-icon">🛡️</div>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">Near Miss + Unsafe Acts & Conditions</div>
        </div>
      </div>

      {/* SIF Tier Distribution */}
      <div className="card pulse-distribution-card">
        <h3 className="card-title">SIF Tier Distribution</h3>
        <div className="distribution-stacked-bar">
          <div className="segment segment-critical" style={{ width: `${total ? (critical / total) * 100 : 0}%` }}>
            {total > 0 && `${((critical / total) * 100).toFixed(0)}% Critical`}
          </div>
          <div className="segment segment-high" style={{ width: `${total ? (high / total) * 100 : 0}%` }}>
            {total > 0 && `${((high / total) * 100).toFixed(0)}% High`}
          </div>
          <div className="segment segment-medium" style={{ width: `${total ? (medium / total) * 100 : 0}%` }}>
            {total > 0 && `${((medium / total) * 100).toFixed(0)}% Medium`}
          </div>
          <div className="segment segment-low" style={{ width: `${total ? (low / total) * 100 : 0}%` }}>
            {total > 0 && `${((low / total) * 100).toFixed(0)}% Low`}
          </div>
        </div>
      </div>

      {/* Immediate Attention Queue */}
      <div className="table-container pulse-recent-table-card">
        <div className="card-header">
          <h3 className="card-title">Priority Precursor Queue (Awaiting Verification or CAPA)</h3>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('triage')}>
            View All Worklist →
          </Button>
        </div>

        <div className="table-responsive">
          <table className="custom-table priority-queue">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>SIF Tier</th>
                <th>SIF Potential Score</th>
                <th>Energy Source</th>
                <th>Primary Hazard & Barrier Failure</th>
                <th>Severity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {topUrgent.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No precursors awaiting verification — all clear!
                  </td>
                </tr>
              ) : (
                topUrgent.map(r => (
                  <tr key={r.id} onClick={() => openReport(r.id)} className="clickable-row">
                    <td className="report-id-cell">{r.id}</td>
                    <td><Badge tier={r.sps_tier} /></td>
                    <td className="sps-cell-border">
                      <span className="sps-pill" style={{ fontWeight: 'bold' }}>
                        {r.sps}
                      </span>
                    </td>
                    <td>{r.energy_source}</td>
                    <td>
                      <div className="hazard-title" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                      <small className="barrier-text">
                        <strong>{r.barrier_status}:</strong> "{r.evidence_spans?.[0]?.text || 'No evidence extracted'}"
                      </small>
                    </td>
                    <td>
                      <span className="status-tag status-pending-triage">{r.recorded_severity}</span>
                    </td>
                    <td>
                      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); openReport(r.id); }}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer-context">
          Showing {topUrgent.length} of {critical + high} open items
        </div>
      </div>
    </div>
  );
};
