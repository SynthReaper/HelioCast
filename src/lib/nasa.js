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
    const url = 'https://services.swpc.noaa.gov/products/solar-wind/plasma-3-day.json';
    const response = await axios.get(url, { timeout: 8000 });
    
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
    throw new Error('No real-time NOAA DSCOVR solar wind data available');
  }
}
