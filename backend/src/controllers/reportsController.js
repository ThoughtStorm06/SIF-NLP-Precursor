import { ReportModel } from '../models/reportModel.js';
import { CapaModel } from '../models/capaModel.js';
import { SifEngineService } from '../services/sifEngineService.js';
import { SUCCESS, ERROR } from '../utils/responseHelper.js';

export const getReports = (req, res, next) => {
  try {
    const { tier, status, asset, search, energy_source, page, limit } = req.query;
    const result = ReportModel.findAll({ tier, status, asset, search, energy_source, page, limit });
    return SUCCESS(res, result, 'Reports retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getReportById = (req, res, next) => {
  try {
    const { id } = req.params;
    const report = ReportModel.findById(id);
    if (!report) {
      return ERROR(res, `Report with ID '${id}' not found.`, 404);
    }
    return SUCCESS(res, report, 'Report retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const overrideReport = (req, res, next) => {
  try {
    const { id } = req.params;
    const { newTier, reason, notes } = req.body;
    const report = ReportModel.findById(id);

    if (!report) {
      return ERROR(res, `Report with ID '${id}' not found.`, 404);
    }

    const { sps, sps_tier } = SifEngineService.recalculateSps(report, newTier);
    const updated = ReportModel.update(id, {
      sps,
      sps_tier,
      status: `Override: ${newTier}`
    });

    ReportModel.addAuditLog(id, {
      action: `Human Override: ${report.sps_tier} -> ${newTier} (Reason: ${reason})`,
      user: req.userRole || 'Priya Sharma (Field HSE)',
      notes: notes
    });

    return SUCCESS(res, updated, `Report tier successfully updated to ${newTier}`);
  } catch (err) {
    next(err);
  }
};

export const escalateReport = (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, owner, due_date, priority } = req.body;
    const report = ReportModel.findById(id);

    if (!report) {
      return ERROR(res, `Report with ID '${id}' not found.`, 404);
    }

    const capa = CapaModel.create({
      source_report: id,
      title: title || `Address barrier failure for ${report.id}`,
      owner: owner || 'Er. Rakesh Borah',
      due_date: due_date || '2026-09-10',
      priority: priority || report.sps_tier,
      asset: report.asset
    });

    const updated = ReportModel.update(id, {
      status: 'Escalated to CAPA',
      capa_id: capa.id
    });

    ReportModel.addAuditLog(id, {
      action: `Escalated to CAPA #${capa.id} assigned to ${capa.owner}`,
      user: req.userRole || 'Priya Sharma (Field HSE)',
      notes: `Target resolution: ${capa.due_date}`
    });

    return SUCCESS(res, { report: updated, capa }, `Report escalated to CAPA #${capa.id}`);
  } catch (err) {
    next(err);
  }
};

export const verifyReport = (req, res, next) => {
  try {
    const { id } = req.params;
    const report = ReportModel.findById(id);
    if (!report) return ERROR(res, 'Report not found', 404);

    const updated = ReportModel.update(id, {
      status: 'Verified SIF Precursor'
    });

    ReportModel.addAuditLog(id, {
      action: 'Verified AI Classification without adjustments',
      user: req.userRole || 'Priya Sharma (Field HSE)'
    });

    return SUCCESS(res, updated, 'Report verified successfully');
  } catch (err) {
    next(err);
  }
};
