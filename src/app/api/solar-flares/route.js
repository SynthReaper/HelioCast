/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */
import { NextResponse } from 'next/server';
import { NOAAService } from '@/lib/noaa';
import Cache from '@/lib/cache';

const noaaService = new NOAAService();
const cache = new Cache(300);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours')) || 24;
    const cacheKey = `flares_${hours}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const flares = await noaaService.getSolarFlares(hours);
    const x1Probability = await noaaService.getFlareEventsProbability();

    const response = {
      flares: flares.map(f => ({
        id: f.id,
        classValue: f.classValue,
        intensity: f.intensity,
        beginTime: f.beginTime,
        peakTime: f.peakTime,
        endTime: f.endTime,
        activeRegion: f.activeRegion,
        source: 'NOAA',
        x1Probability24h: x1Probability
      })),
      cached: false,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch solar flares' }, { status: 500 });
  }
}
