import { ERROR } from '../utils/responseHelper.js';

export const validateOverride = (req, res, next) => {
  const { newTier, reason, notes } = req.body;

  if (!newTier) {
    return ERROR(res, 'New SIF tier is required for override.', 400);
  }

  if (!reason) {
    return ERROR(res, 'Override reason category is required.', 400);
  }

  if (!notes || typeof notes !== 'string' || notes.trim().length < 10) {
    return ERROR(res, 'Mandatory audit justification notes required (minimum 10 characters) as per PRD Section 11 compliance.', 400);
  }

  next();
};
