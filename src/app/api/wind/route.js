/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */
import { NextResponse } from 'next/server';
import { NASAService } from '@/lib/nasa';
import Cache from '@/lib/cache';

const nasaService = new NASAService();
const cache = new Cache(300);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours')) || 24;
    const cacheKey = `wind_${hours}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const windData = await nasaService.getSolarWind(hours);
    const current = windData[windData.length - 1] || { speed: 400, density: 5, temperature: 100000, timestamp: new Date().toISOString() };

    const speeds = windData.map(w => w.speed);
    const response = {
      current,
      hourly_24h: windData,
      stats: {
        avgSpeed: Math.round(speeds.reduce((a, b) => a + b, 0) / (speeds.length || 1)),
        maxSpeed: Math.max(...speeds, 0),
        minSpeed: Math.min(...speeds, 0)
      },
      cached: false,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch solar wind data' }, { status: 500 });
  }
}
