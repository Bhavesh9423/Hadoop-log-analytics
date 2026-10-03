const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch backend health status');
    return res.json();
  },

  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Failed to fetch configuration');
    return res.json();
  },

  async setConfig(mode) {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update mode');
    return data;
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  async analyze(mode) {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Analysis failed');
    return data;
  },

  async loadSample(mode = 'local') {
    const res = await fetch(`${API_BASE}/load-sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load sample dataset');
    return data;
  },

  async getSummary() {
    const res = await fetch(`${API_BASE}/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  async getStatusCodes() {
    const res = await fetch(`${API_BASE}/status-codes`);
    if (!res.ok) throw new Error('Failed to fetch status codes');
    return res.json();
  },

  async getUrls(limit = 10) {
    const res = await fetch(`${API_BASE}/urls?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch top URLs');
    return res.json();
  },

  async getIps(limit = 10) {
    const res = await fetch(`${API_BASE}/ips?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch top IPs');
    return res.json();
  },

  async getMethods() {
    const res = await fetch(`${API_BASE}/methods`);
    if (!res.ok) throw new Error('Failed to fetch HTTP methods');
    return res.json();
  },

  async getTraffic(granularity = 'hourly') {
    const res = await fetch(`${API_BASE}/traffic?granularity=${granularity}`);
    if (!res.ok) throw new Error('Failed to fetch traffic');
    return res.json();
  },

  async getErrors() {
    const res = await fetch(`${API_BASE}/errors`);
    if (!res.ok) throw new Error('Failed to fetch error analysis');
    return res.json();
  },

  async getPipeline() {
    const res = await fetch(`${API_BASE}/pipeline`);
    if (!res.ok) throw new Error('Failed to fetch pipeline stages');
    return res.json();
  },

  async getLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    if (params.method) query.append('method', params.method);
    if (params.url) query.append('url', params.url);
    if (params.ip) query.append('ip', params.ip);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/logs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  getExportJsonUrl() {
    return `${API_BASE}/export/json`;
  },

  getExportCsvUrl() {
    return `${API_BASE}/export/csv`;
  }
};
