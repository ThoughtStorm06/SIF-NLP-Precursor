import React from 'react';

export const Badge = ({ children, tier, variant = 'tier', className = '' }) => {
  const getBadgeClass = () => {
    if (variant === 'tier') {
      switch ((tier || '').toLowerCase()) {
        case 'critical': return 'badge-critical';
        case 'high': return 'badge-high';
        case 'medium': return 'badge-medium';
        case 'low': return 'badge-low';
        default: return 'badge-default';
      }
    }
    return `badge-${variant}`;
  };

  return (
    <span className={`badge ${getBadgeClass()} ${className}`}>
      {children || tier}
    </span>
  );
};
