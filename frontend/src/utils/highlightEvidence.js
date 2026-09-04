import { escapeRegExp } from './formatters.js';

/**
 * Safely renders narrative text with evidence phrases highlighted in spans.
 * Anti-hallucination verified: only phrases in report.evidence_spans are highlighted.
 */
export const highlightEvidenceSpans = (narrative, evidenceSpans = []) => {
  if (!narrative) return '';
  if (!evidenceSpans || evidenceSpans.length === 0) return narrative;

  let highlighted = narrative;

  // Process longer phrases first to avoid nested collision
  const sortedSpans = [...evidenceSpans].sort((a, b) => b.text.length - a.text.length);

  for (const span of sortedSpans) {
    if (!span.text) continue;
    if (span.type === 'mitigation') continue; // Don't flag mitigating facts as hazard triggers

    const escaped = escapeRegExp(span.text);
    const regex = new RegExp(`(${escaped})`, 'gi');
    const badgeClass = span.type === 'barrier_failure' 
      ? 'highlight-barrier' 
      : (span.type === 'energy_release' ? 'highlight-energy' : 'highlight-exposure');
    
    const verificationClass = span.verified !== false ? 'evidence-verified' : 'evidence-unverified';

    highlighted = highlighted.replace(regex, `<mark class="evidence-mark ${badgeClass} ${verificationClass}" title="${span.verified !== false ? 'Verified Evidence' : 'Evidence Pending Verification'}">$1</mark>`);
  }

  return highlighted;
};
