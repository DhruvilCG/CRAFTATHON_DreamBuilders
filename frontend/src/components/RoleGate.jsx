import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoleGate({ children, requiredRoles = [] }) {
  const { user } = useAuth();

  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length && !requiredRoles.includes(user.role)) {
    return (
      <main className="home-page">
        <div className="error-box">
          <h2>Access Denied</h2>
          <p>Your role ({user.role}) does not have access to this page.</p>
        </div>
      </main>
    );
  }

  return children;
}
