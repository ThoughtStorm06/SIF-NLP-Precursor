import { Router } from 'express';
import { getReports, getReportById, overrideReport, escalateReport, verifyReport } from '../controllers/reportsController.js';
import { getCapaActions, getCapaSummary, updateCapaStatus, verifyCapaClosure, reopenCapaAction, escalateCapaAction } from '../controllers/capaController.js';
import { getAnalyticsOverview, getHeatmapData, getTaxonomy, getTrendsData, getCorrelationData, getContractorComparison, generateAnalyticsReport } from '../controllers/analyticsController.js';
import { getModels, getDriftMetrics, getShadowComparison, getFeedbackMetrics, getFairnessMetrics, getAuditTrail, promoteModel, rollbackModel } from '../controllers/modelsController.js';
import { validateOverride } from '../validators/overrideValidator.js';
import { validateCapa } from '../validators/capaValidator.js';

import { uploadFile } from '../controllers/uploadController.js';

const router = Router();

// Middleware to enforce Admin role for specific routes
const requireAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
  }
  next();
};

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'sif-sentinel-api' });
});

// Data Upload (Admin Only)
router.post('/upload', requireAdmin, uploadFile);

// Reports & Triage
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.post('/reports/:id/override', validateOverride, overrideReport);
router.post('/reports/:id/escalate', validateCapa, escalateReport);
router.post('/reports/:id/verify', verifyReport);

// CAPA Actions
router.get('/capa', getCapaActions);
router.get('/capa/summary', getCapaSummary);
router.patch('/capa/:id/status', updateCapaStatus);
router.post('/capa/:id/verify', verifyCapaClosure);
router.post('/capa/:id/reopen', reopenCapaAction);
router.post('/capa/:id/escalate', escalateCapaAction);

// Analytics & Taxonomy
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/heatmap', getHeatmapData);
router.get('/analytics/trends', getTrendsData);
router.get('/analytics/correlation', getCorrelationData);
router.get('/analytics/contractors', getContractorComparison);
router.post('/analytics/export', generateAnalyticsReport);
router.get('/taxonomy', getTaxonomy);

// MLOps Models & Governance
router.get('/models', getModels);
router.get('/mlops/models', getModels);
router.get('/mlops/drift', getDriftMetrics);
router.get('/mlops/shadow-comparison', getShadowComparison);
router.get('/mlops/feedback', getFeedbackMetrics);
router.get('/mlops/fairness', getFairnessMetrics);
router.get('/mlops/audit-trail', getAuditTrail);
router.post('/mlops/promote', promoteModel);
router.post('/mlops/rollback', rollbackModel);

export default router;
