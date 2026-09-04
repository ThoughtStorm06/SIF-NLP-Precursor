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

export const ReportModel = {
  findAll: (filter = {}) => {
    const db = getDb();
    let reports = [...db.reports];

    if (filter.tier) {
      const tiers = filter.tier.split(',').map(t => t.trim().toLowerCase());
      reports = reports.filter(r => tiers.includes(r.sps_tier.toLowerCase()));
    }

    if (filter.status) {
      reports = reports.filter(r => r.status.toLowerCase() === filter.status.toLowerCase());
    }

    if (filter.asset) {
      reports = reports.filter(r => r.asset.toLowerCase().includes(filter.asset.toLowerCase()));
    }

    if (filter.energy_source) {
      const es = filter.energy_source.toLowerCase();
      reports = reports.filter(r => r.energy_source.toLowerCase().includes(es));
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      reports = reports.filter(r => 
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.narrative.toLowerCase().includes(q) ||
        r.energy_source.toLowerCase().includes(q) ||
        (r.life_saving_rule && r.life_saving_rule.toLowerCase().includes(q))
      );
    }

    // Default sort SPS descending
    reports.sort((a, b) => b.sps - a.sps);

    const total = reports.length;
    if (filter.limit === 'all') {
      return {
        total,
        page: 1,
        limit: total,
        totalPages: 1,
        reports
      };
    }

    const page = parseInt(filter.page, 10) || 1;
    const limit = parseInt(filter.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    const paginatedReports = reports.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      reports: paginatedReports
    };
  },

  findById: (id) => {
    const db = getDb();
    return db.reports.find(r => r.id === id) || null;
  },

  update: (id, updates) => {
    const db = getDb();
    const index = db.reports.findIndex(r => r.id === id);
    if (index === -1) return null;

    db.reports[index] = {
      ...db.reports[index],
      ...updates
    };
    return db.reports[index];
  },

  addAuditLog: (id, entry) => {
    const db = getDb();
    const report = db.reports.find(r => r.id === id);
    if (!report) return false;

    if (!report.audit_trail) report.audit_trail = [];
    report.audit_trail.push({
      action: entry.action,
      user: entry.user || 'HSE Officer',
      time: entry.time || new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: entry.notes || ''
    });
    return true;
  },

  create: (reportData) => {
    const db = getDb();
    // Simulate ID generation
    const newId = `UP-${Math.floor(Math.random() * 10000)}`;
    const newReport = {
      ...reportData,
      id: newId,
      timestamp: new Date().toISOString().split('T')[0]
    };
    db.reports.push(newReport);
    return newReport;
  }
};
