import { ERROR } from '../utils/responseHelper.js';

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const role = req.headers['x-user-role'] || 'hse_officer';
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return ERROR(res, `Forbidden: Role '${role}' does not have sufficient permissions.`, 403);
    }
    req.userRole = role;
    next();
  };
};
