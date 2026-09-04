import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const AppContext = createContext(null);

const normalizeReport = (report) => ({
  ...report,
  recorded_severity: report?.recorded_severity && typeof report.recorded_severity === 'object'
    ? Object.values(report.recorded_severity).join(', ')
    : report?.recorded_severity || 'Unknown'
});

export const AppProvider = ({ children }) => {
  const readSession = (key, fallback) => {
    try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
  };
  const [theme, setTheme] = useState(() => readSession('sif.theme', 'oceanic'));
  const [mode, setMode] = useState(() => readSession('sif.mode', 'light'));
  const [role, setRole] = useState(() => readSession('sif.role', 'hse_officer'));
  const [currentView, setCurrentView] = useState(() => readSession('sif.view', 'triage'));
  const [reports, setReports] = useState([]);
  const [uploadedReports, setUploadedReports] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('sif.uploadedReports') || '[]').map(normalizeReport);
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [subView, setSubView] = useState('critical_high'); // Replaces filterTier
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTimeRange, setFilterTimeRange] = useState('30d'); // Default to 30 days
  const [searchQuery, setSearchQuery] = useState('');
  
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Inline Actions State
  const [undoQueue, setUndoQueue] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);

  // Modals & Drawers
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [activeReportData, setActiveReportData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [capaModalOpen, setCapaModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Apply theme & mode to root document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
    try {
      window.localStorage.setItem('sif.theme', theme);
      window.localStorage.setItem('sif.mode', mode);
      window.localStorage.setItem('sif.role', role);
      window.localStorage.setItem('sif.view', currentView);
      window.localStorage.setItem('sif.uploadedReports', JSON.stringify(uploadedReports.slice(0, 50)));
    } catch {
      // Session persistence is best effort when storage is unavailable.
    }
  }, [theme, mode, role, currentView, uploadedReports]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (filterAsset !== 'all') params.asset = filterAsset;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      if (subView === 'critical_high') {
        params.tier = 'Critical,High';
        params.status = 'Pending Triage';
      } else if (subView === 'bulk') {
        params.tier = 'Low';
        params.status = 'Pending Triage';
      } else if (subView === 'escalated') {
        params.status = 'Escalated to CAPA';
      }

      const data = await api.getReports(params);
      
      if (data && typeof data === 'object' && Array.isArray(data.reports)) {
        const uploaded = uploadedReports.filter(uploadedReport => !data.reports.some(report => String(report.id) === String(uploadedReport.id)));
        setReports([...uploaded.map(normalizeReport), ...data.reports.map(normalizeReport)]);
        setTotalCount(data.total || data.reports.length);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setReports(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setReports([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.warn('API fetch failed, falling back to local seed data:', err.message);
      try {
        const fallbackRes = await fetch('/database/seed/seedData.json');
        if (fallbackRes.ok) {
          const fb = await fallbackRes.json();
          let fbData = fb.reports || [];
          
          if (subView === 'critical_high') {
            fbData = fbData.filter(r => ['Critical', 'High'].includes(r.sps_tier) && r.status === 'Pending Triage');
          } else if (subView === 'my_assigned') {
            fbData = fbData.filter(r => r.assigned_to);
          } else if (subView === 'bulk') {
            fbData = fbData.filter(r => r.sps_tier === 'Low' && r.status === 'Pending Triage');
          } else if (subView === 'escalated') {
            fbData = fbData.filter(r => r.status && r.status.includes('Escalated'));
          }

          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            fbData = fbData.filter(r => 
              r.id.toLowerCase().includes(q) || 
              r.title.toLowerCase().includes(q) || 
              r.narrative.toLowerCase().includes(q)
            );
          }

          setTotalCount(fbData.length);
          setTotalPages(Math.ceil(fbData.length / limit));
          const start = (page - 1) * limit;
          const uploaded = uploadedReports.filter(uploadedReport => !fbData.some(report => String(report.id) === String(uploadedReport.id)));
          setReports([...uploaded.map(normalizeReport), ...fbData.slice(start, start + limit).map(normalizeReport)]);
        }
      } catch (e) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [subView, filterAsset, filterStatus, searchQuery, page, limit, uploadedReports]);

  useEffect(() => {
    fetchReports();
    // Auto-refresh interval (60 seconds)
    const interval = setInterval(() => {
      fetchReports();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  // Role changes handle landing view
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'hse_officer') {
      setCurrentView('triage');
    } else if (newRole === 'area_manager') {
      setCurrentView('dashboard');
    } else if (newRole === 'mlops_lead') {
      setCurrentView('admin');
    }
    showToast(`Role switched to ${newRole.replace('_', ' ').toUpperCase()}`);
  };

  const showToast = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const openReport = async (id) => {
    if (!id) return;
    const strId = String(id);
    setSelectedReportId(strId);
    setDrawerOpen(true);

    const existing = reports.find(r => String(r.id) === strId);
    if (existing) {
      setActiveReportData(existing);
    } else {
      try {
        const fetched = await api.getReportById(strId);
        if (fetched) {
          setActiveReportData(fetched);
          setReports(prev => [fetched, ...prev]);
        }
      } catch (err) {
        try {
          const uploaded = await api.getUploadedReport(strId);
          const normalized = normalizeReport(uploaded);
          setActiveReportData(normalized);
          setUploadedReports(prev => [normalized, ...prev.filter(report => String(report.id) !== strId)]);
          setReports(prev => [normalized, ...prev.filter(report => String(report.id) !== strId)]);
          return;
        } catch (uploadedError) {
          console.warn(`Could not fetch report ${strId} via API, trying seed fallback:`, uploadedError.message);
        }
        try {
          const res = await fetch('/database/seed/seedData.json');
          if (res.ok) {
            const db = await res.json();
            const match = (db.reports || []).find(r => String(r.id) === strId);
            if (match) {
              setActiveReportData(match);
              setReports(prev => [match, ...prev]);
            }
          }
        } catch (e) {
          console.error('Seed fallback error:', e);
        }
      }
    }
  };

  const closeReport = () => {
    setDrawerOpen(false);
    setActiveReportData(null);
  };

  const openNextReport = () => {
    if (!selectedReportId || reports.length === 0) return;
    const currentIndex = reports.findIndex(r => String(r.id) === String(selectedReportId));
    if (currentIndex !== -1 && currentIndex < reports.length - 1) {
      const nextReport = reports[currentIndex + 1];
      openReport(nextReport.id);
      showToast(`Navigated to next report: ${nextReport.id}`);
    } else {
      showToast('You are at the last report in this queue.');
    }
  };

  const selectedReport = activeReportData || reports.find(r => String(r.id) === String(selectedReportId)) || null;

  const value = {
    theme,
    setTheme,
    mode,
    setMode,
    role,
    setRole: handleRoleChange,
    currentView,
    setCurrentView,
    reports,
    loading,
    error,
    page,
    setPage,
    limit,
    setLimit,
    totalCount,
    totalPages,
    subView,
    setSubView,
    filterAsset,
    setFilterAsset,
    filterStatus,
    setFilterStatus,
    filterTimeRange,
    setFilterTimeRange,
    searchQuery,
    setSearchQuery,
    undoQueue,
    setUndoQueue,
    selectedReports,
    setSelectedReports,
    selectedReportId,
    selectedReport,
    drawerOpen,
    openReport,
    closeReport,
    openNextReport,
    overrideModalOpen,
    setOverrideModalOpen,
    capaModalOpen,
    setCapaModalOpen,
    notification,
    showToast,
    refreshReports: fetchReports,
    addReport: (report) => {
      const normalized = normalizeReport(report);
      setReports(prev => [normalized, ...prev.filter(existing => String(existing.id) !== String(normalized.id))]);
      setUploadedReports(prev => [normalized, ...prev.filter(existing => String(existing.id) !== String(normalized.id))]);
    },
    lastUpdated
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
