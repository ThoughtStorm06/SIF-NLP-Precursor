import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { api } from '../services/api.js';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { CorrelationCenterpiece } from '../components/analytics/CorrelationCenterpiece.jsx';
import { TrendOverviewPanel } from '../components/analytics/TrendOverviewPanel.jsx';
import { FairComparisonPanel } from '../components/analytics/FairComparisonPanel.jsx';
import { ReportExportModal } from '../components/analytics/ReportExportModal.jsx';
import { AnalyticsHeatmap } from './AnalyticsHeatmap.jsx';

export const AnalyticsTrendsPage = () => {
  const { 
    role, 
    filterAsset, 
    setFilterAsset, 
    filterTimeRange, 
    setFilterTimeRange, 
    setCurrentView,
    setSearchQuery,
    showToast 
  } = useApp();

  const [trendsData, setTrendsData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [contractorData, setContractorData] = useState(null);
  const [exportData, setExportData] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auto-set role-appropriate scope on initial load (PRD FR-4.8)
  useEffect(() => {
    if (role === 'hse_officer' && filterAsset === 'all') {
      setFilterAsset('Rig-04 Dibrugarh (Upstream Drilling)');
    }
  }, [role, filterAsset, setFilterAsset]);

  useEffect(() => {
    const loadAllModule4Data = async () => {
      setLoading(true);
      try {
        const [trends, correlation, contractors] = await Promise.all([
          api.getTrendsData({ period: filterTimeRange, asset: filterAsset }),
          api.getCorrelationData(),
          api.getContractorComparison()
        ]);
        setTrendsData(trends);
        setCorrelationData(correlation);
        setContractorData(contractors);
      } catch (err) {
        console.error('Module 4 Data Load Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllModule4Data();
  }, [filterTimeRange, filterAsset]);

  const handleOpenExportBuilder = async () => {
    try {
      const data = await api.exportAnalyticsReport();
      setExportData(data);
      setExportModalOpen(true);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleDrillDown = (context = {}) => {
    if (context.energy_source) {
      setSearchQuery(context.energy_source);
    }
    setCurrentView('triage');
    showToast(`Drilled down to Triage Worklist with filter: ${context.energy_source || context.month || 'Selected Category'}`);
  };

  return (
    <div className="view-container page-analytics-trends">
      {/* Page Header Bar with Role Scoping (FR-4.8) & Time Controls (FR-4.9) */}
      <div className="view-header" style={{ alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>Analytics & Leading Indicator Trends</h2>
            <Badge variant="primary">Module 4 PRD 26165-PRD-SIF-NLP-04-M4</Badge>
          </div>
          <p>
            {role === 'hse_officer' ? 'Site-Scoped View: Rig-04 Dibrugarh Operations' : 'Enterprise Roll-Up: Oil India Limited Facilities'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button variant="secondary" onClick={handleOpenExportBuilder}>
              📄 Export Board Report (PDF/Excel)
            </Button>
            <Button variant="primary" onClick={() => setCurrentView('triage')}>
              📋 Open Triage Queue
            </Button>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Scope Switcher */}
            <div className="filter-group">
              <label htmlFor="scope-switcher">Scope View:</label>
              <select 
                id="scope-switcher" 
                className="filter-select"
                value={filterAsset}
                onChange={(e) => setFilterAsset(e.target.value)}
              >
                <option value="all">All OIL Facilities (Enterprise Roll-up)</option>
                <option value="Rig-04 Dibrugarh (Upstream Drilling)">Rig-04 Dibrugarh</option>
                <option value="Moran Gas Gathering Station (GGS-02)">Moran GGS-02</option>
                <option value="Duliajan Gas Processing Plant">Duliajan Gas Plant</option>
                <option value="Digboi Refinery Complex">Digboi Refinery</option>
              </select>
            </div>

            {/* Time Period Selector */}
            <div className="filter-group">
              <label htmlFor="trend-period-select">Analysis Window:</label>
              <select 
                id="trend-period-select"
                className="filter-select"
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
              >
                <option value="30d">Rolling 30 Days</option>
                <option value="90d">Rolling 90 Days</option>
                <option value="12m">Rolling 12 Months</option>
                <option value="all">Full Dataset (9,129 Records)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          Loading Module 4 Analytics & Trends Intelligence...
        </div>
      ) : (
        <>
          {/* 1. Core Evidence Centerpiece: Leading vs Lagging Correlation (MG3 / FR-4.4) */}
          <CorrelationCenterpiece correlationData={correlationData} />

          {/* 2. Trend Overview Panel with Plain-Language Headlines (MG1 / FR-4.1) */}
          <TrendOverviewPanel trendsData={trendsData} onDrillDown={handleDrillDown} />

          {/* 3. Operational Risk Heatmap Panel with Drill-down */}
          <div style={{ marginBottom: '24px' }}>
            <AnalyticsHeatmap />
          </div>

          {/* 4. Action-Oriented Fair Contractor & Site Comparison Panel (MG4 / FR-4.6) */}
          <FairComparisonPanel contractorData={contractorData} onDrillDown={handleDrillDown} />
        </>
      )}

      {/* Report Export Builder Modal */}
      <ReportExportModal 
        isOpen={exportModalOpen} 
        onClose={() => setExportModalOpen(false)} 
        reportData={exportData} 
      />
    </div>
  );
};
