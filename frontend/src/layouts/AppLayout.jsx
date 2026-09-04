import React from 'react';
import { useApp } from '../store/AppContext.jsx';
import { Sidebar } from '../components/navigation/Sidebar.jsx';
import { Topbar } from '../components/navigation/Topbar.jsx';
import { ReportDrawer } from '../components/triage/ReportDrawer.jsx';
import { OverrideModal } from '../components/triage/OverrideModal.jsx';
import { CapaModal } from '../components/triage/CapaModal.jsx';
import { ExecutivePulse } from '../pages/ExecutivePulse.jsx';
import { TriageWorklist } from '../pages/TriageWorklist.jsx';
import { AnalyticsTrendsPage } from '../pages/AnalyticsTrendsPage.jsx';
import { CapaTracker } from '../pages/CapaTracker.jsx';
import { AdminConsole } from '../pages/AdminConsole.jsx';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import { DataUpload } from '../pages/DataUpload.jsx';

export const AppLayout = () => {
  const { currentView, setCurrentView, role } = useApp();

  // Register global keyboard shortcuts (E, O, J, Escape)
  useKeyboardShortcuts();

  // Route protection: only Admins can access the upload module
  React.useEffect(() => {
    if (currentView === 'upload' && role !== 'Admin') {
      setCurrentView('dashboard');
    }
  }, [currentView, role, setCurrentView]);

  const renderActiveView = () => {
    if (currentView === 'upload' && role === 'Admin') return <DataUpload />;
    switch (currentView) {
      case 'dashboard':
        return <ExecutivePulse />;
      case 'triage':
        return <TriageWorklist />;
      case 'heatmap':
      case 'analytics':
        return <AnalyticsTrendsPage />;
      case 'capa':
        return <CapaTracker />;
      case 'admin':
        return <AdminConsole />;
      default:
        return <TriageWorklist />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <div className="app-viewport">
          {renderActiveView()}
        </div>
      </div>

      {/* Global Drawers and Modals */}
      <ReportDrawer />
      <OverrideModal />
      <CapaModal />
    </div>
  );
};
