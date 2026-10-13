import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, GitCompare, Shield, Trophy, BookmarkCheck, Menu, X } from 'lucide-react';
import { useShortlist } from '../context/ShortlistContext';
import ApiStatusBadge from './ApiStatusBadge';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count: shortlistCount } = useShortlist();

  const navItems = [
    { to: '/', label: 'OVERVIEW', icon: LayoutDashboard },
    { to: '/players', label: 'PLAYERS', icon: Users },
    { to: '/compare', label: 'COMPARE', icon: GitCompare },
    { to: '/teams', label: 'TEAMS', icon: Shield },
    { to: '/rankings', label: 'RANKINGS', icon: Trophy },
    { to: '/shortlist', label: 'SHORTLIST', icon: BookmarkCheck, badge: shortlistCount },
  ];

  return (
    <header style={{
      background: 'var(--color-bg-surface)',
      borderBottom: '2px solid var(--border-color-pixel)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    }}>
      <div className="app-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
      }}>
        {/* Brand Logo */}
        <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--color-primary)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-pixel)',
            fontSize: '14px',
            padding: '6px 8px',
            boxShadow: '2px 2px 0px #000',
            fontWeight: 800,
          }}>
            IQ
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '15px',
              color: 'var(--text-primary)',
              letterSpacing: '0.06em',
            }}>
              SCOUT<span style={{ color: 'var(--color-primary)' }}>IQ</span>
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--color-secondary)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Superliga 25/26
            </div>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '4px' }} className="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={item.to === '/'}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--color-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: '9px',
                    fontWeight: 800,
                    borderRadius: '999px',
                    padding: '1px 5px',
                    marginLeft: '2px',
                    lineHeight: '1',
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Status Indicator & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ApiStatusBadge />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color-pixel)',
              color: 'var(--text-primary)',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-toggle-btn"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={{
          background: 'var(--color-bg-surface-elevated)',
          borderBottom: '2px solid var(--border-color-pixel)',
          padding: '16px 24px',
        }} className="mobile-menu">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  end={item.to === '/'}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span style={{
                      background: 'var(--color-primary)',
                      color: 'var(--text-inverse)',
                      fontSize: '9px',
                      fontWeight: 800,
                      borderRadius: '999px',
                      padding: '1px 6px',
                      marginLeft: '6px',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}

      {/* Responsive media query styles */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle-btn { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </header>
  );
}
