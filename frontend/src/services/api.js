const API_BASE = '/api';

export const api = {
  // Reports
  getReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports?${query}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    const json = await res.json();
    return json.data;
  },

  getReportById: async (id) => {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch report ${id}`);
    const json = await res.json();
    return json.data;
  },

  overrideReport: async (id, { newTier, reason, notes }, role = 'hse_officer') => {
    const res = await fetch(`${API_BASE}/reports/${id}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': role
      },
      body: JSON.stringify({ newTier, reason, notes })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to submit override');
    }
    return json.data;
  },

  escalateReport: async (id, data, role = 'hse_officer') => {
    const res = await fetch(`${API_BASE}/reports/${id}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': role
      },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to escalate report');
    }
    return json.data;
  },

  verifyReport: async (id, role = 'hse_officer') => {
    const res = await fetch(`${API_BASE}/reports/${id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': role
      }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to verify report');
    return json.data;
  },

  // CAPA Actions
  getCapaActions: async () => {
    const res = await fetch(`${API_BASE}/capa`);
    if (!res.ok) throw new Error('Failed to fetch CAPA actions');
    const json = await res.json();
    return json.data;
  },

  getCapaSummary: async () => {
    const res = await fetch(`${API_BASE}/capa/summary`);
    if (!res.ok) throw new Error('Failed to fetch CAPA summary');
    const json = await res.json();
    return json.data;
  },

  updateCapaStatus: async (id, status, notes = '') => {
    const res = await fetch(`${API_BASE}/capa/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update CAPA status');
    return json.data;
  },

  verifyCapaClosure: async (id, comments = '') => {
    const res = await fetch(`${API_BASE}/capa/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to verify CAPA closure');
    return json.data;
  },

  reopenCapaAction: async (id, reason = '') => {
    const res = await fetch(`${API_BASE}/capa/${id}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to reopen CAPA action');
    return json.data;
  },

  escalateCapaAction: async (id, note = '') => {
    const res = await fetch(`${API_BASE}/capa/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to escalate CAPA action');
    return json.data;
  },

  // Analytics & Heatmap
  getAnalyticsOverview: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const json = await res.json();
    return json.data;
  },

  getHeatmapData: async () => {
    const res = await fetch(`${API_BASE}/analytics/heatmap`);
    if (!res.ok) throw new Error('Failed to fetch heatmap data');
    const json = await res.json();
    return json.data;
  },

  getTrendsData: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/analytics/trends?${query}`);
    if (!res.ok) throw new Error('Failed to fetch trends data');
    const json = await res.json();
    return json.data;
  },

  getCorrelationData: async () => {
    const res = await fetch(`${API_BASE}/analytics/correlation`);
    if (!res.ok) throw new Error('Failed to fetch correlation data');
    const json = await res.json();
    return json.data;
  },

  getContractorComparison: async () => {
    const res = await fetch(`${API_BASE}/analytics/contractors`);
    if (!res.ok) throw new Error('Failed to fetch contractor comparison');
    const json = await res.json();
    return json.data;
  },

  exportAnalyticsReport: async (data = {}) => {
    const res = await fetch(`${API_BASE}/analytics/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to generate export report');
    const json = await res.json();
    return json.data;
  },

  getTaxonomy: async () => {
    const res = await fetch(`${API_BASE}/taxonomy`);
    if (!res.ok) throw new Error('Failed to fetch taxonomy');
    const json = await res.json();
    return json.data;
  },

  // MLOps Models & Governance
  getModels: async () => {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    const json = await res.json();
    return json.data;
  },

  getDriftMetrics: async () => {
    const res = await fetch(`${API_BASE}/mlops/drift`);
    if (!res.ok) throw new Error('Failed to fetch drift metrics');
    const json = await res.json();
    return json.data;
  },

  getShadowComparison: async () => {
    const res = await fetch(`${API_BASE}/mlops/shadow-comparison`);
    if (!res.ok) throw new Error('Failed to fetch shadow comparison');
    const json = await res.json();
    return json.data;
  },

  getFeedbackMetrics: async () => {
    const res = await fetch(`${API_BASE}/mlops/feedback`);
    if (!res.ok) throw new Error('Failed to fetch analyst feedback metrics');
    const json = await res.json();
    return json.data;
  },

  getFairnessMetrics: async () => {
    const res = await fetch(`${API_BASE}/mlops/fairness`);
    if (!res.ok) throw new Error('Failed to fetch fairness review metrics');
    const json = await res.json();
    return json.data;
  },

  getAuditTrail: async () => {
    const res = await fetch(`${API_BASE}/mlops/audit-trail`);
    if (!res.ok) throw new Error('Failed to fetch governance audit trail');
    const json = await res.json();
    return json.data;
  },

  promoteModel: async ({ candidateId, rationale, actor }) => {
    const res = await fetch(`${API_BASE}/mlops/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, rationale, actor })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to promote model');
    return json.data;
  },

  rollbackModel: async ({ targetVersionId, rationale, actor }) => {
    const res = await fetch(`${API_BASE}/mlops/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetVersionId, rationale, actor })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to execute rollback');
    return json.data;
  },

  uploadFile: async (fileObj, role = 'Admin') => {
    const formData = new FormData();
    formData.append('file', fileObj);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'x-user-role': role
      },
      body: formData
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Upload failed');
    }
    return json.data;
  }
};
