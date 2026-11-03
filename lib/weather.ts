import { TRIP } from "./trip";

export interface DayForecast {
  date: string; // YYYY-MM-DD, Pacific
  hi: number; // °F
  lo: number; // °F
  rain: number; // max chance of precipitation, %
  wind: number; // max wind, mph
}

// Dillon Beach. Open-Meteo is free, needs no key, and forecasts 16 days out
// (today plus 15), so the forecast only exists once the trip is that close.
const SPOT = { lat: 38.2502, lng: -122.9655 };
const DAY_MS = 86_400_000;

export async function tripForecast(now = Date.now()): Promise<DayForecast[] | null> {
  const start = TRIP.departISO.slice(0, 10);
  const end = TRIP.returnISO.slice(0, 10);
  if (Date.parse(TRIP.returnISO) < now || Date.parse(`${end}T00:00:00-08:00`) - now > 15 * DAY_MS) return null;
  const q = new URLSearchParams({
    latitude: String(SPOT.lat),
    longitude: String(SPOT.lng),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "America/Los_Angeles",
    start_date: start,
    end_date: end,
  });
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const d = (await res.json()).daily;
    const days: DayForecast[] = d.time.map((date: string, i: number) => ({
      date,
      hi: Math.round(d.temperature_2m_max[i]),
      lo: Math.round(d.temperature_2m_min[i]),
      rain: Math.round(d.precipitation_probability_max[i] ?? 0),
      wind: Math.round(d.wind_speed_10m_max[i]),
    }));
    return days.every((x) => Number.isFinite(x.hi) && Number.isFinite(x.lo)) ? days : null;
  } catch {
    return null;
  }
}
