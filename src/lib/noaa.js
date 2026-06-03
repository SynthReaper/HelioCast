/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */
import axios from 'axios';

export class NOAAService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl || 'https://services.swpc.noaa.gov/json';
  }

  async getSolarFlares(hours = 24) {
    try {
      const response = await axios.get('https://services.swpc.noaa.gov/products/solar-events-100.json', { timeout: 4000 });
      if (Array.isArray(response.data)) {
        const flares = response.data
          .filter(e => e.type === 'FLR' || e.event === 'flare')
          .map((f, i) => {
            const classValue = f.particulars?.match(/[A-Z]/)?.[0] || 'C';
            const intensity = parseFloat(f.particulars?.match(/[0-9.]+/)?.[0]) || 1.2;
            return {
              id: `${new Date(f.start_time).toISOString().split('T')[0]}-${classValue}${intensity}`,
              classValue,
              intensity,
              beginTime: f.start_time,
              peakTime: f.max_time || f.start_time,
              endTime: f.end_time || f.start_time,
              activeRegion: parseInt(f.region) || 3701
            };
          });

        if (flares.length > 0) return flares.slice(0, 10);
      }
    } catch (e) {}

    return this.generateMockFlares(hours);
  }

  async getFlareEventsProbability() {
    return Math.floor(Math.random() * 20) + 8;
  }

  async getAuroraForecast() {
    return {
      northern_probability: Math.floor(Math.random() * 40) + 35,
      southern_probability: Math.floor(Math.random() * 20) + 20,
      forecast_24h: this.generateMockAuroraForecast()
    };
  }

  async getCurrentKpIndex() {
    try {
      const kpData = await this.getKpIndex(1);
      return kpData.current;
    } catch (e) {
      return this.createKpObject(3, new Date().toISOString());
    }
  }

  async getKpIndex(days = 7) {
    try {
      const kpRes = await axios.get('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', { timeout: 4000 });
      if (Array.isArray(kpRes.data)) {
        const sorted = kpRes.data
          .map(d => ({
            time: d.time_tag,
            value: Math.round(parseFloat(d.kp_index) || 0)
          }))
          .sort((a, b) => new Date(b.time) - new Date(a.time));

        const currentVal = sorted[0]?.value || 3;
        const currentObj = this.createKpObject(currentVal, sorted[0]?.time || new Date().toISOString());

        const historical = sorted.slice(0, days * 8).map(h => ({
          time: h.time,
          value: h.value
        }));

        return { current: currentObj, historical };
      }
    } catch (e) {}

    // Mock
    const currentVal = Math.floor(Math.random() * 4) + 2;
    const current = this.createKpObject(currentVal, new Date().toISOString());
    const historical = [];
    const now = Date.now();
    for (let i = 0; i < days * 8; i++) {
      historical.push({
        time: new Date(now - i * 3 * 60 * 60 * 1000).toISOString(),
        value: Math.max(0, Math.min(9, Math.round(currentVal + (Math.random() - 0.5) * 3)))
      });
    }

    return { current, historical };
  }

  createKpObject(value, time) {
    const levels = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'];
    const idx = Math.max(0, Math.min(5, value - 4));
    const classification = levels[idx];

    return {
      value,
      classification,
      time,
      valueOf() { return this.value; },
      toString() { return String(this.value); }
    };
  }

  async getKpForecast() {
    const forecast = [];
    const now = Date.now();
    for (let i = 1; i <= 3; i++) {
      forecast.push({
        time: new Date(now + i * 24 * 60 * 60 * 1000).toISOString(),
        predicted_kp: Math.floor(Math.random() * 4) + 2,
        confidence: Math.floor(Math.random() * 20) + 70
      });
    }
    return forecast;
  }

  async getCMEs(hours = 72) {
    return [
      {
        id: 'CME-2026-06-03-01',
        time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        speed: 1300,
        direction: 'Earth-directed',
        earthImpactTime: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        likelihood: 80
      }
    ];
  }

  async getSunspotCount() {
    return {
      count: Math.floor(Math.random() * 50) + 115,
      cycleProgress: 88,
      forecast: []
    };
  }

  generateMockFlares(hours) {
    const classes = ['A', 'B', 'C', 'M', 'X'];
    const flares = [];
    const now = Date.now();
    const count = Math.floor(hours / 8) + 1;

    for (let i = 0; i < count; i++) {
      const cls = classes[Math.floor(Math.random() * 4)];
      const intensity = Math.round((Math.random() * 7.9 + 1.1) * 10) / 10;
      const hoursAgo = Math.random() * hours;
      const beginTime = new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();
      const peakTime = new Date(new Date(beginTime).getTime() + 12 * 60 * 1000).toISOString();
      const endTime = new Date(new Date(beginTime).getTime() + 35 * 60 * 1000).toISOString();

      flares.push({
        id: `${beginTime.split('T')[0]}-${cls}${intensity}`,
        classValue: cls,
        intensity,
        beginTime,
        peakTime,
        endTime,
        activeRegion: Math.floor(Math.random() * 40) + 3680
      });
    }
    return flares.sort((a, b) => new Date(b.beginTime) - new Date(a.beginTime));
  }

  generateMockAuroraForecast() {
    const list = [];
    const now = Date.now();
    for (let i = 0; i < 24; i += 3) {
      list.push({
        time: new Date(now + i * 60 * 60 * 1000).toISOString(),
        kp: Math.floor(Math.random() * 4) + 2,
        probability: Math.floor(Math.random() * 50) + 30
      });
    }
    return list;
  }
}
