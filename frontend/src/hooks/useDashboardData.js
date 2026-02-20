import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchEvents,
  fetchRisks,
  fetchOemExposure,
  fetchRegions,
} from '../services/api';
import mockData from '../data/mock-data.json';

function filterByRegionAndSeverity(items, region, minSeverity) {
  return items.filter((item) => {
    const matchesRegion = region === 'all' || item.region === region;
    const matchesSeverity = typeof item.severity === 'number' ? item.severity >= minSeverity : true;
    return matchesRegion && matchesSeverity;
  });
}

export function useDashboardData({ region = 'peru', severity = 0, oemId = 'FORD-NA' } = {}) {
  return useQuery(
    ['dashboard', region, severity, oemId],
    async () => {
      try {
        const [summary, events, risks, exposure, regions] = await Promise.all([
          fetchDashboardSummary(),
          fetchEvents({ region: region === 'all' ? undefined : region }),
          fetchRisks({ region: region === 'all' ? undefined : region, severity: severity || undefined }),
          fetchOemExposure(oemId),
          fetchRegions(),
        ]);

        return {
          summary,
          events: filterByRegionAndSeverity(events.data || events, region, severity),
          risks: filterByRegionAndSeverity(risks.data || risks, region, severity),
          exposure,
          regions: regions.data || regions,
          source: 'api',
          error: null,
        };
      } catch (error) {
        const { dashboardSummary, events, risks, oemExposure, regions } = mockData;
        return {
          summary: dashboardSummary,
          events: filterByRegionAndSeverity(events.data, region, severity),
          risks: filterByRegionAndSeverity(risks.data, region, severity),
          exposure: oemExposure,
          regions: regions.data,
          source: 'mock',
          error,
        };
      }
    },
    {
      staleTime: 5 * 60 * 1000,
    },
  );
}
