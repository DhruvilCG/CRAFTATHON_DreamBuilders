import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission, PERMISSIONS } from '../utils/rolePermissions.js';

export default function RoleGate({ 
  children, 
  requiredRoles = [],
  requiredPermission = null,
  fallback = null 
}) {
  const { user } = useAuth();

  // Check if user is authenticated
  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRoles.length && !requiredRoles.includes(user.role)) {
    return fallback || (
      <main className="home-page">
        <div className="error-box">
          <h2>Access Denied</h2>
          <p>Your role ({user.role}) does not have access to this resource.</p>
        </div>
      </main>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return fallback || null;
  }

  return children;
}

