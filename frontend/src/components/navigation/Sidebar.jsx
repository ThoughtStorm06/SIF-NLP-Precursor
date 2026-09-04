import React from 'react';
import { useApp } from '../../store/AppContext.jsx';

export const Sidebar = () => {
  const { currentView, setCurrentView, reports, role } = useApp();
  const triageCount = reports.filter(r => r.sps_tier === 'Critical' || r.sps_tier === 'High').length;

  const navItems = [
    { id: 'dashboard', label: 'Executive Pulse', icon: 'M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z' },
    { id: 'triage', label: 'Triage Worklist', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8', count: triageCount },
    { id: 'heatmap', label: 'Analytics & Trends', icon: 'M18 20V10 M12 20V4 M6 20v-6' },
    { id: 'capa', label: 'CAPA Escalations', icon: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
    ...(role === 'Admin' ? [{ id: 'upload', label: 'Data Upload', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12' }] : []),
    { id: 'admin', label: 'MLOps & Governance', icon: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">OIL</div>
        <div className="brand-text">
          <h1>SIF-SENTINEL</h1>
          <span>Precursor Engine</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Modules</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
            id={`nav-${item.id}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span className="badge" id="sidebar-urgent-count">{item.count}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-pulse"></span>
          <span className="status-text">SIF Engine: Operational (v1.4.2)</span>
        </div>
      </div>
    </aside>
  );
};
