export const SIF_TIERS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export const calculateSpsTier = (score) => {
  if (score >= 85) return SIF_TIERS.CRITICAL;
  if (score >= 70) return SIF_TIERS.HIGH;
  if (score >= 45) return SIF_TIERS.MEDIUM;
  return SIF_TIERS.LOW;
};
