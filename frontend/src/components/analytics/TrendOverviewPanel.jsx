import React, { useState } from 'react';

export const TrendOverviewPanel = ({ trendsData, onDrillDown }) => {
  const [showTable, setShowTable] = useState(false);

  if (!trendsData) return null;

  const { headline, delta, isSignificant, monthlyTrends, categoryBreakdown } = trendsData;

  return (
    <div 
      className="trend-overview-card"
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
            1.0 Precursor Rate & Energy Category Trends Over Time
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
            PRD Requirement FR-4.1 — Plain-language takeaway headline paired with statistical significance indicator
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSignificant && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              border: '1px solid #ef4444',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              ⚡ Statistically Meaningful Delta ({delta})
            </span>
          )}

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

      {/* Mandatory Plain-Language Headline Banner (FR-4.1) */}
      <div style={{
        background: 'var(--bg-elevated, #1e293b)',
        borderLeft: '4px solid #ef4444',
        padding: '14px 18px',
        borderRadius: '0 8px 8px 0',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171', lineHeight: 1.4 }}>
          📌 Headline: {headline}
        </div>
      </div>

      {!showTable ? (
        <>
          {/* Monthly Trend Bars with Clickable Drill-Down (FR-4.2) */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '12px', fontWeight: 600 }}>
              Monthly SIF Precursor Rate (%) & Incident Volume (Click any month to drill down)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', alignItems: 'flex-end', height: '240px', paddingTop: '20px' }}>
              {(monthlyTrends || []).map((item) => (
                <div 
                  key={item.month}
                  onClick={() => onDrillDown && onDrillDown({ month: item.month })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                  className="trend-bar-wrapper"
                  title={`Click to inspect ${item.month} reports (${item.critical_high} High SPS cases)`}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                    {item.precursor_rate}%
                  </span>

                  {/* Bar track */}
                  <div style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: `${item.precursor_rate * 2.2}px`,
                    background: 'linear-gradient(180deg, #ef4444 0%, #f97316 100%)',
                    borderRadius: '6px 6px 0 0',
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}>
                  </div>

                  <span style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)' }}>
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown Chips */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '10px', fontWeight: 600 }}>
              Precursor Distribution by Energy Source (9,129 Incident Narratives from sample.csv)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {(categoryBreakdown || []).map((cat) => (
                <div 
                  key={cat.category}
                  onClick={() => onDrillDown && onDrillDown({ energy_source: cat.category })}
                  style={{
                    background: 'var(--bg-elevated, #1e293b)',
                    border: '1px solid var(--border-color, #334155)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>{cat.category}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #fafaf9)' }}>{cat.count.toLocaleString()}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa' }}>{cat.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Accessible Table Equivalent (FR-4.11) */
        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated, #1e293b)', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Analysis Month</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Total Reports</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Critical & High Precursors</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>Precursor Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              {(monthlyTrends || []).map(item => (
                <tr key={item.month} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.month}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{item.total}</td>
                  <td style={{ padding: '10px 14px', color: '#f87171', fontWeight: 700 }}>{item.critical_high}</td>
                  <td style={{ padding: '10px 14px', color: '#60a5fa', fontWeight: 700 }}>{item.precursor_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

