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

export const CapaModel = {
  findAll: () => {
    const db = getDb();
    return db.capa_actions || [];
  },

  findById: (id) => {
    const db = getDb();
    return db.capa_actions.find(c => c.id === id) || null;
  },

  create: (data) => {
    const db = getDb();
    const newId = `CAPA-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newAction = {
      id: data.id || newId,
      source_report: data.source_report,
      title: data.title,
      owner: data.owner || 'Er. Rakesh Borah (Site Engineer)',
      due_date: data.due_date || new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10),
      status: data.status || 'In Progress',
      priority: data.priority || 'High',
      asset: data.asset || 'Rig-04 Dibrugarh (Upstream Drilling)',
      sap_work_order: data.sap_work_order || `SAP-WO-${new Date().getFullYear()}-${Math.floor(8000 + Math.random() * 1000)}`,
      sla_window_hours: data.priority === 'Critical' ? 24 : 48,
      sla_hours_remaining: data.priority === 'Critical' ? 20.0 : 44.0,
      sla_status: 'On Track',
      evidence_phrase: data.evidence_phrase || 'High energy precursor barrier failure',
      sps: data.sps || 75.0,
      sps_tier: data.priority || 'High',
      energy_source: data.energy_source || 'Line of Fire',
      life_saving_rule: data.life_saving_rule || 'General Safety',
      barrier_status: data.barrier_status || 'Degraded',
      action_description: data.action_description || 'Implement corrective barrier repairs and verify site compliance.',
      owner_notes: '',
      reviewer_comments: '',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      history: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          actor: 'System Escalation',
          action: `CAPA created from Report #${data.source_report}`
        }
      ]
    };
    db.capa_actions.unshift(newAction);
    return newAction;
  },

  updateStatus: (id, status, notes = '') => {
    const db = getDb();
    const action = db.capa_actions.find(c => c.id === id);
    if (!action) return null;
    action.status = status;
    if (notes) action.owner_notes = notes;
    if (!action.history) action.history = [];
    action.history.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actor: 'Action Owner',
      action: `Status updated to '${status}'`
    });
    return action;
  },

  verifyClosure: (id, reviewerComments = '', actor = 'Corporate HSE Head') => {
    const db = getDb();
    const action = db.capa_actions.find(c => c.id === id);
    if (!action) return null;
    action.status = 'Closed & Verified';
    action.reviewer_comments = reviewerComments;
    action.sla_status = 'Closed On Time';
    if (!action.history) action.history = [];
    action.history.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actor: actor,
      action: `Verified & Closed CAPA action (Notes: "${reviewerComments || 'Verified physical completion'}")`
    });
    return action;
  },

  reopenAction: (id, reopenReason = '', actor = 'Second Reviewer') => {
    const db = getDb();
    const action = db.capa_actions.find(c => c.id === id);
    if (!action) return null;
    action.status = 'In Progress';
    action.reviewer_comments = reopenReason;
    if (!action.history) action.history = [];
    action.history.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actor: actor,
      action: `Reopened action with revision note: "${reopenReason}"`
    });
    return action;
  },

  escalate: (id, escalationNote = '', actor = 'HSE Manager') => {
    const db = getDb();
    const action = db.capa_actions.find(c => c.id === id);
    if (!action) return null;
    action.sla_status = 'Escalated';
    if (!action.history) action.history = [];
    action.history.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actor: actor,
      action: `Triggered urgency escalation alert to ${action.owner} (${escalationNote || 'SLA Near Breach'})`
    });
    return action;
  },

  getSummary: () => {
    const db = getDb();
    const actions = db.capa_actions || [];
    const overdueCritical = actions.filter(a => a.priority === 'Critical' && (a.sla_status === 'Overdue' || a.sla_hours_remaining < 0));
    const nearBreach = actions.filter(a => a.sla_status === 'Near Breach' || (a.sla_hours_remaining > 0 && a.sla_hours_remaining < 6));
    const closedCount = actions.filter(a => a.status === 'Closed & Verified').length;
    const totalCount = actions.length;
    const onTimeRate = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 95;

    return {
      totalActions: totalCount,
      overdueCriticalCount: overdueCritical.length,
      overdueCriticalActions: overdueCritical,
      nearBreachCount: nearBreach.length,
      closedCount,
      onTimeRate: `${onTimeRate}%`,
      targetRate: '≥ 95% within 24-48 hrs'
    };
  }
};
