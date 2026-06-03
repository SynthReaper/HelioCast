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
    const lat = parseFloat(searchParams.get('lat')) || 65;
    const lon = parseFloat(searchParams.get('lon')) || -20;
    const cacheKey = `aurora_forecast_${Math.round(lat)}_${Math.round(lon)}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const auroraData = await noaaService.getAuroraForecast();
    const currentKp = await noaaService.getCurrentKpIndex();
    const kpVal = currentKp.value;

    // Adjust probability based on latitude
    let adjustedProbability = auroraData.northern_probability;
    if (lat < 45) {
      adjustedProbability = Math.max(0, auroraData.northern_probability - 60);
    } else if (lat < 60) {
      adjustedProbability = Math.max(0, auroraData.northern_probability - 25);
    }

    // Determine optimal locations based on latitude
    let optimalLocations = [];
    if (lat >= 60) {
      optimalLocations = [
        'Reykjavik, Iceland',
        'Fairbanks, Alaska',
        'Tromsø, Norway',
        'Yellowknife, Canada',
        'Murmansk, Russia'
      ];
    } else if (lat >= 45) {
      optimalLocations = [
        'Edinburgh, Scotland',
        'Calgary, Canada',
        'Oslo, Norway',
        'Stockholm, Sweden',
        'Vancouver, Canada'
      ];
    } else {
      optimalLocations = [
        'Seattle, USA',
        'Chicago, USA',
        'London, UK',
        'Toronto, Canada',
        'Berlin, Germany'
      ];
    }

    const northern = {
      probability: adjustedProbability,
      kpThreshold: 5,
      visibility: kpVal >= 6 ? 'high' : kpVal >= 4 ? 'moderate' : 'low',
      optimalLocations,
      forecast_24h: auroraData.forecast_24h || []
    };

    const southern = {
      probability: auroraData.southern_probability,
      kpThreshold: 5,
      visibility: kpVal >= 6 ? 'moderate' : kpVal >= 4 ? 'low' : 'very_low',
      optimalLocations: [
        'Hobart, Australia',
        'Christchurch, New Zealand'
      ]
    };

    const response = {
      northern,
      southern,
      userLocation: { lat, lon },
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch aurora forecast' }, { status: 500 });
  }
}
