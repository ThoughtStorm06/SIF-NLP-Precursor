import { ERROR } from '../utils/responseHelper.js';

export const validateCapa = (req, res, next) => {
  const { title, owner, due_date } = req.body;

  if (!title || title.trim().length < 5) {
    return ERROR(res, 'CAPA action title must be at least 5 characters.', 400);
  }

  if (!owner || owner.trim().length < 2) {
    return ERROR(res, 'Action owner is required.', 400);
  }

  if (!due_date) {
    return ERROR(res, 'Target completion due date is required.', 400);
  }

  next();
};
