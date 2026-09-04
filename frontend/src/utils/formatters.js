export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return dateStr;
};

export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
