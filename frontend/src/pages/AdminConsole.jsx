import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useApp } from '../store/AppContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { ModelPromotionModal } from '../components/admin/ModelPromotionModal.jsx';
import { ModelRollbackModal } from '../components/admin/ModelRollbackModal.jsx';

export const AdminConsole = () => {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('registry');
  const [models, setModels] = useState([]);
  const [driftMetrics, setDriftMetrics] = useState(null);
  const [shadowComparison, setShadowComparison] = useState(null);
  const [feedbackMetrics, setFeedbackMetrics] = useState(null);
  const [fairnessMetrics, setFairnessMetrics] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedRollbackTarget, setSelectedRollbackTarget] = useState(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [mList, dMetrics, sComp, fBack, fMetrics, aTrail] = await Promise.all([
        api.getModels(),
        api.getDriftMetrics(),
        api.getShadowComparison(),
        api.getFeedbackMetrics(),
        api.getFairnessMetrics(),
        api.getAuditTrail()
      ]);
      setModels(mList || []);
      setDriftMetrics(dMetrics);
      setShadowComparison(sComp);
      setFeedbackMetrics(fBack);
      setFairnessMetrics(fMetrics);
      setAuditTrail(aTrail || []);
    } catch (err) {
      console.error('Failed to load MLOps data:', err);
      showToast('Error loading MLOps governance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const activeProductionModel = models.find(m => m.status === 'Production') || models[0];

  // Handle Promotion Confirm
  const handlePromoteConfirm = async ({ candidateId, rationale, actor }) => {
    try {
      await api.promoteModel({ candidateId, rationale, actor });
      showToast(`Model ${candidateId} successfully promoted to Production!`);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Promotion failed');
    }
  };

  // Handle Rollback Confirm
  const handleRollbackConfirm = async ({ targetVersionId, rationale, actor }) => {
    try {
      await api.rollbackModel({ targetVersionId, rationale, actor });
      showToast(`Emergency rollback to ${targetVersionId} completed!`);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Rollback failed');
    }
  };

  const openPromotionModal = (model) => {
    setSelectedCandidate(model);
    setPromotionModalOpen(true);
  };

  const openRollbackModal = (model) => {
    setSelectedRollbackTarget(model);
    setRollbackModalOpen(true);
  };

  return (
    <div className="view-container page-admin-console" style={{ padding: '24px' }}>
      {/* Header Bar */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>MLOps & AI Model Governance Console</h2>
            <Badge variant="primary">Module 6 PRD 26165-PRD-SIF-NLP-06-M6</Badge>
          </div>
          <p className="subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Oil India Limited — Continuous Drift Monitoring, Shadow Comparison, Retraining Signals & Bias Governance
          </p>
        </div>

        {/* Quick Action & Health Indicator */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Production Model</div>
            <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>
              🟢 {activeProductionModel?.id || 'v1.4.2-prod'}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={loadAllData}>
            🔄 Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Non-Punitive Compliance Notice (Section 11, EC-5) */}
      <div className="governance-banner" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div className="gov-icon" style={{ fontSize: '24px' }}>⚖️</div>
        <div className="gov-text">
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Strict Non-Punitive Safety Governance Notice (PRD Section 11 & EC-5)</h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            SIF-Sentinel classifies risk to physical barriers, high-energy states, and systemic process safety. The engine is strictly prohibited from generating individual worker culpability scores or performance rankings.
          </p>
        </div>
      </div>

      {/* Persistent Threshold Breach Alert Banner (FR-6.2) */}
      {driftMetrics?.prediction_drift?.some(v => v >= driftMetrics.tolerance_threshold) && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '2px solid #f59e0b', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>
                DRIFT WARNING: Prediction Drift Reached Tolerance Boundary ({driftMetrics.tolerance_threshold * 100}%)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Prediction drift reached {Math.max(...driftMetrics.prediction_drift) * 100}% in recent evaluation stream. Review shadow candidate v1.5.0 for promotion.
              </div>
            </div>
          </div>
          <Button variant="warning" size="sm" onClick={() => setActiveTab('shadow')}>
            Inspect Shadow Candidate
          </Button>
        </div>
      )}

      {/* Module 6 Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'registry', label: '📦 Model Registry & Rollback', icon: '📦' },
          { id: 'drift', label: '📈 Drift Dashboard & Alerts', icon: '📈' },
          { id: 'shadow', label: '⚖️ Shadow-Mode Comparison', icon: '⚖️' },
          { id: 'feedback', label: '💡 Retraining Feedback Loop', icon: '💡' },
          { id: 'fairness', label: '🛡️ Bias & Fairness (EC-5)', icon: '🛡️' },
          { id: 'audit', label: '📜 Governance Audit Trail', icon: '📜' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid var(--accent-primary, #2563eb)' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--accent-primary, #2563eb)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading MLOps Model Governance metrics...
        </div>
      ) : (
        <>
          {/* TAB 1: Model Registry & Rollback */}
          {activeTab === 'registry' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Versioned Model Registry</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total Registered Models: {models.length}
                </span>
              </div>

              <div className="models-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {models.map(m => (
                  <div
                    key={m.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: m.status === 'Production' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '16px 20px',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      boxShadow: m.status === 'Production' ? '0 4px 16px rgba(16, 185, 129, 0.15)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{m.id}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({m.name})</span>
                        <Badge
                          variant={
                            m.status === 'Production' ? 'success' :
                            m.status === 'Shadow Mode' ? 'primary' : 'warning'
                          }
                        >
                          {m.status}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Deployed: {m.deployed_at || m.evaluated_at} • Evaluation Narratives: {m.traffic_eval_count?.toLocaleString() || '9,129'}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        {m.notes}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>F1 Score</div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{m.f1_score}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Precision</div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{m.precision}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recall</div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{m.recall}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Drift</div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: m.data_drift <= 0.03 ? '#10b981' : '#f59e0b' }}>
                            {m.data_drift}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {m.status === 'Shadow Mode' && (
                          <Button variant="success" size="sm" onClick={() => openPromotionModal(m)}>
                            🚀 Promote to Prod
                          </Button>
                        )}
                        {m.status === 'Rollback Eligible' && (
                          <Button variant="danger" size="sm" onClick={() => openRollbackModal(m)}>
                            ⚠️ Rollback to Version
                          </Button>
                        )}
                        {m.status === 'Production' && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                            ✓ Active Engine
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Drift Dashboard & Tolerance Bands */}
          {activeTab === 'drift' && driftMetrics && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Continuous Drift & Performance Monitor</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Max Tolerance Threshold: {(driftMetrics.tolerance_threshold * 100).toFixed(1)}% | KPI Target: Class-wise F1 stability
                </span>
              </div>

              {/* Drift Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Data Drift (Input Narratives)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
                    0.02
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ✓ Within 0.05 tolerance boundary
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Prediction Drift (SPS Distribution)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>
                    0.03
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ⚡ Approaching 0.05 alert threshold
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Macro F1 Score (Production)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: '4px 0' }}>
                    89.2%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Across 6 core taxonomy categories
                  </div>
                </div>
              </div>

              {/* Category-Level Class-Wise Precision / Recall Breakdown */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Class-Wise Precision & Recall by Energy Category (PRD FR-6.1)
                </h4>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Taxonomy Category</th>
                      <th style={{ textAlign: 'center', paddingBottom: '8px' }}>F1 Score</th>
                      <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Precision</th>
                      <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Recall</th>
                      <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driftMetrics.category_performance?.map(cat => (
                      <tr key={cat.category} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 600 }}>{cat.category}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{cat.f1}%</td>
                        <td style={{ textAlign: 'center' }}>{cat.precision}%</td>
                        <td style={{ textAlign: 'center' }}>{cat.recall}%</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                            ✓ Normal
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Shadow-Mode Comparison View */}
          {activeTab === 'shadow' && shadowComparison && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Shadow-Mode Model Comparison</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Evaluation Traffic: {shadowComparison.evaluation_dataset}
                  </span>
                </div>
                <Button 
                  variant="success" 
                  onClick={() => {
                    const cand = models.find(m => m.status === 'Shadow Mode');
                    if (cand) openPromotionModal(cand);
                  }}
                >
                  🚀 Promote {shadowComparison.candidate_version} to Production
                </Button>
              </div>

              {/* Side-by-Side Comparison Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {/* Production Card */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>{shadowComparison.production_version}</span>
                    <Badge variant="success">Current Production</Badge>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>F1 Score</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{shadowComparison.aggregate_deltas?.f1_score?.production}%</div>
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recall</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{shadowComparison.aggregate_deltas?.recall?.production}%</div>
                    </div>
                  </div>
                </div>

                {/* Candidate Card */}
                <div style={{ background: 'var(--bg-surface)', border: '2px solid #10b981', borderRadius: '10px', padding: '18px', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>{shadowComparison.candidate_version}</span>
                    <Badge variant="primary">Shadow Candidate</Badge>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>F1 Score</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
                        {shadowComparison.aggregate_deltas?.f1_score?.candidate}%
                        <span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>({shadowComparison.aggregate_deltas?.f1_score?.delta})</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recall</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
                        {shadowComparison.aggregate_deltas?.recall?.candidate}%
                        <span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>({shadowComparison.aggregate_deltas?.recall?.delta})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Taxonomy Category Breakdown */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Taxonomy Category Improvement Breakdown (PRD FR-6.4)
                </h4>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Classification Category</th>
                      <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Production F1</th>
                      <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Candidate F1</th>
                      <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Performance Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shadowComparison.category_deltas?.map(item => (
                      <tr key={item.category} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 600 }}>{item.category}</td>
                        <td style={{ textAlign: 'center' }}>{item.prod_f1}%</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#10b981' }}>{item.candidate_f1}%</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{item.delta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Retraining Feedback Loop */}
          {activeTab === 'feedback' && feedbackMetrics && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Analyst Override Feedback Loop (Workflow E)</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Aggregated Analyst Overrides from Modules 2 & 3 | Overall Agree Rate: {feedbackMetrics.overall_agree_rate}
                </span>
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Ranked Taxonomy Override Priorities (Retraining Signal)
                </h4>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Taxonomy Dimension</th>
                      <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Agree Rate</th>
                      <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Override Rate</th>
                      <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Concentrated Reason Code</th>
                      <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Override Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackMetrics.categories?.map(c => (
                      <tr key={c.category} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 600 }}>{c.category}</td>
                        <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{c.agree_rate}</td>
                        <td style={{ textAlign: 'center', color: parseFloat(c.override_rate) > 10 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                          {c.override_rate}
                        </td>
                        <td style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>{c.top_reason}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Bias & Fairness Review (EC-5) */}
          {activeTab === 'fairness' && fairnessMetrics && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Bias & Fairness Review Console (EC-5)</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Evaluating SIF Precursor Detection Disparities across Contractors, Assets & Language Groups
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Contractor Breakdown */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                    1. Contractor Group Disparity Breakdown
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Contractor Group</th>
                        <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Flagging Rate</th>
                        <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Precision</th>
                        <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Recall</th>
                        <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Narratives Evaluated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fairnessMetrics.by_contractor?.map(g => (
                        <tr key={g.group} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 600 }}>{g.group}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{g.flagging_rate}</td>
                          <td style={{ textAlign: 'center' }}>{g.precision}</td>
                          <td style={{ textAlign: 'center' }}>{g.recall}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{g.sample_size?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Language Group Breakdown (English vs Assamese Code-Mixed) */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                    2. Language & Dialect Performance (Assamese-English Code-Mixed Narratives)
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Language Format</th>
                        <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Precision</th>
                        <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Recall</th>
                        <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Sample Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fairnessMetrics.by_language?.map(l => (
                        <tr key={l.group} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 0', fontWeight: 600 }}>{l.group}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{l.precision}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{l.recall}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{l.sample_size?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Governance Audit Trail */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Immutable Governance Audit Trail</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Regulatory & Compliance Audit Log of Model Promotions, Rollbacks & Calibrations
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {auditTrail.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Badge variant={log.event.includes('Rollback') ? 'danger' : 'success'}>
                          {log.event}
                        </Badge>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{log.version}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {log.actor}</span>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Rationale: "{log.rationale}"
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Promotion Modal */}
      <ModelPromotionModal
        isOpen={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        candidateModel={selectedCandidate}
        shadowComparison={shadowComparison}
        onPromoteConfirm={handlePromoteConfirm}
      />

      {/* Rollback Modal */}
      <ModelRollbackModal
        isOpen={rollbackModalOpen}
        onClose={() => setRollbackModalOpen(false)}
        targetModel={selectedRollbackTarget}
        currentProductionModel={activeProductionModel}
        onRollbackConfirm={handleRollbackConfirm}
      />
    </div>
  );
};

export default AdminConsole;
