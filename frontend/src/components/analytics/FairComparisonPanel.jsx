import React, { useState } from 'react';

export const FairComparisonPanel = ({ contractorData, onDrillDown }) => {
  const [showTable, setShowTable] = useState(false);

  if (!contractorData) return null;

  const { headline, framingPrinciple, disclaimer, contractors } = contractorData;

  return (
    <div 
      className="fair-comparison-card"
      style={{
        background: 'var(--bg-card, #141b2d)',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #334155)',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
        color: 'var(--text-primary, #fafaf9)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
            Fair Contractor & Site Safety Support (FR-4.6 / EC-2 Compliance)
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
            {framingPrinciple} — Pattern-spotting & targeted safety support (No individual worker ranking/blame)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            background: 'rgba(34, 197, 94, 0.2)',
            color: '#4ade80',
            border: '1px solid #22c55e',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            🛡️ Non-Punitive Fair Comparison Mode Active
          </span>

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
            {showTable ? '📈 View Visual Layout' : '📋 View as Table'}
          </button>
        </div>
      </div>

      {/* Headline */}
      <div style={{
        background: 'rgba(234, 179, 8, 0.12)',
        borderLeft: '4px solid #eab308',
        padding: '12px 16px',
        borderRadius: '0 8px 8px 0',
        marginBottom: '20px',
        fontSize: '0.95rem',
        fontWeight: 600,
        color: 'var(--sif-medium, #facc15)'
      }}>
        {headline}
        {disclaimer && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', fontWeight: 400 }}>{disclaimer}</div>}
      </div>

      {!showTable ? (
        /* Contractor List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(contractors || []).map((c) => (
            <div 
              key={c.name}
              style={{
                border: '1px solid var(--border-color, #334155)',
                borderRadius: '8px',
                padding: '14px 18px',
                background: 'var(--bg-elevated, #1e293b)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary, #fafaf9)' }}>
                    {c.name}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: c.status === 'Support Focus' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: c.status === 'Support Focus' ? '#f87171' : '#60a5fa',
                    border: `1px solid ${c.status === 'Support Focus' ? '#ef4444' : '#3b82f6'}`
                  }}>
                    {c.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                  Top Identified Hazard: <strong style={{ color: 'var(--text-secondary, #cbd5e1)' }}>{c.topHazard}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '160px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #fafaf9)' }}>
                  {c.ratePer10kHours} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted, #94a3b8)' }}>/ 10k hrs</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {c.precursorCount} precursor incidents captured
                </div>
              </div>

              <div style={{
                width: '100%',
                background: 'var(--bg-subtle, #0a0a0a)',
                border: '1px dashed var(--border-color, #334155)',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary, #cbd5e1)',
                fontWeight: 600
              }}>
                💡 {c.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Accessible Data Table (FR-4.11) */
        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated, #1e293b)', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Contractor Organization</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Precursors Captured</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Normalized Rate (/ 10k hrs)</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Top Hazard Focus</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Recommended Safety Action</th>
              </tr>
            </thead>
            <tbody>
              {(contractors || []).map(c => (
                <tr key={c.name} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{c.precursorCount}</td>
                  <td style={{ padding: '10px 14px', color: '#60a5fa', fontWeight: 700 }}>{c.ratePer10kHours}</td>
                  <td style={{ padding: '10px 14px', color: '#facc15' }}>{c.topHazard}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{c.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

