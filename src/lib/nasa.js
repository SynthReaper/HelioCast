/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */
import axios from 'axios';

export class NASAService {
  constructor(apiKey) {
    this.apiKey = apiKey || 'DEMO_KEY';
  }

  async getSolarWind(hours = 24) {
    try {
      const url = 'https://services.swpc.noaa.gov/products/solar-wind/plasma-5-day.json';
      const response = await axios.get(url, { timeout: 4000 });
      
      if (response.data && Array.isArray(response.data)) {
        const data = response.data;
        const headers = data[0];
        const timeIndex = headers.indexOf('time_tag');
        const densityIndex = headers.indexOf('density');
        const speedIndex = headers.indexOf('speed');
        const tempIndex = headers.indexOf('temperature');

        const parsed = data.slice(1).map(row => {
          return {
            timestamp: row[timeIndex],
            density: parseFloat(row[densityIndex]) || 0,
            speed: parseFloat(row[speedIndex]) || 0,
            temperature: parseFloat(row[tempIndex]) || 0
          };
        }).filter(item => item.timestamp && item.speed > 0);

        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        const filtered = parsed.filter(item => new Date(item.timestamp).getTime() > cutoff);

        if (filtered.length > 0) {
          return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch real-time solar wind. Mocking...');
    }

    return this.generateMockWindData(hours);
  }

  generateMockWindData(hours) {
    const data = [];
    const now = Date.now();
    
    let baseSpeed = 400 + Math.random() * 100;
    let baseDensity = 5 + Math.random() * 3;
    let baseTemp = 120000 + Math.random() * 40000;

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();
      baseSpeed += (Math.random() - 0.5) * 10;
      baseDensity += (Math.random() - 0.5) * 0.5;
      baseTemp += (Math.random() - 0.5) * 5000;

      data.push({
        speed: Math.round(Math.max(300, Math.min(800, baseSpeed))),
        density: Math.round(Math.max(1, Math.min(20, baseDensity)) * 10) / 10,
        temperature: Math.round(Math.max(20000, Math.min(300000, baseTemp))),
        timestamp
      });
    }
    return data;
  }
}
