import React from 'react';

export default function LoadingSpinner({ message = 'LOADING INTELLIGENCE...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: '16px',
    }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        <span style={{
          width: '10px',
          height: '10px',
          backgroundColor: 'var(--color-primary)',
          boxShadow: '2px 2px 0px #000',
          animation: 'pulse 0.6s infinite alternate',
        }} />
        <span style={{
          width: '10px',
          height: '10px',
          backgroundColor: 'var(--color-secondary)',
          boxShadow: '2px 2px 0px #000',
          animation: 'pulse 0.6s infinite alternate 0.2s',
        }} />
        <span style={{
          width: '10px',
          height: '10px',
          backgroundColor: 'var(--color-pitch)',
          boxShadow: '2px 2px 0px #000',
          animation: 'pulse 0.6s infinite alternate 0.4s',
        }} />
      </div>
      <p style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        letterSpacing: '0.08em',
      }}>
        {message}
      </p>
    </div>
  );
}
