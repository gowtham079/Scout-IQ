import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({
  title = 'SYSTEM NOTICE',
  message = 'Failed to load telemetry from database.',
  onRetry = null
}) {
  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.08)',
      border: '2px solid var(--color-danger)',
      padding: '24px',
      margin: '20px 0',
      boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle size={20} color="var(--color-danger)" />
        <h4 style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '12px',
          color: 'var(--color-danger)',
          letterSpacing: '0.05em',
        }}>
          {title}
        </h4>
      </div>
      <p style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
        {message}
      </p>
      {onRetry && (
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={onRetry}
            className="pixel-btn"
            style={{
              background: 'transparent',
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
              fontSize: '10px',
              padding: '6px 12px',
            }}
          >
            <RefreshCw size={12} /> RETRY CONNECTION
          </button>
        </div>
      )}
    </div>
  );
}
