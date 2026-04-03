import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const titles = {
  '/dashboard': 'Command Dashboard',
  '/monitoring': 'Real-Time Monitoring',
  '/alerts': 'Threat Alerts',
  '/network': 'Network Graph',
  '/logs': 'Historical Logs',
  '/simulation': 'Attack Simulation',
  '/users': 'User Management',
  '/settings': 'System Settings',
};

function statusClass(status) {
  if (status === 'Critical') return 'status-critical';
  if (status === 'Warning') return 'status-warning';
  return 'status-normal';
}

export default function Topbar({ onMenu, systemStatus }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="btn-muted" onClick={onMenu}>Menu</button>
        <div>
          <p className="eyebrow">Secure Operations</p>
          <h2>{titles[pathname] || 'Secure Dashboard'}</h2>
        </div>
      </div>

      <div className="topbar-right">
        <span className={`status-chip ${statusClass(systemStatus)}`}>{systemStatus}</span>
        <div className="identity-box">
          <p>{user?.name}</p>
          <p className="eyebrow">{user?.role}</p>
        </div>
        <button className="btn-danger" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
