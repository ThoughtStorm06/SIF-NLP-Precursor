import React, { useState } from 'react';

export const CorrelationCenterpiece = ({ correlationData }) => {
  const [showTable, setShowTable] = useState(false);

  if (!correlationData) return null;

  const { badge, headline, interpretation, correlationCoefficient, facilities } = correlationData;

  return (
    <div 
      className="correlation-centerpiece-card"
      style={{
        background: 'var(--bg-card, #141b2d)',
        borderRadius: '12px',
        border: '2px solid var(--accent-primary, #3b82f6)',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md, 0 4px 20px rgba(0, 0, 0, 0.2))',
        position: 'relative',
        color: 'var(--text-primary, #fafaf9)'
      }}
    >
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
            Core Evidence: Leading-vs-Lagging Correlation View
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="evidence-badge" style={{
            background: 'rgba(234, 179, 8, 0.2)',
            color: 'var(--sif-medium, #eab308)',
            border: '1px solid var(--sif-medium, #eab308)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>⏳</span> {badge || 'Building evidence — 12 months of data collected'}
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
            {showTable ? '📈 View Visual Chart' : '📋 View as Table'}
          </button>
        </div>
      </div>

      {/* Headline Takeaway */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.12)',
        borderLeft: '4px solid var(--accent-primary, #3b82f6)',
        padding: '14px 18px',
        borderRadius: '0 8px 8px 0',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-card-headline, #60a5fa)', fontWeight: 700 }}>
          {headline}
        </h4>
        <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.5 }}>
          {interpretation} (Correlation Coefficient r = {correlationCoefficient})
        </p>
      </div>

      {!showTable ? (
        /* Visual Chart Simulation */
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>
            <span>FACILITY INSTALLATION</span>
            <span>PRECURSOR REPORTING RATE (LEADING) VS TRIR INCIDENT RATE (LAGGING)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(facilities || []).map(fac => (
              <div key={fac.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '190px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary, #fafaf9)' }}>
                  {fac.name}
                </div>

                {/* Precursor Rate Bar */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-card-headline, #60a5fa)', fontWeight: 700 }}>Precursor Rate: {fac.precursorRate}%</span>
                    <span style={{ color: 'var(--sif-critical, #ef4444)', fontWeight: 700 }}>TRIR: {fac.trir}</span>
                  </div>

                  <div style={{ position: 'relative', height: '14px', background: 'var(--border-color, #334155)', borderRadius: '7px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${fac.precursorRate}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                      borderRadius: '7px'
                    }}></div>
                  </div>
                </div>

                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: fac.trir < 1.0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: fac.trir < 1.0 ? '#4ade80' : '#f87171',
                  border: `1px solid ${fac.trir < 1.0 ? '#22c55e' : '#ef4444'}`,
                  minWidth: '160px',
                  textAlign: 'center'
                }}>
                  {fac.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Accessible Table Equivalent (FR-4.11) */
        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated, #1e293b)', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Installation Name</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Precursor Rate (Leading)</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>TRIR (Lagging)</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>LTIFR Rate</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Safety Status</th>
              </tr>
            </thead>
            <tbody>
              {(facilities || []).map(fac => (
                <tr key={fac.name} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{fac.name}</td>
                  <td style={{ padding: '10px 14px', color: '#60a5fa', fontWeight: 700 }}>{fac.precursorRate}%</td>
                  <td style={{ padding: '10px 14px', color: '#f87171', fontWeight: 700 }}>{fac.trir}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{fac.ltifr}</td>
                  <td style={{ padding: '10px 14px', color: fac.trir < 1.0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>{fac.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
