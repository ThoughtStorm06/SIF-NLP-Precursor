import { calculateSpsTier } from '../utils/taxonomy.js';

export const SifEngineService = {
  recalculateSps: (report, newTier) => {
    let newSps = report.sps;
    if (newTier === 'Critical' && report.sps < 85) newSps = 88;
    if (newTier === 'High' && (report.sps < 70 || report.sps >= 85)) newSps = 75;
    if (newTier === 'Medium' && (report.sps < 45 || report.sps >= 70)) newSps = 55;
    if (newTier === 'Low' && report.sps >= 45) newSps = 20;

    return {
      sps: newSps,
      sps_tier: newTier
    };
  },

  verifyEvidenceSpans: (narrative, spans) => {
    // Anti-hallucination check: ensure all evidence spans are exact substrings of the raw narrative
    return spans.every(span => narrative.includes(span.text));
  },

  getAnalyticsSummary: (reports) => {
    const total = reports.length;
    const critical = reports.filter(r => r.sps_tier === 'Critical').length;
    const high = reports.filter(r => r.sps_tier === 'High').length;
    const medium = reports.filter(r => r.sps_tier === 'Medium').length;
    const low = reports.filter(r => r.sps_tier === 'Low').length;
    const pendingTriage = reports.filter(r => r.status === 'Pending Triage').length;
    const escalatedCapa = reports.filter(r => r.status === 'Escalated to CAPA' || r.status === 'Verified / In CAPA').length;

    return {
      total,
      critical,
      high,
      medium,
      low,
      pendingTriage,
      escalatedCapa,
      sifPrecursorRate: ((critical + high) / (total || 1) * 100).toFixed(1) + '%'
    };
  }
};
