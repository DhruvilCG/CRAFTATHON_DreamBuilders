import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginUser, registerUser, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'secure-comm-user';
const storedUser = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

if (storedUser?.token) {
  setAuthToken(storedUser.token);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return storedUser;
  });

  useEffect(() => {
    setAuthToken(user?.token);
  }, [user]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setAuthToken(data.token);
    setUser(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    setAuthToken(data.token);
    setUser(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
