import { useState } from 'react';
import BirthForm from './components/BirthForm.jsx';
import VedicChart from './components/VedicChart.jsx';
import { calculateVedicDetails, getTimezoneOffset } from './utils/vedicCalc.js';
import './App.css';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit({ date, time, location }) {
    setLoading(true);
    setError('');
    try {
      const tzOffset = await getTimezoneOffset(location.lat, location.lon, date, time);
      const details = calculateVedicDetails(date, time, location.lat, location.lon, tzOffset);
      setResult(details);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-ornament">✦ ✦ ✦</div>
        <h1 className="app-title">Vedic Astrology</h1>
        <div className="header-ornament">✦ ✦ ✦</div>
      </header>

      <main className="app-main">
        {!result ? (
          <div className="form-card">
            <h2 className="form-title">Enter Your Birth Details</h2>
            <p className="form-desc">
              In Vedic/Hindu astrology, your Moon sign reveals your emotional nature,
              subconscious mind, and deepest self — more intimately than the Sun sign.
            </p>
            <BirthForm onSubmit={handleSubmit} loading={loading} />
            {error && <p className="global-error">{error}</p>}
          </div>
        ) : (
          <VedicChart result={result} onReset={() => setResult(null)} />
        )}
      </main>

      <footer className="app-footer">
        <p>Based on the sidereal Moon position at your birth</p>
      </footer>
    </div>
  );
}
