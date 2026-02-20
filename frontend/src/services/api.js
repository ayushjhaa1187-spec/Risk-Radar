import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT || 30000);

export const apiClient = axios.create({
  baseURL: apiBase,
  timeout: apiTimeout,
});

export async function fetchDashboardSummary(regions = 'peru,mexico,vietnam') {
  const { data } = await apiClient.get(`/api/dashboard-summary`, {
    params: { regions },
  });
  return data;
}

export async function fetchEvents(params = {}) {
  const { data } = await apiClient.get('/api/events', { params });
  return data.data || data;
}

export async function fetchRisks(params = {}) {
  const { data } = await apiClient.get('/api/risks', { params });
  return data.data || data;
}

export async function fetchOemExposure(oemId = 'FORD-NA', commodity = 'copper', horizonWeeks = 6) {
  const { data } = await apiClient.get('/api/oem-exposure', {
    params: { oem_id: oemId, commodity, time_horizon: horizonWeeks },
  });
  return data;
}

export async function fetchRegions() {
  const { data } = await apiClient.get('/api/regions');
  return data.data || data;
}
