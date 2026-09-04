import { CapaModel } from '../models/capaModel.js';
import { SUCCESS, ERROR } from '../utils/responseHelper.js';

export const getCapaActions = (req, res, next) => {
  try {
    const actions = CapaModel.findAll();
    return SUCCESS(res, actions, 'CAPA actions retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCapaSummary = (req, res, next) => {
  try {
    const summary = CapaModel.getSummary();
    return SUCCESS(res, summary, 'CAPA summary retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateCapaStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!status) return ERROR(res, 'New status is required', 400);

    const updated = CapaModel.updateStatus(id, status, notes);
    if (!updated) return ERROR(res, 'CAPA action not found', 404);

    return SUCCESS(res, updated, 'CAPA status updated');
  } catch (err) {
    next(err);
  }
};

export const verifyCapaClosure = (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const updated = CapaModel.verifyClosure(id, comments, req.userRole || 'Corporate HSE Head');
    if (!updated) return ERROR(res, 'CAPA action not found', 404);

    return SUCCESS(res, updated, 'CAPA closure verified successfully');
  } catch (err) {
    next(err);
  }
};

export const reopenCapaAction = (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = CapaModel.reopenAction(id, reason, req.userRole || 'Second Reviewer');
    if (!updated) return ERROR(res, 'CAPA action not found', 404);

    return SUCCESS(res, updated, 'CAPA action reopened for revision');
  } catch (err) {
    next(err);
  }
};

export const escalateCapaAction = (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const updated = CapaModel.escalate(id, note, req.userRole || 'HSE Manager');
    if (!updated) return ERROR(res, 'CAPA action not found', 404);

    return SUCCESS(res, updated, 'Escalation notification sent to action owner');
  } catch (err) {
    next(err);
  }
};
