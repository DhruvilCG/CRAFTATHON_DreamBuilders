import React from 'react';

const severityClassMap = {
  Low: 'sev-low',
  Medium: 'sev-medium',
  High: 'sev-high',
  Critical: 'sev-critical',
};

export default function Alerts({ alerts = [] }) {
  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2>Live Alert Stream</h2>
      </div>
      <div className="alerts-list">
        {alerts.length === 0 ? (
          <p className="empty-state">No active alerts in the selected window.</p>
        ) : (
          alerts.slice(0, 12).map((alert) => (
            <article
              key={alert._id}
              className={`alert-item ${severityClassMap[alert.severity] || 'sev-medium'}`}
            >
              <div>
                <h4>{alert.message}</h4>
                <p>{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
              <span>{alert.severity}</span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
