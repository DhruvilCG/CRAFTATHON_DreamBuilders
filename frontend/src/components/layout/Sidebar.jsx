import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { canAccessPage } from '../../utils/rolePermissions.js';

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', page: 'dashboard' },
  { to: '/monitoring', label: 'Real-Time Monitoring', page: 'monitoring' },
  { to: '/alerts', label: 'Alerts', page: 'alerts' },
  { to: '/network', label: 'Network Graph', page: 'network' },
  { to: '/logs', label: 'Logs', page: 'logs' },
  { to: '/simulation', label: 'Attack Simulation', page: 'simulation' },
  { to: '/users', label: 'User Management', page: 'users' },
  { to: '/settings', label: 'Settings', page: 'settings' },
];

export default function Sidebar({ open, setOpen }) {
  const { user } = useAuth();
  const role = user?.role || 'Monitor';

  // Filter nav items based on user role
  const links = allNavItems.filter((item) => canAccessPage(role, item.page));

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-title">
        <p className="sidebar-kicker">Secure Military</p>
        <h1>Comm Monitoring</h1>
      </div>

      <nav className="sidebar-nav">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
