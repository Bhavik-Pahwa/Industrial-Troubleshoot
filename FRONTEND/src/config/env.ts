export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  appName: 'INDUX',
  appTagline: 'Industrial Telemetry Monitoring & Incident Intelligence',
  version: '0.1.0',
  defaultPageLimit: 50,
  maxPageLimit: 200,
  pollingIntervalMs: 15000, // 15 seconds configurable
};

