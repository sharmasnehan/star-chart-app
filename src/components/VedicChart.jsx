import { useState } from 'react';
import { PLANET_SYMBOLS, RASHI_SYMBOLS } from '../utils/vedicData.js';

export default function VedicChart({ result, onReset }) {
  const { rashi, nakshatra, pada, ayanamsa, moonLongitude, birthDateUTC } = result;
  const rashiSymbol = RASHI_SYMBOLS[rashi.name] || '';
  const lordSymbol = PLANET_SYMBOLS[nakshatra.lord] || '';
  const rashiLordSymbol = PLANET_SYMBOLS[rashi.lord] || '';

  const padaRoman = ['I', 'II', 'III', 'IV'][pada - 1];

  const sections = [
    { key: 'strengths',  title: 'Strengths',             body: nakshatra.strengths },
    { key: 'shadow',     title: 'Shadow Side',           body: nakshatra.shadow },
    { key: 'love',       title: 'Love & Relationships',  body: nakshatra.love },
    { key: 'career',     title: 'Career & Purpose',      body: nakshatra.career },
    { key: 'spiritual',  title: 'Growth & Meaning',      body: nakshatra.spiritual },
  ];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="moon-badge">
          <span className="moon-icon">☽</span>
          <div>
            <p className="moon-label">Moon is in</p>
            <p className="moon-rashi">{rashi.name} {rashiSymbol}</p>
            <p className="moon-sub">{rashi.english} · {rashi.element} · {rashi.quality}</p>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <DetailCard label="Moon Rashi"       value={`${rashi.name} (${rashi.english})`} symbol={rashiSymbol} />
        <DetailCard label="Rashi Lord"       value={rashi.lord}                          symbol={rashiLordSymbol} />
        <DetailCard label="Nakshatra"        value={nakshatra.name}                      symbol="✧" small />
        <DetailCard label="Nakshatra Lord"   value={nakshatra.lord}                      symbol={lordSymbol} />
        <DetailCard label="Nakshatra Deity"  value={nakshatra.deity}                     symbol="✦" />
        <DetailCard label="Pada"             value={`${pada} (${padaRoman})`}            symbol="◈" />
      </div>

      <div className="divider-line">
        <span>✦ Your Cosmic Portrait ✦</span>
      </div>

      <div className="summary-section">
        <div className="nakshatra-title">
          <h3>{nakshatra.name} Nakshatra</h3>
          <p className="nakshatra-symbol-text">{nakshatra.symbol}</p>
        </div>
        <p className="summary-text">{nakshatra.summary}</p>
      </div>

      <div className="accordion">
        {sections.map(s => (
          <AccordionItem key={s.key} title={s.title} body={s.body} />
        ))}
      </div>

      <div className="meta-bar">
        <span>Sidereal Moon: {moonLongitude.toFixed(2)}°</span>
        <span>Lahiri Ayanamsa: {ayanamsa.toFixed(2)}°</span>
        <span>Birth UTC: {birthDateUTC.toUTCString().replace(' GMT', '')}</span>
      </div>

      <button className="reset-btn" onClick={onReset}>
        ← Calculate Another Chart
      </button>
    </div>
  );
}

function DetailCard({ label, value, symbol, small }) {
  return (
    <div className="detail-card">
      <p className="detail-label">{label}</p>
      <p className={`detail-value ${small ? 'detail-value-sm' : ''}`}>{value}</p>
      {symbol && <p className="detail-symbol">{symbol}</p>}
    </div>
  );
}

function AccordionItem({ title, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`accordion-item ${open ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="accordion-title">{title}</span>
        <span className="accordion-chevron">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="accordion-body"><p>{body}</p></div>}
    </div>
  );
}
