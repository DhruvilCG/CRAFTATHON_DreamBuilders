import React, { useEffect, useMemo, useState } from 'react';
import Alerts from '../components/Alerts';
import Dashboard from '../components/Dashboard';
import Logs from '../components/Logs';
import NetworkGraph from '../components/NetworkGraph';
import SimulationControls from '../components/SimulationControls';
import SummaryCards from '../components/SummaryCards';
import { useAuth } from '../context/AuthContext';
import { fetchAlerts, fetchStats, fetchTraffic, simulateTraffic } from '../services/api';

const POLL_MS = 6000;

function getRoleLabel(role) {
  if (role === 'Monitor') return 'Operator';
  return role || 'Operator';
}

export default function Home() {
  const { user, logout } = useAuth();
  const [traffic, setTraffic] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalTraffic: 0,
    totalAlerts: 0,
    alertsBySeverity: [],
    trafficByStatus: [],
    recentAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setError('');
    try {
      const [trafficData, alertData, statsData] = await Promise.all([
        fetchTraffic(),
        fetchAlerts(),
        fetchStats(),
      ]);
      setTraffic(trafficData);
      setAlerts(alertData);
      setStats(statsData);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch dashboard data.');
      if (err?.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user]);

  const onSimulate = async (type) => {
    try {
      await simulateTraffic(type);
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Simulation failed.');
    }
  };

  return (
    <main className="home-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Secure Military Communication Monitoring System</p>
          <h1>Operational Threat Dashboard</h1>
        </div>
        <div className="topbar-right">
          <div className="identity-box">
            <span>{user?.name}</span>
            <p>{roleLabel}</p>
          </div>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      {loading ? (
        <div className="loading-box">Loading command center data...</div>
      ) : (
        <>
          <SummaryCards stats={stats} />
          <SimulationControls onSimulate={onSimulate} role={user?.role} />
          <Dashboard traffic={traffic} stats={stats} />
          <div className="double-grid">
            <Alerts alerts={alerts} />
            <NetworkGraph traffic={traffic} />
          </div>
          <Logs traffic={traffic} />
        </>
      )}
    </main>
  );
}
