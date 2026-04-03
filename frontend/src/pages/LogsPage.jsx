import React, { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';

export default function LogsPage() {
  const { logs } = useAppData();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [attackType, setAttackType] = useState('All');

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
      <section className="panel controls-row">
        <input className="input" placeholder="Search source or destination" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="input" value={attackType} onChange={(e) => setAttackType(e.target.value)}>
          <option>All</option>
          <option>None</option>
          <option>DDoS</option>
          <option>Spoofing</option>
          <option>Intrusion</option>
        </select>
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 10 }}>Historical Logs</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : row.time}</td>
                  <td>{row.source}</td>
                  <td>{row.destination}</td>
                  <td>{row.status}</td>
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
