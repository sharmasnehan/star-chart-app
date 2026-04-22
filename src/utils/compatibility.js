import { NAKSHATRAS, RASHIS } from './vedicData.js';

// Per-nakshatra attributes used for Ashta Koota matching
const NAK_ATTRS = {
  "Ashwini":          { gana: "Deva",     nadi: "Adi",    yoni: "Horse"    },
  "Bharani":          { gana: "Manushya", nadi: "Madhya", yoni: "Elephant" },
  "Krittika":         { gana: "Rakshasa", nadi: "Antya",  yoni: "Sheep"    },
  "Rohini":           { gana: "Manushya", nadi: "Antya",  yoni: "Serpent"  },
  "Mrigashira":       { gana: "Deva",     nadi: "Madhya", yoni: "Serpent"  },
  "Ardra":            { gana: "Manushya", nadi: "Adi",    yoni: "Dog"      },
  "Punarvasu":        { gana: "Deva",     nadi: "Adi",    yoni: "Cat"      },
  "Pushya":           { gana: "Deva",     nadi: "Madhya", yoni: "Sheep"    },
  "Ashlesha":         { gana: "Rakshasa", nadi: "Antya",  yoni: "Cat"      },
  "Magha":            { gana: "Rakshasa", nadi: "Antya",  yoni: "Rat"      },
  "Purva Phalguni":   { gana: "Manushya", nadi: "Madhya", yoni: "Rat"      },
  "Uttara Phalguni":  { gana: "Manushya", nadi: "Adi",    yoni: "Cow"      },
  "Hasta":            { gana: "Deva",     nadi: "Adi",    yoni: "Buffalo"  },
  "Chitra":           { gana: "Rakshasa", nadi: "Madhya", yoni: "Tiger"    },
  "Swati":            { gana: "Deva",     nadi: "Antya",  yoni: "Buffalo"  },
  "Vishakha":         { gana: "Rakshasa", nadi: "Antya",  yoni: "Tiger"    },
  "Anuradha":         { gana: "Deva",     nadi: "Madhya", yoni: "Deer"     },
  "Jyeshtha":         { gana: "Rakshasa", nadi: "Adi",    yoni: "Deer"     },
  "Mula":             { gana: "Rakshasa", nadi: "Adi",    yoni: "Dog"      },
  "Purva Ashadha":    { gana: "Manushya", nadi: "Madhya", yoni: "Monkey"   },
  "Uttara Ashadha":   { gana: "Manushya", nadi: "Antya",  yoni: "Mongoose" },
  "Shravana":         { gana: "Deva",     nadi: "Antya",  yoni: "Monkey"   },
  "Dhanishtha":       { gana: "Rakshasa", nadi: "Madhya", yoni: "Lion"     },
  "Shatabhisha":      { gana: "Rakshasa", nadi: "Adi",    yoni: "Horse"    },
  "Purva Bhadrapada": { gana: "Manushya", nadi: "Adi",    yoni: "Lion"     },
  "Uttara Bhadrapada":{ gana: "Manushya", nadi: "Madhya", yoni: "Cow"      },
  "Revati":           { gana: "Deva",     nadi: "Antya",  yoni: "Elephant" },
};

const YONI_ENEMIES = {
  "Horse": "Buffalo", "Buffalo": "Horse",
  "Elephant": "Lion", "Lion": "Elephant",
  "Sheep": "Monkey", "Monkey": "Sheep",
  "Serpent": "Mongoose", "Mongoose": "Serpent",
  "Dog": "Deer", "Deer": "Dog",
  "Cat": "Rat", "Rat": "Cat",
  "Cow": "Tiger", "Tiger": "Cow",
};

function yoniScore(y1, y2) {
  if (y1 === y2) return 4;
  if (YONI_ENEMIES[y1] === y2) return 0;
  return 2;
}

function ganaScore(g1, g2) {
  if (g1 === g2) return 6;
  const pair = new Set([g1, g2]);
  if (pair.has("Deva") && pair.has("Manushya")) return 5;
  if (pair.has("Manushya") && pair.has("Rakshasa")) return 1;
  return 0; // Deva + Rakshasa
}

function nadiScore(n1, n2) {
  return n1 === n2 ? 0 : 8;
}

