import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: '48px',
        color: 'var(--color-primary)',
        marginBottom: '16px',
      }}>
        404
      </div>
      <h2 className="pixel-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
        SECTOR OUT OF BOUNDS
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px' }}>
        The requested tactical scouting module or route does not exist in the ScoutIQ system.
      </p>
      <Link to="/" className="pixel-btn">
        <Home size={14} /> RETURN TO OVERVIEW
      </Link>
    </div>
  );
}
