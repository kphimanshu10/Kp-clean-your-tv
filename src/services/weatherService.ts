import { WeatherData } from '../types/launcher';

export type WeatherIconKind =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunderstorm';

/**
 * Maps WMO Weather interpretation codes (WW) to condition label and icon kind
 */
export function mapWmoWeatherCode(
  code: number,
  isDay: boolean = true
): { conditionText: string; iconKind: WeatherIconKind } {
  if (code === 0) {
    return {
      conditionText: isDay ? 'Clear Sky' : 'Clear Night',
      iconKind: isDay ? 'clear-day' : 'clear-night',
    };
  }
  if (code === 1 || code === 2) {
    return {
      conditionText: 'Partly Cloudy',
      iconKind: 'partly-cloudy',
    };
  }
  if (code === 3) {
    return {
      conditionText: 'Overcast',
      iconKind: 'cloudy',
    };
  }
  if (code === 45 || code === 48) {
    return {
      conditionText: 'Foggy',
      iconKind: 'fog',
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      conditionText: code >= 61 || code >= 80 ? 'Rain' : 'Drizzle',
      iconKind: 'rain',
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      conditionText: 'Snow',
      iconKind: 'snow',
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      conditionText: 'Thunderstorm',
      iconKind: 'thunderstorm',
    };
  }
  return {
    conditionText: 'Fair',
    iconKind: 'partly-cloudy',
  };
}

const KNOWN_CITY_COORDS: Record<string, { name: string; lat: number; lon: number }> = {
  'new delhi': { name: 'New Delhi', lat: 28.6139, lon: 77.209 },
  delhi: { name: 'New Delhi', lat: 28.6139, lon: 77.209 },
  mumbai: { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  bengaluru: { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  bangalore: { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  chennai: { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  hyderabad: { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  kolkata: { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  pune: { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  jaipur: { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  ahmedabad: { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  london: { name: 'London', lat: 51.5074, lon: -0.1278 },
  'new york': { name: 'New York', lat: 40.7128, lon: -74.006 },
  sydney: { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  tokyo: { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  dubai: { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
};

export async function fetchWeatherForLocation(
  locationPreference: string,
  unit: 'C' | 'F' = 'C'
): Promise<WeatherData> {
  const cleanQuery = (locationPreference || 'New Delhi').trim() || 'New Delhi';
  const normalized = cleanQuery.toLowerCase();

  let lat = 28.6139;
  let lon = 77.209;
  let resolvedName = cleanQuery;

  if (KNOWN_CITY_COORDS[normalized]) {
    lat = KNOWN_CITY_COORDS[normalized].lat;
    lon = KNOWN_CITY_COORDS[normalized].lon;
    resolvedName = KNOWN_CITY_COORDS[normalized].name;
  } else {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery
    )}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) {
      throw new Error(`Geocoding error (${geoRes.status})`);
    }
    const geoJson = await geoRes.json();
    const firstResult = geoJson?.results?.[0];
    if (!firstResult || typeof firstResult.latitude !== 'number') {
      throw new Error(`Location "${cleanQuery}" not found`);
    }
    lat = firstResult.latitude;
    lon = firstResult.longitude;
    resolvedName = firstResult.name || cleanQuery;
  }

  const tempUnitParam = unit === 'F' ? 'fahrenheit' : 'celsius';
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&temperature_unit=${tempUnitParam}`;

  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) {
    throw new Error(`Weather service HTTP ${weatherRes.status}`);
  }

  const weatherJson = await weatherRes.json();
  const current = weatherJson?.current;
  if (!current || typeof current.temperature_2m !== 'number') {
    throw new Error('Invalid weather response payload');
  }

  const code = typeof current.weather_code === 'number' ? current.weather_code : 0;
  const isDay = current.is_day !== 0;
  const { conditionText } = mapWmoWeatherCode(code, isDay);

  return {
    locationName: resolvedName,
    temperature: Math.round(current.temperature_2m),
    unit,
    conditionText,
    conditionCode: code,
    isDay,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
