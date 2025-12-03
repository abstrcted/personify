// Query 1: Simple Track Lookup
// Pattern 1 style - Direct lookup with straightforward result display
// Backend: GET /api/db/track/:artist/:title

import { useState } from 'react';
import './Query1.css';

const Query1 = () => {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!artist.trim() || artist.trim().length < 2) {
      setError('Artist name must be at least 2 characters');
      return;
    }
    
    if (!title.trim() || title.trim().length < 2) {
      setError('Track title must be at least 2 characters');
      return;
    }

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:3001/api/db/track/${encodeURIComponent(artist.trim())}/${encodeURIComponent(title.trim())}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.features);
      } else {
        setError(data.message || 'Track not found in database');
      }
    } catch (err) {
      setError('Failed to fetch track data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setArtist('');
    setTitle('');
    setResult(null);
    setError('');
  };

  return (
    <div className="query1-container">
      <div className="query1-header">
        <h1>Query 1: Track Lookup</h1>
        <p className="query1-description">
          Search for a track by artist and title to view its audio features
        </p>
      </div>

      <form onSubmit={handleSubmit} className="query1-form">
        <div className="form-group">
          <label htmlFor="artist">Artist Name *</label>
          <input
            id="artist"
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g., Taylor Swift"
            required
            minLength={2}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="title">Track Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Anti-Hero"
            required
            minLength={2}
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search Track'}
          </button>
          <button type="button" onClick={handleReset} className="btn-secondary">
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result-container">
          <h2>Track Found</h2>
          <div className="track-info">
            <div className="info-row">
              <span className="label">Title:</span>
              <span className="value">{result.track_name || result.title}</span>
            </div>
            <div className="info-row">
              <span className="label">Artist:</span>
              <span className="value">{result.artists || result.artist}</span>
            </div>
            {(result.album_name || result.album) && (
              <div className="info-row">
                <span className="label">Album:</span>
                <span className="value">{result.album_name || result.album}</span>
              </div>
            )}
          </div>

          <h3>Audio Features</h3>
          <div className="features-grid">
            {result.tempo !== null && (
              <div className="feature-card">
                <span className="feature-label">Tempo</span>
                <span className="feature-value">{result.tempo} BPM</span>
              </div>
            )}
            {result.energy !== null && (
              <div className="feature-card">
                <span className="feature-label">Energy</span>
                <span className="feature-value">{(result.energy * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.danceability !== null && (
              <div className="feature-card">
                <span className="feature-label">Danceability</span>
                <span className="feature-value">{(result.danceability * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.valence !== null && (
              <div className="feature-card">
                <span className="feature-label">Valence</span>
                <span className="feature-value">{(result.valence * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.acousticness !== null && (
              <div className="feature-card">
                <span className="feature-label">Acousticness</span>
                <span className="feature-value">{(result.acousticness * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.instrumentalness !== null && (
              <div className="feature-card">
                <span className="feature-label">Instrumentalness</span>
                <span className="feature-value">{(result.instrumentalness * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.liveness !== null && (
              <div className="feature-card">
                <span className="feature-label">Liveness</span>
                <span className="feature-value">{(result.liveness * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.speechiness !== null && (
              <div className="feature-card">
                <span className="feature-label">Speechiness</span>
                <span className="feature-value">{(result.speechiness * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.loudness !== null && (
              <div className="feature-card">
                <span className="feature-label">Loudness</span>
                <span className="feature-value">{result.loudness.toFixed(1)} dB</span>
              </div>
            )}
          </div>

          <div className="result-source">
            <small>Source: Local Database</small>
          </div>
        </div>
      )}

      <div className="navigation-links">
        <a href="/">← Back to Home</a>
        <a href="/query2">Next Query →</a>
      </div>
    </div>
  );
};

export default Query1;
