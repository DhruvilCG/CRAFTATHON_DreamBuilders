import React, { useMemo, useState } from 'react';
import ShareLogsPanel from '../components/ShareLogsPanel.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { getStatusRowClass, getThreatCategory } from '../utils/trafficDisplay.js';

export default function LogsPage() {
  const { logs } = useAppData();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [attackType, setAttackType] = useState('All');
  const [shareOpen, setShareOpen] = useState(false);

  const openDatePicker = (event) => {
    event.currentTarget.showPicker?.();
  };

  const rows = useMemo(() => {
    return logs.filter((item) => {
      const q = query.trim().toLowerCase();
      const hitQuery = !q || item.source.toLowerCase().includes(q) || item.destination.toLowerCase().includes(q);
      const hitType = attackType === 'All' || item.attackType === attackType;
      const itemDate = item.timestamp ? item.timestamp.slice(0, 10) : '';
      const hitDate = !date || itemDate === date;
      return hitQuery && hitType && hitDate;
    });
  }, [logs, query, date, attackType]);

  return (
    <div className="page-stack">
      <section className="panel controls-row controls-column">
        <label className="setting-item" style={{ marginTop: 0 }}>
          <span>Search by source or destination</span>
          <input className="input" placeholder="Search source or destination" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        <label className="setting-item" style={{ marginTop: 0 }}>
          <span>Select date</span>
          <div className="date-input-wrap">
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={openDatePicker}
              onClick={openDatePicker}
            />
            <button type="button" className="btn-muted picker-btn" onClick={(e) => e.currentTarget.previousElementSibling?.showPicker?.()}>
              Calendar
            </button>
          </div>
        </label>

        <label className="setting-item" style={{ marginTop: 0 }}>
          <span>Filter by attack type</span>
          <select className="input" value={attackType} onChange={(e) => setAttackType(e.target.value)}>
            <option>All</option>
            <option>DDoS</option>
            <option>Spoofing</option>
            <option>Intrusion</option>
            <option>None</option>
          </select>
        </label>
      </section>

      <ShareLogsPanel
        open={shareOpen}
        logs={logs}
        onClose={() => setShareOpen(false)}
      />

      <section className="panel">
        <div className="panel-title-row logs-title-row">
          <div>
            <h3>Historical Logs</h3>
            <span style={{ color: 'var(--txt-dim)', fontSize: 13 }}>Loaded from MongoDB. Showing {rows.length} filtered rows.</span>
          </div>
          <button className="btn-primary share-logs-button" type="button" onClick={() => setShareOpen((value) => !value)}>
            Share Logs
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Protocol</th>
                <th>Packet Size</th>
                <th>Status</th>
                <th>Threat Category</th>
                <th>Availability</th>
                <th>Integrity</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row._id || row.id || `${row.source}-${row.destination}-${row.timestamp || index}`}>
                  <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : row.time}</td>
                  <td>{row.source}</td>
                  <td>{row.destination}</td>
                  <td>{row.protocol || '-'}</td>
                  <td>{row.packetSize ?? '-'}</td>
                  <td className={getStatusRowClass(row.status)}>{row.status}</td>
                  <td>{getThreatCategory(row)}</td>
                  <td>{row.signalAvailability ?? '-'}</td>
                  <td>{row.signalIntegrity ?? '-'}</td>
                  <td>{row.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
