/**
 * @typedef {Object} EvidenceSpan
 * @property {string} text
 * @property {'barrier_failure' | 'energy_release' | 'line_of_fire' | 'mitigation'} type
 * 
 * @typedef {Object} SpsBreakdown
 * @property {number} energy_score
 * @property {number} barrier_score
 * @property {number} exposure_score
 * @property {number} context_multiplier
 * 
 * @typedef {Object} Counterfactual
 * @property {boolean} could_be_fatal
 * @property {string} reasoning
 * 
 * @typedef {Object} AuditEntry
 * @property {string} action
 * @property {string} user
 * @property {string} time
 * @property {string} [notes]
 * 
 * @typedef {Object} Report
 * @property {string} id
 * @property {string} title
 * @property {string} type
 * @property {string} source
 * @property {string} asset
 * @property {string} location
 * @property {string} narrative
 * @property {string} energy_source
 * @property {string} energy_source_id
 * @property {string} energy_level
 * @property {string} exposure_type
 * @property {string} barrier_status
 * @property {string} life_saving_rule
 * @property {number} sps
 * @property {'Critical' | 'High' | 'Medium' | 'Low'} sps_tier
 * @property {SpsBreakdown} sps_breakdown
 * @property {Counterfactual} counterfactual
 * @property {EvidenceSpan[]} evidence_spans
 * @property {string} status
 * @property {number} sla_hours_remaining
 * @property {string} assigned_to
 * @property {AuditEntry[]} audit_trail
 */

export const Types = {};
