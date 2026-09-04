export const getSpsTierClass = (tier) => {
  switch ((tier || '').toLowerCase()) {
    case 'critical': return 'tier-critical';
    case 'high': return 'tier-high';
    case 'medium': return 'tier-medium';
    case 'low': return 'tier-low';
    default: return 'tier-low';
  }
};

export const getSpsBadgeColor = (tier) => {
  switch ((tier || '').toLowerCase()) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#10b981';
    default: return '#64748b';
  }
};
