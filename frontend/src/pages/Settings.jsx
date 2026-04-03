import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';

export default function Settings() {
  const { settings, setSettings } = useAppData();
  const [saved, setSaved] = useState(false);

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  };

  const handleSave = () => {
    setSettings({ ...settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="page-stack">
      <section className="panel">
        <h2>System Settings</h2>

        {saved ? (
          <div className="success-box" style={{ marginTop: 10 }}>Settings saved successfully!</div>
        ) : null}

        <div className="stats-grid" style={{ marginTop: 10 }}>
          <article className="panel">
            <h3>Dashboard</h3>
            <label className="setting-item">
              <span>Refresh interval (seconds)</span>
              <input
                className="input"
                type="number"
                min={1}
                max={60}
                value={settings.refreshInterval}
                onChange={(e) =>
                  handleChange('refreshInterval', Number(e.target.value))
                }
              />
            </label>
          </article>

          <article className="panel">
            <h3>Alerts</h3>
            <label className="setting-item">
              <span>Alert threshold (%)</span>
              <input
                className="input"
                type="range"
                min={0}
                max={100}
                value={settings.alertThreshold}
                onChange={(e) =>
                  handleChange('alertThreshold', Number(e.target.value))
                }
              />
              <span>{settings.alertThreshold}%</span>
            </label>
          </article>

          <article className="panel">
            <h3>Display</h3>
            <label className="setting-item">
              <span>Theme</span>
              <select
                className="input"
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                <option value="dark">Dark (Military)</option>
                <option value="light">Light</option>
                <option value="blue">Blue</option>
              </select>
            </label>
          </article>
        </div>

        <button className="btn-primary" style={{ marginTop: 10 }} onClick={handleSave}>
          Save Settings
        </button>
      </section>
    </main>
  );
}
