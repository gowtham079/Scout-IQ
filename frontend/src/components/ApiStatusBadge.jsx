import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Activity } from 'lucide-react';

export default function ApiStatusBadge() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          if (res && res.status === 'healthy') {
            setStatus('connected');
            setDetails(res.database?.database || 'MySQL');
          } else {
            setStatus('disconnected');
          }
        }
      } catch {
        if (isMounted) {
          setStatus('disconnected');
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="pixel-badge"
      title={status === 'connected' ? `Connected to Database: ${details}` : 'API / Database Offline'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      <span className={`status-dot ${status === 'connected' ? 'online' : status === 'checking' ? 'checking' : 'offline'}`} />
      <span style={{ fontSize: '9px', letterSpacing: '0.05em' }}>
        {status === 'connected' ? 'API LIVE' : status === 'checking' ? 'PINGING...' : 'API OFFLINE'}
      </span>
    </div>
  );
}
