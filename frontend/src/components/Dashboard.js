import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PIE_COLORS = ['#3ba55d', '#f15156'];

function toTrafficTrend(traffic) {
  const recent = [...traffic].reverse().slice(-24);
  return recent.map((item, index) => ({
    t: index + 1,
    packet: item.packetSize,
    duration: Number(item.duration),
  }));
}

export default function Dashboard({ traffic, stats }) {
  const trendData = useMemo(() => toTrafficTrend(traffic), [traffic]);

  const statusData = useMemo(() => {
    const map = stats.trafficByStatus?.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    return [
      { name: 'Normal', value: map?.Normal || 0 },
      { name: 'Anomaly', value: map?.Anomaly || 0 },
    ];
  }, [stats]);

  const severityData = useMemo(() => {
    const order = ['Low', 'Medium', 'High', 'Critical'];
    const map = stats.alertsBySeverity?.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return order.map((severity) => ({
      severity,
      count: map?.[severity] || 0,
    }));
  }, [stats]);

  return (
    <section className="panel dashboard-panel">
      <div className="panel-title-row">
        <h2>Traffic Intelligence Dashboard</h2>
      </div>

      <div className="chart-grid">
        <article className="chart-card">
          <h3>Real-time Traffic Pattern</h3>
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="packet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3ba55d" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3ba55d" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="duration" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f6bd38" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f6bd38" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#33423f" />
              <XAxis dataKey="t" stroke="#96a59f" />
              <YAxis stroke="#96a59f" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="packet" stroke="#3ba55d" fill="url(#packet)" />
              <Area type="monotone" dataKey="duration" stroke="#f6bd38" fill="url(#duration)" />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card">
          <h3>Normal vs Abnormal Distribution</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
                fill="#3ba55d"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card wide">
          <h3>Alert Severity Overview</h3>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33423f" />
              <XAxis dataKey="severity" stroke="#96a59f" />
              <YAxis stroke="#96a59f" />
              <Tooltip />
              <Bar dataKey="count" fill="#f15156" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </div>
    </section>
  );
}
