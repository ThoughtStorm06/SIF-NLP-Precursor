import { ERROR } from '../utils/responseHelper.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[API Error]:', err.stack || err);
  return ERROR(res, err.message || 'Internal Server Error', err.status || 500);
};
