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
    const days = parseInt(searchParams.get('days')) || 7;
    const cacheKey = `kp_${days}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const kpData = await noaaService.getKpIndex(days);
    const forecast = await noaaService.getKpForecast();

    // calculate storm level
    const kpValue = kpData.current.value;
    let stormLevel = { level: 'G0', description: 'Quiet' };
    if (kpValue >= 8) stormLevel = { level: 'G5', description: 'Extreme' };
    else if (kpValue >= 7) stormLevel = { level: 'G4', description: 'Severe' };
    else if (kpValue >= 6) stormLevel = { level: 'G3', description: 'Strong' };
    else if (kpValue >= 5) stormLevel = { level: 'G2', description: 'Moderate' };
    else if (kpValue >= 4) stormLevel = { level: 'G1', description: 'Minor' };

    const response = {
      current: {
        value: kpData.current.value,
        classification: kpData.current.classification,
        time: kpData.current.time
      },
      forecast_3day: forecast,
      historical_7day: kpData.historical,
      stormLevel,
      cached: false,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Kp index' }, { status: 500 });
  }
}
