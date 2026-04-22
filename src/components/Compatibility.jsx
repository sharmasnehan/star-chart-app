import { useState } from 'react';
import { calculateCompatibility, parsePartnerDetails, KOOTA_META } from '../utils/compatibility.js';

export default function Compatibility({ myResult }) {
  const [pasted, setPasted] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [error, setError] = useState('');
  const [match, setMatch] = useState(null);
  const [partnerData, setPartnerData] = useState(null);

  function handleCalculate() {
    setError('');
    setMatch(null);
    const parsed = parsePartnerDetails(pasted);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    const me = {
      rashi: myResult.rashi.name,
      rashiLord: myResult.rashi.lord,
      nakshatra: myResult.nakshatra.name,
    };
    const result = calculateCompatibility(me, parsed.data);
    setPartnerData(parsed.data);
    setMatch(result);
  }

  function handleReset() {
    setPasted('');
    setPartnerName('');
    setError('');
    setMatch(null);
    setPartnerData(null);
  }

  return (
    <div className="compat-section">
      <div className="divider-line">
        <span>✦ Friendship Compatibility ✦</span>
      </div>

      <div className="compat-intro">
        <p>Paste a friend's chart details to see how your energies mesh as friends. Uses the traditional 8-factor Vedic system, reframed for platonic connection.</p>
      </div>

      {!match ? (
        <div className="compat-form">
          <div className="form-group">
            <label htmlFor="partner-name">Friend's Name <span className="hint">(optional)</span></label>
            <input
              id="partner-name"
              type="text"
              placeholder="e.g. Alex"
              value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="partner-paste">Paste Their Chart Details</label>
            <p className="hint-sub">Ask your friend to open this app, generate their chart, and tap "Copy These Details" — then paste here.</p>
            <textarea
              id="partner-paste"
              className="compat-textarea"
              placeholder={`Moon Rashi: ...\nRashi Lord: ...\nNakshatra: ...\nNakshatra Lord: ...\nNakshatra Deity: ...\nPada: ...`}
              value={pasted}
              onChange={e => setPasted(e.target.value)}
              rows={7}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="submit-btn" onClick={handleCalculate} disabled={!pasted.trim()}>
            See How You Vibe
          </button>
        </div>
      ) : (
        <CompatibilityResult
          match={match}
          partnerName={partnerName}
          partnerData={partnerData}
          myResult={myResult}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

function CompatibilityResult({ match, partnerName, partnerData, myResult, onReset }) {
  const { scores, total, max, verdict } = match;
  const pct = Math.round((total / max) * 100);
  const them = partnerName || 'Your friend';

  return (
    <div className="compat-result">
      <div className={`compat-score-card level-${verdict.level}`}>
        <div className="compat-score-big">
          <span className="compat-score-num">{total}</span>
          <span className="compat-score-denom">/ {max}</span>
        </div>
        <p className="compat-verdict">{verdict.headline}</p>
        <p className="compat-pct">{pct}% friendship match</p>
      </div>

      <p className="compat-body">{verdict.body}</p>

      <div className="compat-pairing">
        <div className="compat-person">
          <p className="compat-person-label">You</p>
          <p className="compat-person-value">{myResult.rashi.name} · {myResult.nakshatra.name}</p>
        </div>
        <div className="compat-vs">⟷</div>
        <div className="compat-person">
          <p className="compat-person-label">{them}</p>
          <p className="compat-person-value">{partnerData.rashi} · {partnerData.nakshatra}</p>
        </div>
      </div>

      <div className="koota-grid">
        {KOOTA_META.map(meta => (
          <KootaCard
            key={meta.key}
            label={meta.label}
            desc={meta.desc}
            score={scores[meta.key]}
            max={meta.max}
          />
        ))}
      </div>

      <button className="reset-btn" onClick={onReset}>
        ← Check Another Person
      </button>
    </div>
  );
}

function KootaCard({ label, desc, score, max }) {
  const ratio = score / max;
  let tier = 'poor';
  if (ratio >= 0.8) tier = 'great';
  else if (ratio >= 0.5) tier = 'good';
  else if (ratio >= 0.25) tier = 'mixed';

  return (
    <div className={`koota-card tier-${tier}`}>
      <div className="koota-head">
        <p className="koota-label">{label}</p>
        <p className="koota-score">{score % 1 === 0 ? score : score.toFixed(1)} / {max}</p>
      </div>
      <div className="koota-bar">
        <div className="koota-bar-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="koota-desc">{desc}</p>
    </div>
  );
}
