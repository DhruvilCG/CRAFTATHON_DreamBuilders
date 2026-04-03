import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_DESCRIPTIONS } from '../utils/rolePermissions.js';

export default function RoleInfo() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const roleInfo = ROLE_DESCRIPTIONS[user.role];
  
  if (!roleInfo) return null;
  
  return (
    <div className="role-info-card">
      <div className="role-badge">
        <span className="role-title">{roleInfo.title}</span>
      </div>
      <p className="role-description">{roleInfo.description}</p>
      <div className="role-capabilities">
        <h4>Your Capabilities:</h4>
        <ul>
          {roleInfo.capabilities.map((cap, idx) => (
            <li key={idx}>{cap}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
