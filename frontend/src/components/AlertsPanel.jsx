import React from 'react';
import { useAppData } from '../context/AppDataContext.jsx';

export default function AlertsPanel() {
  const { recentAlerts } = useAppData();

  const severityColor = (severity) => {
    if (severity === 'Critical') return '#ff4444';
    if (severity === 'High') return '#ff8844';
    if (severity === 'Medium') return '#ffaa00';
    return '#88aa88';
  };

  if (recentAlerts.length === 0) {
    return (
      <section className="panel">
        <h3 style={{ marginBottom: 10 }}>🚨 Real-Time Alerts</h3>
        <div style={{ color: 'var(--txt-dim)', fontSize: 14, padding: 12 }}>
          No anomalies detected yet. All traffic is normal.
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h3 style={{ marginBottom: 10 }}>🚨 Real-Time Alerts</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
        {recentAlerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              background: `${severityColor(alert.severity)}20`,
              border: `2px solid ${severityColor(alert.severity)}`,
              borderRadius: 6,
              padding: 10,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 'bold', color: severityColor(alert.severity) }}>
              [{alert.severity}] {alert.message}
            </div>
            <div style={{ color: 'var(--txt-dim)', fontSize: 11, marginTop: 4 }}>
              {alert.source} → {alert.destination} • {alert.timestamp.toLocaleTimeString([], { hour12: false })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
