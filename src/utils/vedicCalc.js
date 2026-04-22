import * as Astronomy from 'astronomy-engine';
import { NAKSHATRAS, RASHIS } from './vedicData.js';

// Lahiri ayanamsa at J2000 epoch.
// astronomy-engine returns longitude in the J2000 ecliptic frame, so the
// precession between J2000 and the birth date cancels out of sidereal longitude.
// Using a time-invariant ayanamsa here is therefore correct (and more accurate
// than applying a drift to a J2000-frozen longitude).
function getLahiriAyanamsa() {
  return 23.85;
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
  const ayanamsa = getLahiriAyanamsa();
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

// Compute the UTC offset (in hours) that applies at a specific instant
// in the given IANA timezone — honors historical DST transitions.
function offsetHoursForInstant(ianaZone, dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  // Treat the entered local time as if it were UTC; we'll measure how the
  // same instant renders in ianaZone and derive the offset from the delta.
  const asIfUTC = Date.UTC(y, m - 1, d, h, mi);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(new Date(asIfUTC))
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, p.value])
  );
  const asLocalMs = Date.UTC(
    +parts.year, +parts.month - 1, +parts.day,
    +parts.hour, +parts.minute, +parts.second
  );
  return (asLocalMs - asIfUTC) / 3600000;
}

// Get timezone offset in hours for a lat/lon AT THE BIRTH MOMENT (honors
// historical DST) using timeapi.io to resolve the IANA zone.
export async function getTimezoneOffset(lat, lon, dateStr, timeStr) {
  try {
    const url = `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Timezone lookup failed');
    const data = await res.json();

    if (data.timeZone) {
      return offsetHoursForInstant(data.timeZone, dateStr, timeStr);
    }
    throw new Error('No IANA zone returned');
  } catch {
    // Final fallback: rough offset from longitude (no DST)
    return Math.round(lon / 15);
  }
}
