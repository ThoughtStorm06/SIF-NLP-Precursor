import React, { useState } from 'react';
import { Button } from '../common/Button.jsx';

export const InlineOverridePicker = ({ reportId, onCancel, onConfirm }) => {
  const [reasonCode, setReasonCode] = useState('');
  
  const reasonOptions = [
    { code: 'FR-4A', label: 'False positive energy presence' },
    { code: 'FR-4B', label: 'Barrier actually verified effective' },
    { code: 'FR-4C', label: 'Routine task misclassified as High Risk' },
    { code: 'FR-4D', label: 'Other (requires comment in detail view)' }
  ];

  const handleConfirm = () => {
    if (reasonCode) {
      onConfirm(reasonCode);
    }
  };

  return (
    <div className="inline-override-picker">
      <div className="picker-content">
        <label>Select Override Reason Code:</label>
        <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className="form-control-sm">
          <option value="" disabled>Select reason...</option>
          {reasonOptions.map(opt => (
            <option key={opt.code} value={opt.code}>{opt.code}: {opt.label}</option>
          ))}
        </select>
        <div className="picker-actions">
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!reasonCode}>Confirm Override</Button>
        </div>
      </div>
    </div>
  );
};
