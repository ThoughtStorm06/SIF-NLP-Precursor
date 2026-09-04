import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedPath = path.resolve(__dirname, '../../../database/seed/seedData.json');

let database = null;

function getDb() {
  if (!database) {
    const raw = fs.readFileSync(seedPath, 'utf8');
    database = JSON.parse(raw);
  }
  return database;
}

export const mlopsModel = {
  getAllModels: () => {
    const db = getDb();
    return db.models || [];
  },

  getDriftMetrics: () => {
    const db = getDb();
    return db.drift_metrics || {};
  },

  getShadowComparison: () => {
    const db = getDb();
    return db.shadow_comparison || {};
  },

  getAnalystFeedback: () => {
    const db = getDb();
    return db.analyst_feedback || {};
  },

  getFairnessMetrics: () => {
    const db = getDb();
    return db.fairness_metrics || {};
  },

  getAuditTrail: () => {
    const db = getDb();
    return db.governance_audit_trail || [];
  },

  promoteModel: (candidateId, rationale = '', actor = 'MLOps Lead') => {
    const db = getDb();
    if (!db.models) db.models = [];
    if (!db.governance_audit_trail) db.governance_audit_trail = [];

    // Find candidate model
    const candidate = db.models.find(m => m.id === candidateId || m.name === candidateId);
    if (!candidate) {
      throw new Error(`Model '${candidateId}' not found in registry.`);
    }

    // Demote current Production model to Rollback Eligible
    db.models.forEach(m => {
      if (m.status === 'Production') {
        m.status = 'Rollback Eligible';
        m.notes = `Demoted to Rollback Eligible on promotion of ${candidate.id}.`;
      }
    });

    // Promote candidate to Production
    candidate.status = 'Production';
    candidate.deployed_at = new Date().toISOString().replace('T', ' ').substring(0, 16);
    candidate.notes = `Promoted to Production (Rationale: "${rationale || 'Performance verified in shadow evaluation'}").`;

    // Append to Governance Audit Trail
    const auditEvent = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actor: actor,
      event: 'Model Promotion',
      version: candidate.id,
      rationale: rationale || 'Promoted candidate model following shadow comparison review.'
    };
    db.governance_audit_trail.unshift(auditEvent);

    return {
      promotedModel: candidate,
      auditEvent: auditEvent
    };
  },

  rollbackModel: (targetVersionId, rationale = '', actor = 'HSE Governance Lead') => {
    const db = getDb();
    if (!db.models) db.models = [];
    if (!db.governance_audit_trail) db.governance_audit_trail = [];

    // Find target version
    const targetModel = db.models.find(m => m.id === targetVersionId || m.name === targetVersionId);
    if (!targetModel) {
      throw new Error(`Target rollback version '${targetVersionId}' not found.`);
    }

    // Demote current Production model
    const prevProd = db.models.find(m => m.status === 'Production');
    if (prevProd) {
      prevProd.status = 'Rollback Eligible';
      prevProd.notes = `Rolled back on ${new Date().toISOString().replace('T', ' ').substring(0, 16)}.`;
    }

    // Restore target model to Production
    targetModel.status = 'Production';
    targetModel.deployed_at = new Date().toISOString().replace('T', ' ').substring(0, 16);
    targetModel.notes = `Restored to Production via Emergency Rollback (Rationale: "${rationale || 'Incident response rollback'}").`;

    // Append to Governance Audit Trail
    const auditEvent = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actor: actor,
      event: 'Emergency Rollback',
      version: targetModel.id,
      rationale: rationale || 'Executed emergency model rollback to verified prior release.'
    };
    db.governance_audit_trail.unshift(auditEvent);

    return {
      restoredModel: targetModel,
      auditEvent: auditEvent
    };
  }
};

export default mlopsModel;
