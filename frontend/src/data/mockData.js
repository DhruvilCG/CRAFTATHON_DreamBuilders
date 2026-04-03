export const mockUsers = [
  { id: 'u1', name: 'Col. Aryan Singh', email: 'admin@mil.local', role: 'Admin', password: 'admin123' },
  { id: 'u2', name: 'Analyst Meera', email: 'analyst@mil.local', role: 'Analyst', password: 'analyst123' },
  { id: 'u3', name: 'Operator Kabir', email: 'operator@mil.local', role: 'Operator', password: 'operator123' },
];

export const seedTrafficSeries = [
  { time: '10:00', normal: 240, attack: 14, total: 254 },
  { time: '10:05', normal: 260, attack: 11, total: 271 },
  { time: '10:10', normal: 248, attack: 18, total: 266 },
  { time: '10:15', normal: 285, attack: 16, total: 301 },
  { time: '10:20', normal: 272, attack: 22, total: 294 },
  { time: '10:25', normal: 292, attack: 15, total: 307 },
];

export const seedLiveTraffic = [
  { id: 't1', source: '10.0.1.12', destination: '10.0.3.20', protocol: 'TCP', packetSize: 450, time: '10:25:21', status: 'Normal', severity: 'Low', attackType: 'None' },
  { id: 't2', source: '10.0.2.4', destination: '10.0.7.9', protocol: 'UDP', packetSize: 780, time: '10:25:24', status: 'Attack', severity: 'High', attackType: 'DDoS' },
  { id: 't3', source: '172.16.2.11', destination: '10.0.3.45', protocol: 'ICMP', packetSize: 520, time: '10:25:27', status: 'Normal', severity: 'Low', attackType: 'None' },
  { id: 't4', source: '10.0.5.17', destination: '10.0.8.3', protocol: 'TCP', packetSize: 910, time: '10:25:29', status: 'Warning', severity: 'Medium', attackType: 'Spoofing' },
];

export const seedAlerts = [
  { id: 'a1', message: 'Unusual UDP flood pattern detected near node 10.0.2.4', severity: 'High', timestamp: '2026-04-03T10:25:24Z', attackType: 'DDoS' },
  { id: 'a2', message: 'Repeated failed key exchange from 10.0.5.17', severity: 'Medium', timestamp: '2026-04-03T10:22:10Z', attackType: 'Spoofing' },
  { id: 'a3', message: 'Packet jitter spike resolved automatically', severity: 'Low', timestamp: '2026-04-03T10:19:44Z', attackType: 'None' },
];

export const seedNetwork = {
  nodes: [
    { id: 'HQ', x: 100, y: 90, status: 'Normal', detail: 'Headquarters router' },
    { id: 'SAT-1', x: 280, y: 70, status: 'Normal', detail: 'Satellite uplink station' },
    { id: 'FWD-2', x: 420, y: 170, status: 'Suspicious', detail: 'Forward relay outpost' },
    { id: 'DRN-5', x: 240, y: 220, status: 'Normal', detail: 'Drone control endpoint' },
    { id: 'OPS', x: 80, y: 220, status: 'Warning', detail: 'Operations command node' },
  ],
  edges: [
    { from: 'HQ', to: 'SAT-1' },
    { from: 'SAT-1', to: 'FWD-2' },
    { from: 'HQ', to: 'OPS' },
    { from: 'OPS', to: 'DRN-5' },
    { from: 'DRN-5', to: 'FWD-2' },
  ],
};
