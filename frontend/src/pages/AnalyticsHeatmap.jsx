import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { api } from '../services/api.js';

export const AnalyticsHeatmap = () => {
  const { setFilterAsset, setCurrentView, showToast } = useApp();
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getHeatmapData();
        setHeatmap(data);
      } catch (err) {
        console.error('Heatmap load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCellColor = (score) => {
    if (score >= 80) return 'rgba(239, 68, 68, 0.85)'; // Deep red
    if (score >= 65) return 'rgba(249, 115, 22, 0.75)'; // Orange
    if (score >= 45) return 'rgba(234, 179, 8, 0.65)';  // Yellow
    if (score >= 25) return 'rgba(59, 130, 246, 0.45)';  // Blue
    return 'rgba(100, 116, 139, 0.2)'; // Slate
  };

  const handleCellClick = (installation, category, score) => {
    // Exact mapping for drilldown
    const mapping = {
      "Rig-04 Dibrugarh": "Rig-04 Dibrugarh (Upstream Drilling)",
      "Rig-07 Naharkatiya": "Rig-07 Naharkatiya (Drilling)",
      "Moran GGS-02": "Moran Gas Gathering Station (GGS-02)",
      "CTF Dikom": "Central Tank Farm (CTF) Dikom",
      "Duliajan Gas Plant": "Duliajan Gas Processing Plant",
      "Pipeline ROW-08": "Brahmaputra Pipeline River Crossing (ROW-08)"
    };

    const fullAssetName = mapping[installation] || installation;
    setFilterAsset(fullAssetName);
    setCurrentView('triage');
    showToast(`Drilled down to: ${installation} (${category} SIF Score: ${score})`);
  };

  if (loading) {
    return <div className="view-container"><p>Loading SIF Energy Heatmap...</p></div>;
  }

  if (!heatmap) {
    return <div className="view-container"><p>No heatmap data available.</p></div>;
  }

  return (
    <div className="view-container page-analytics-heatmap" style={{ padding: 0 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2>Operational Risk Heatmap: Installations vs. Energy Sources</h2>
          <p className="subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-muted, #94a3b8)' }}>
            Leading Indicator Heatmap — Click any cell to drill down into the corresponding installation's prioritized worklist.
          </p>
        </div>

        <button 
          onClick={() => setShowTable(!showTable)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #334155)',
            background: 'var(--bg-elevated, #1e293b)',
            color: 'var(--text-primary, #fafaf9)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          {showTable ? '📈 View Heatmap Grid' : '📋 View as Accessible Table'}
        </button>
      </div>

      <div className="heatmap-card" style={{ background: 'var(--bg-card, #141b2d)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '20px' }}>
        <div className="heatmap-legend" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span className="legend-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>SIF Precursor Risk Density:</span>
          <span className="legend-box" style={{ background: 'rgba(239, 68, 68, 0.85)', padding: '2px 8px', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>Critical (80-100)</span>
          <span className="legend-box" style={{ background: 'rgba(249, 115, 22, 0.75)', padding: '2px 8px', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>High (65-79)</span>
          <span className="legend-box" style={{ background: 'rgba(234, 179, 8, 0.65)', padding: '2px 8px', borderRadius: '4px', color: '#000', fontSize: '0.75rem', fontWeight: 700 }}>Medium (45-64)</span>
          <span className="legend-box" style={{ background: 'rgba(59, 130, 246, 0.45)', padding: '2px 8px', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>Low (25-44)</span>
          <span className="legend-box" style={{ background: 'rgba(100, 116, 139, 0.2)', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 700 }}>Minimal (&lt;25)</span>
        </div>

        {!showTable ? (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="heatmap-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="th-asset" style={{ padding: '10px', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asset / Field Installation</th>
                  {(heatmap.categories || []).map(cat => (
                    <th key={cat} className="th-cat" style={{ padding: '10px', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(heatmap.installations || []).map((inst, rowIdx) => (
                  <tr key={inst}>
                    <td className="td-asset-name" style={{ padding: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <strong>{inst}</strong>
                    </td>
                    {(heatmap.matrix?.[rowIdx] || []).map((score, colIdx) => (
                      <td
                        key={colIdx}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: getCellColor(score),
                          padding: '12px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          border: '2px solid var(--bg-card, #141b2d)',
                          transition: 'transform 0.15s ease'
                        }}
                        onClick={() => handleCellClick(inst, heatmap.categories?.[colIdx], score)}
                        title={`Click to inspect ${inst} - ${heatmap.categories?.[colIdx]} (Score: ${score})`}
                      >
                        <span className="cell-score" style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{score}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Accessible Table Equivalent (FR-4.11) */
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated, #1e293b)', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Installation</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Hazard Category</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>SIF Precursor Density Score</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Risk Tier</th>
                </tr>
              </thead>
              <tbody>
                {(heatmap.installations || []).flatMap((inst, rowIdx) =>
                  (heatmap.matrix?.[rowIdx] || []).map((score, colIdx) => {
                    const cat = heatmap.categories?.[colIdx];
                    const tier = score >= 80 ? 'Critical' : score >= 65 ? 'High' : score >= 45 ? 'Medium' : score >= 25 ? 'Low' : 'Minimal';
                    return (
                      <tr key={`${inst}-${cat}`} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{inst}</td>
                        <td style={{ padding: '10px 14px', color: '#60a5fa' }}>{cat}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff' }}>{score}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: score >= 65 ? '#f87171' : score >= 45 ? '#facc15' : '#4ade80' }}>{tier}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

