import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Database, ShieldCheck } from 'lucide-react';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '32px 0 64px 0' }}>
        <div className="app-container">
          <Outlet />
        </div>
      </main>

      <footer style={{
        background: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--border-color-pixel)',
        padding: '24px 0',
        color: 'var(--text-muted)',
        fontSize: '13px',
      }}>
        <div className="app-container" style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--color-primary)' }}>
              SCOUTIQ v1.0
            </span>
            <span>— Danish Superliga 2025/2026 Analytical Intelligence</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} color="var(--color-secondary)" /> MySQL Relational Views
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--color-pitch)" /> FastAPI Engine
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
