/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */
import { NextResponse } from 'next/server';
import { NOAAService } from '@/lib/noaa';
import Cache from '@/lib/cache';

const noaaService = new NOAAService();
const cache = new Cache(300);

export async function GET() {
  try {
    const cacheKey = 'sunspots';
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const sunspots = await noaaService.getSunspotCount();

    const response = {
      activeRegions: sunspots.count,
      solarCycleProgress: sunspots.cycleProgress,
      cycleNumber: 25,
      maxExpected: 180,
      forecast: sunspots.forecast,
      cached: false,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sunspot data' }, { status: 500 });
  }
}
