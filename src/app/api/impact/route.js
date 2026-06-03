/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */
import { NextResponse } from 'next/server';
import { NOAAService } from '@/lib/noaa';
import { NASAService } from '@/lib/nasa';
import Cache from '@/lib/cache';

const noaaService = new NOAAService();
const nasaService = new NASAService();
const cache = new Cache(300);

export async function GET() {
  try {
    const cacheKey = 'mission_impact';
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const kp = await noaaService.getCurrentKpIndex();
    const wind = await nasaService.getSolarWind(1);
    const flares = await noaaService.getSolarFlares(24);

    const kpVal = kp.value;
    const windVal = wind[0] || { speed: 400 };

    const highSpeed = windVal.speed > 600;
    const hasXFlares = flares.some(f => f.classValue === 'X');
    const hasStrong = flares.some(f => f.classValue === 'M' || f.classValue === 'X');

    const response = {
      satellites: {
        status: kpVal >= 7 || highSpeed ? 'critical' : kpVal >= 5 ? 'high_risk' : 'normal',
        reason: kpVal >= 7 ? 'High particle flux & elevated drag' : 'Elevated particle flux'
      },
      power_grids: {
        status: kpVal >= 7 ? 'critical' : kpVal >= 6 ? 'warning' : kpVal >= 5 ? 'monitor' : 'safe',
        reason: 'Geomagnetic induction effects'
      },
      radio: {
        status: hasXFlares ? 'blocked' : hasStrong ? 'degraded' : 'operational',
        reason: 'HF absorption from solar radiation'
      },
      gps: {
        status: hasStrong ? 'warning' : 'nominal',
        accuracy_loss: hasStrong ? 15 : hasXFlares ? 25 : 0
      },
      astronauts: {
        status: kpVal >= 8 || hasXFlares ? 'warning' : 'safe',
        exposure: kpVal >= 8 ? 'moderate' : 'low'
      },
      aircraft: {
        status: 'nominal',
        polar_routes: 'operational'
      },
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate mission impact' }, { status: 500 });
  }
}
