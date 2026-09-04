export const AuditModel = {
  log: (reportId, action, user, notes = '') => {
    return {
      reportId,
      action,
      user,
      notes,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
  }
};
