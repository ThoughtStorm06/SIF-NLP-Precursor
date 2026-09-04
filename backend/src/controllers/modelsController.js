import { mlopsModel } from '../models/mlopsModel.js';
import { SUCCESS, ERROR } from '../utils/responseHelper.js';

export const getModels = (req, res, next) => {
  try {
    const models = mlopsModel.getAllModels();
    return SUCCESS(res, models, 'MLOps model registry retrieved');
  } catch (err) {
    next(err);
  }
};

export const getDriftMetrics = (req, res, next) => {
  try {
    const drift = mlopsModel.getDriftMetrics();
    return SUCCESS(res, drift, 'Data & prediction drift metrics retrieved');
  } catch (err) {
    next(err);
  }
};

export const getShadowComparison = (req, res, next) => {
  try {
    const comparison = mlopsModel.getShadowComparison();
    return SUCCESS(res, comparison, 'Shadow-mode model comparison retrieved');
  } catch (err) {
    next(err);
  }
};

export const getFeedbackMetrics = (req, res, next) => {
  try {
    const feedback = mlopsModel.getAnalystFeedback();
    return SUCCESS(res, feedback, 'Analyst feedback aggregation retrieved');
  } catch (err) {
    next(err);
  }
};

export const getFairnessMetrics = (req, res, next) => {
  try {
    const fairness = mlopsModel.getFairnessMetrics();
    return SUCCESS(res, fairness, 'EC-5 Bias & Fairness metrics retrieved');
  } catch (err) {
    next(err);
  }
};

export const getAuditTrail = (req, res, next) => {
  try {
    const audit = mlopsModel.getAuditTrail();
    return SUCCESS(res, audit, 'Governance audit trail retrieved');
  } catch (err) {
    next(err);
  }
};

export const promoteModel = (req, res, next) => {
  try {
    const { candidateId, rationale, actor } = req.body;
    if (!candidateId) {
      return ERROR(res, 'Candidate model ID is required for promotion.', 400);
    }
    const result = mlopsModel.promoteModel(candidateId, rationale, actor);
    return SUCCESS(res, result, `Model ${candidateId} promoted to Production successfully`);
  } catch (err) {
    next(err);
  }
};

export const rollbackModel = (req, res, next) => {
  try {
    const { targetVersionId, rationale, actor } = req.body;
    if (!targetVersionId) {
      return ERROR(res, 'Target rollback version ID is required.', 400);
    }
    const result = mlopsModel.rollbackModel(targetVersionId, rationale, actor);
    return SUCCESS(res, result, `Emergency rollback to ${targetVersionId} completed successfully`);
  } catch (err) {
    next(err);
  }
};

