import { useState, useRef, useEffect } from 'react';
import { geocodeLocation } from '../utils/vedicCalc.js';

export default function BirthForm({ onSubmit, loading }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!locationQuery || locationQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await geocodeLocation(locationQuery);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, [locationQuery]);

  function handleSelect(loc) {
    setSelectedLocation(loc);
    setLocationQuery(loc.display.split(',').slice(0, 3).join(','));
    setSuggestions([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!date) return setError('Please enter your birth date.');
    if (!time) return setError('Please enter your birth time.');
    if (!selectedLocation) return setError('Please select a location from the suggestions.');
    onSubmit({ date, time, location: selectedLocation });
  }

  return (
    <form className="birth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="date">Birth Date</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="form-group">
        <label htmlFor="time">Birth Time <span className="hint">(as exact as possible)</span></label>
        <input
          id="time"
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>

      <div className="form-group location-group">
        <label htmlFor="location">Birth City / Location</label>
        <div className="location-input-wrap">
          <input
            id="location"
            type="text"
            placeholder="e.g. Mumbai, India"
            value={locationQuery}
            onChange={e => {
              setLocationQuery(e.target.value);
              setSelectedLocation(null);
            }}
            autoComplete="off"
          />
          {searchLoading && <span className="search-spinner">◌</span>}
        </div>
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s, i) => (
              <li key={i} onClick={() => handleSelect(s)}>
                {s.display}
              </li>
            ))}
          </ul>
        )}
        {selectedLocation && (
          <p className="selected-loc">
            ✓ {selectedLocation.display.split(',').slice(0, 3).join(',')}
            <span className="coords"> ({selectedLocation.lat.toFixed(2)}°, {selectedLocation.lon.toFixed(2)}°)</span>
          </p>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? (
          <span className="btn-loading">Reading the stars<span className="dots">...</span></span>
        ) : (
          'Reveal My Vedic Chart'
        )}
      </button>
    </form>
  );
}