function bhakootScore(r1Idx, r2Idx) {
  const d1 = ((r2Idx - r1Idx + 12) % 12) + 1;
  const d2 = ((r1Idx - r2Idx + 12) % 12) + 1;
  const bad = [[2, 12], [5, 9], [6, 8]];
  for (const [a, b] of bad) {
    if ((d1 === a && d2 === b) || (d1 === b && d2 === a)) return 0;
  }
  return 7;
}

function taraScore(n1Idx, n2Idx) {
  const t1 = ((n2Idx - n1Idx + 27) % 27) + 1;
  const t2 = ((n1Idx - n2Idx + 27) % 27) + 1;
  const r1 = t1 % 9 || 9;
  const r2 = t2 % 9 || 9;
  const badRems = new Set([3, 5, 7]);
  return (badRems.has(r1) ? 0 : 1.5) + (badRems.has(r2) ? 0 : 1.5);
}

const PLANET_REL = {
  Sun:     { friends: ["Moon", "Mars", "Jupiter"], enemies: ["Venus", "Saturn"] },
  Moon:    { friends: ["Sun", "Mercury"],          enemies: [] },
  Mars:    { friends: ["Sun", "Moon", "Jupiter"],  enemies: ["Mercury"] },
  Mercury: { friends: ["Sun", "Venus"],            enemies: ["Moon"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"],     enemies: ["Mercury", "Venus"] },
  Venus:   { friends: ["Mercury", "Saturn"],       enemies: ["Sun", "Moon"] },
  Saturn:  { friends: ["Mercury", "Venus"],        enemies: ["Sun", "Moon", "Mars"] },
};

function relStatus(a, b) {
  if (a === b) return "friend";
  if (PLANET_REL[a]?.friends.includes(b)) return "friend";
  if (PLANET_REL[a]?.enemies.includes(b)) return "enemy";
  return "neutral";
}

function maitriScore(l1, l2) {
  const s1 = relStatus(l1, l2);
  const s2 = relStatus(l2, l1);
  const pair = [s1, s2].sort().join('-');
  if (pair === 'friend-friend') return 5;
  if (pair === 'friend-neutral') return 4;
  if (pair === 'neutral-neutral') return 3;
  if (pair === 'enemy-friend') return 1;
  if (pair === 'enemy-neutral') return 0.5;
  return 0;
}

const VARNA_RANK = {
  "Karka": 4, "Vrishchika": 4, "Meena": 4,
  "Mesha": 3, "Simha": 3, "Dhanu": 3,
  "Vrishabha": 2, "Kanya": 2, "Makara": 2,
  "Mithuna": 1, "Tula": 1, "Kumbha": 1,
};

function varnaScore(r1, r2) {
  const v1 = VARNA_RANK[r1];
  const v2 = VARNA_RANK[r2];
  return Math.abs(v1 - v2) <= 1 ? 1 : 0;
}

const VASHYA_GROUP = {
  "Mesha": "biped", "Vrishabha": "quadruped", "Mithuna": "biped", "Karka": "water",
  "Simha": "wild",  "Kanya": "biped", "Tula": "biped", "Vrishchika": "insect",
  "Dhanu": "biped", "Makara": "water", "Kumbha": "biped", "Meena": "water",
};

function vashyaScore(r1, r2) {
  return VASHYA_GROUP[r1] === VASHYA_GROUP[r2] ? 2 : 1;
}

export const KOOTA_META = [
  { key: "varna",   label: "Shared Values",     max: 1, desc: "Whether you care about similar things in life — what each of you treats as important." },
  { key: "vashya",  label: "Social Pull",       max: 2, desc: "How easily you influence each other and gravitate toward hanging out." },
  { key: "tara",    label: "Good-Times Luck",   max: 3, desc: "How things tend to go when you're around each other — plans landing, timing working out." },
  { key: "yoni",    label: "Instinctive Vibe",  max: 4, desc: "Gut-level comfort — whether being around each other feels easy or slightly off." },
  { key: "maitri",  label: "Mind Meeting",      max: 5, desc: "How your minds click in conversation — ideas, humor, shared curiosity." },
  { key: "gana",    label: "Temperament",       max: 6, desc: "Whether your basic personalities and energy levels mesh or grate." },
  { key: "bhakoot", label: "Daily Rhythm",      max: 7, desc: "Whether your moods and routines sync up in day-to-day friendship." },
  { key: "nadi",    label: "Energy Match",      max: 8, desc: "How your baseline energies interact — recharging each other vs. draining each other." },
];

export function calculateCompatibility(p1, p2) {
  const r1Idx = RASHIS.findIndex(r => r.name === p1.rashi);
  const r2Idx = RASHIS.findIndex(r => r.name === p2.rashi);
  const n1Idx = NAKSHATRAS.findIndex(n => n.name === p1.nakshatra);
  const n2Idx = NAKSHATRAS.findIndex(n => n.name === p2.nakshatra);
  const a1 = NAK_ATTRS[p1.nakshatra];
  const a2 = NAK_ATTRS[p2.nakshatra];

  const scores = {
    varna:   varnaScore(p1.rashi, p2.rashi),
    vashya:  vashyaScore(p1.rashi, p2.rashi),
    tara:    taraScore(n1Idx, n2Idx),
    yoni:    yoniScore(a1.yoni, a2.yoni),
    maitri:  maitriScore(p1.rashiLord, p2.rashiLord),
    gana:    ganaScore(a1.gana, a2.gana),
    bhakoot: bhakootScore(r1Idx, r2Idx),
    nadi:    nadiScore(a1.nadi, a2.nadi),
  };
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  return { scores, total, max: 36, verdict: verdictFor(total, scores) };
}

function verdictFor(total, scores) {
  const pct = total / 36;
  let level, headline, tone;
  if (pct >= 0.89)      { level = 5; headline = "Soul Friends";        tone = "A rare kind of friendship — the kind where nothing has to be forced." }
  else if (pct >= 0.72) { level = 4; headline = "Close Friends";       tone = "Natural friendship energy — easy to hang out, easy to stay close." }
  else if (pct >= 0.50) { level = 3; headline = "Good Friends";        tone = "Solid friendship base, with a couple of areas that need awareness." }
  else if (pct >= 0.33) { level = 2; headline = "Casual Friends";      tone = "Real friction here — works in small doses, harder up close." }
  else                  { level = 1; headline = "Different Wavelengths"; tone = "You're wired pretty differently — friendship takes deliberate effort." }

  const ranked = KOOTA_META
    .map(m => ({ ...m, score: scores[m.key], ratio: scores[m.key] / m.max }))
    .sort((a, b) => b.ratio - a.ratio);

  const strengths = ranked.filter(r => r.ratio >= 0.7).slice(0, 3).map(r => r.label.toLowerCase());
  const weaknesses = ranked.filter(r => r.ratio <= 0.2).slice(0, 2).map(r => r.label.toLowerCase());

  let body = tone + " ";
  if (strengths.length) body += `The friendship flows easily around ${joinList(strengths)}. `;
  if (weaknesses.length) body += `The rough edges show up around ${joinList(weaknesses)} — good to know so you can steer around it.`;
  else if (total >= 24) body += "No real friction points; the small soft spots smooth out with time.";

  return { level, headline, body };
}

function joinList(arr) {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

// Parse the copied block back into structured partner details
export function parsePartnerDetails(text) {
  const lines = text.split(/\r?\n/);
  const data = {};
  for (const line of lines) {
    const m = line.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/);
    if (m) data[m[1].toLowerCase()] = m[2];
  }

  // Parse "Makara (Capricorn)" -> "Makara"
  const rashiRaw = data['moon rashi'] || '';
  const rashi = rashiRaw.split(/[\s(]/)[0];

  const nakshatra = data['nakshatra'];
  const padaRaw = data['pada'] || '';
  const pada = parseInt(padaRaw, 10);

  const result = {
    rashi,
    rashiLord: data['rashi lord'],
    nakshatra,
    nakshatraLord: data['nakshatra lord'],
    nakshatraDeity: data['nakshatra deity'],
    pada: isNaN(pada) ? null : pada,
  };

  const validRashi = RASHIS.some(r => r.name === result.rashi);
  const validNak = NAKSHATRAS.some(n => n.name === result.nakshatra);

  if (!validRashi || !validNak) {
    return { error: "Couldn't read those details. Paste the full block copied from a chart — all six lines." };
  }

  // Backfill rashiLord if missing
  if (!result.rashiLord) {
    result.rashiLord = RASHIS.find(r => r.name === result.rashi).lord;
  }

  return { data: result };
}
