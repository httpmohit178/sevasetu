export type Sensor = { id: string; name: string; area: string; kind: 'rain' | 'river' | 'soil' | 'temperature'; value: number; unit: string; state: string; updatedAt: string };
export type Incident = { id: string; title: string; area: string; kind: string; severity: 'Critical' | 'High' | 'Moderate'; status: 'New' | 'Dispatched' | 'Resolved'; time: string; detail: string };
export type OpsSnapshot = { sensors: Sensor[]; incidents: Incident[]; responders: { id: string; name: string; role: string; area: string; status: string }[]; resources: { id: string; name: string; available: number; unit: string }[]; generatedAt: string };

export const demoSnapshot: OpsSnapshot = {
  generatedAt: new Date().toISOString(),
  sensors: [
    { id: 's1', name: 'River gauge · Ghaghara', area: 'Bahraich, Uttar Pradesh', kind: 'river', value: 68, unit: '% bank-full', state: 'Monitoring', updatedAt: new Date().toISOString() },
    { id: 's2', name: 'Rainfall · Nanpara', area: 'Bahraich, Uttar Pradesh', kind: 'rain', value: 42, unit: 'mm / 3h', state: 'Elevated', updatedAt: new Date().toISOString() },
    { id: 's3', name: 'Soil moisture · Kaiserganj', area: 'Bahraich, Uttar Pradesh', kind: 'soil', value: 71, unit: '% saturation', state: 'Elevated', updatedAt: new Date().toISOString() },
    { id: 's4', name: 'Temperature · Gonda', area: 'Gonda, Uttar Pradesh', kind: 'temperature', value: 34, unit: '°C', state: 'Normal', updatedAt: new Date().toISOString() },
    { id: 's5', name: 'River gauge · Rapti', area: 'Balrampur, Uttar Pradesh', kind: 'river', value: 49, unit: '% bank-full', state: 'Normal', updatedAt: new Date().toISOString() },
    { id: 's6', name: 'Rainfall · Tulsipur', area: 'Balrampur, Uttar Pradesh', kind: 'rain', value: 19, unit: 'mm / 3h', state: 'Normal', updatedAt: new Date().toISOString() },
  ],
  incidents: [
    { id: 'INC-2048', title: 'Water entering low-lying homes', area: 'Nanpara · Bahraich', kind: 'Flood', severity: 'High', status: 'Dispatched', time: '8 min ago', detail: 'Community report: water rising near the eastern embankment.' },
    { id: 'INC-2047', title: 'Road access disrupted', area: 'Kaiserganj · Bahraich', kind: 'Access', severity: 'Moderate', status: 'New', time: '21 min ago', detail: 'Two-wheeler access only; bridge approach is waterlogged.' },
    { id: 'INC-2046', title: 'Drinking water needed', area: 'Tulsipur · Balrampur', kind: 'Supply', severity: 'Moderate', status: 'New', time: '43 min ago', detail: 'Village shelter requests clean water and ORS.' },
  ],
  responders: [ { id: 'r1', name: 'Asha response team', role: 'Field response', area: 'Nanpara', status: 'On route' }, { id: 'r2', name: 'PHC mobile unit', role: 'Medical', area: 'Bahraich', status: 'Available' }, { id: 'r3', name: 'Panchayat volunteers', role: 'Community', area: 'Kaiserganj', status: 'Available' } ],
  resources: [ { id: 'w1', name: 'Rescue boats', available: 4, unit: 'boats' }, { id: 'w2', name: 'Emergency kits', available: 86, unit: 'kits' }, { id: 'w3', name: 'Drinking water', available: 240, unit: 'cases' }, { id: 'w4', name: 'Medical teams', available: 3, unit: 'teams' } ],
};

export function riskModel(sensors: Sensor[]) {
  const avg = (kind: Sensor['kind']) => { const all = sensors.filter((s) => s.kind === kind); return all.length ? all.reduce((a, s) => a + s.value, 0) / all.length : 0; };
  const river = avg('river'), rain = avg('rain'), soil = avg('soil'), temp = avg('temperature');
  const flood = Math.min(100, Math.round(river * .55 + Math.min(100, rain / 1.2) * .3 + soil * .15));
  const heat = Math.min(100, Math.max(0, Math.round((temp - 25) * 5.5)));
  const score = Math.max(flood, heat);
  const level = score >= 75 ? 'Critical' : score >= 55 ? 'Elevated' : score >= 35 ? 'Guarded' : 'Low';
  const drivers = [
    { label: 'River level', value: Math.round(river), note: '55% of flood score' },
    { label: 'Recent rainfall', value: Math.round(Math.min(100, rain / 1.2)), note: '30% of flood score' },
    { label: 'Soil saturation', value: Math.round(soil), note: '15% of flood score' },
  ].sort((a, b) => b.value - a.value);
  const advice = flood >= heat ? (flood >= 65 ? 'Pre-position boats near low-lying settlements and verify shelter access before the next rainfall window.' : 'Keep embankment teams on watch; recheck river gauges in 30 minutes.') : 'Open shaded water points and check on older residents during peak afternoon heat.';
  return { score, level, flood, heat, drivers, advice };
}
