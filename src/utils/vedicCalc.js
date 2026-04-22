import * as Astronomy from 'astronomy-engine';
import { NAKSHATRAS, RASHIS } from './vedicData.js';

// Lahiri ayanamsa (degrees) — precession correction to convert tropical to sidereal
// Using a simplified linear approximation valid for modern dates
function getLahiriAyanamsa(date) {
  // J2000.0 epoch: Jan 1.5, 2000
  const J2000 = new Date('2000-01-01T12:00:00Z');
  const yearsSinceJ2000 = (date - J2000) / (365.25 * 24 * 3600 * 1000);
  // Lahiri ayanamsa at J2000 ≈ 23.85 degrees, precessing at ~50.3"/year
  const ayanamsaAtJ2000 = 23.85;
  const precessionRate = 50.3 / 3600; // degrees per year
  return ayanamsaAtJ2000 + precessionRate * yearsSinceJ2000;
}

function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

export function calculateVedicDetails(dateStr, timeStr, latitude, longitude, tzOffsetHours) {
  // Convert local birth time to UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const localMs = Date.UTC(year, month - 1, day, hour, minute) - tzOffsetHours * 3600 * 1000;
  const birthDateUTC = new Date(localMs);

  // Get Moon's tropical longitude using astronomy-engine
  const astroTime = Astronomy.MakeTime(birthDateUTC);
  const moonEquatorial = Astronomy.GeoMoon(astroTime);

  // Convert equatorial to ecliptic
  const ecliptic = Astronomy.Ecliptic(moonEquatorial);
  const tropicalLongitude = normalizeAngle(ecliptic.elon);

  // Apply Lahiri ayanamsa to get sidereal longitude
  const ayanamsa = getLahiriAyanamsa(birthDateUTC);
  const siderealLongitude = normalizeAngle(tropicalLongitude - ayanamsa);

  // Calculate Rashi (0-11), each rashi = 30°
  const rashiIndex = Math.floor(siderealLongitude / 30);
  const rashi = RASHIS[rashiIndex];
  const degInRashi = siderealLongitude - rashiIndex * 30;

  // Calculate Nakshatra (0-26), each nakshatra = 13°20' = 13.333...°
  const nakshatraWidth = 360 / 27; // 13.333...
  const nakshatraIndex = Math.floor(siderealLongitude / nakshatraWidth);
  const nakshatra = NAKSHATRAS[nakshatraIndex];
  const degInNakshatra = siderealLongitude - nakshatraIndex * nakshatraWidth;

  // Calculate Pada (1-4), each pada = 3°20' = 3.333...°
  const padaWidth = nakshatraWidth / 4;
  const pada = Math.floor(degInNakshatra / padaWidth) + 1;

  return {
    moonLongitude: siderealLongitude,
    ayanamsa,
    rashi,
    rashiDeg: degInRashi,
    nakshatra,
    pada,
    birthDateUTC,
  };
}

// Geocode a place name using OpenStreetMap Nominatim (free, no key needed)
export async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'VedicAstrologyApp/1.0' }
  });
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data.length) throw new Error('Location not found');
  return data.map(d => ({
    display: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
}

// Get timezone offset in hours for a lat/lon at a given date using timeapi.io
export async function getTimezoneOffset(lat, lon, dateStr, timeStr) {
  try {
    // Use a public timezone API
    const url = `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Timezone lookup failed');
    const data = await res.json();

    // timeapi returns currentUtcOffset.seconds
    if (data.currentUtcOffset?.seconds !== undefined) {
      return data.currentUtcOffset.seconds / 3600;
    }
    // Fallback: parse from dstOffset or utcOffset string
    if (data.utcOffset) {
      const match = data.utcOffset.match(/([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        return sign * (parseInt(match[2]) + parseInt(match[3]) / 60);
      }
    }
    throw new Error('Could not parse timezone');
  } catch {
    // Final fallback: rough offset from longitude
    return Math.round(lon / 15);
  }
}
