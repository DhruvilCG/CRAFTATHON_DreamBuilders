import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAppData } from '../context/AppDataContext.jsx';

const attacks = ['DDoS', 'Spoofing', 'Intrusion'];

export default function SimulationPage() {
  const [attackType, setAttackType] = useState('DDoS');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { simulateAttack } = useAppData();

  const canSimulate = user?.role === 'Admin' || user?.role === 'Analyst';

  const handleSimulate = async () => {
    if (!canSimulate) return;
    try {
      setError('');
      await simulateAttack(attackType);
      setMessage(`${attackType} scenario generated successfully.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Simulation failed. Check backend/Python service.');
    }
  };

  return (
    <div className="grid-2">
      <section className="panel">
        <h3>Attack Simulation</h3>
        <p style={{ marginTop: 8, color: 'var(--txt-dim)' }}>Generate controlled anomalies to validate alerting and dashboard behavior.</p>

        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <label>
            Select attack type
            <select className="input" value={attackType} onChange={(e) => setAttackType(e.target.value)}>
              {attacks.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <button className="btn-danger" onClick={handleSimulate} disabled={!canSimulate}>
            Simulate Attack
          </button>

          {!canSimulate ? (
            <div className="info-box">
              Only Admin and Analyst roles can trigger simulations.
            </div>
          ) : null}

          {message ? (
            <div className="success-box">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="error-box">
              {error}
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h3>Simulation Notes</h3>
        <ul style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          <li>- Adds anomaly traffic records to monitoring and logs</li>
          <li>- Pushes high-severity alert notifications</li>
          <li>- Updates dashboard charts and system status</li>
        </ul>
      </section>
    </div>
  );
}
