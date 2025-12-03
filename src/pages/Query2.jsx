// Query 2: Track Search
// Pattern 2 - Dynamic table rendering with JSON results
// Backend: GET /api/db/search

import { useState } from 'react';
import './Query2.css';

const Query2 = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    setError('');
    setTracks([]);
    setLoading(true);
    setSearchPerformed(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:3001/api/db/search?q=${encodeURIComponent(searchQuery.trim())}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTracks(data.tracks || []);
        if (data.tracks.length === 0) {
          setError('No tracks found matching your search');
        }
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to search tracks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setTracks([]);
    setError('');
    setSearchPerformed(false);
  };

  return (
    <div className="query2-container">
      <div className="query2-header">
        <h1>Query 2: Track Search</h1>
        <p className="query2-description">
          Search for tracks by artist name, track title, or album name
        </p>
      </div>

      <form onSubmit={handleSubmit} className="query2-form">
        <div className="form-group">
          <label htmlFor="search">Search Query *</label>
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter artist, track, or album name..."
            required
            minLength={2}
            className="form-input"
          />
          <small className="form-hint">Searches across artist names, track titles, and album names</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
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

      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Searching tracks...</p>
        </div>
      )}

      {!loading && searchPerformed && tracks.length > 0 && (
        <div className="results-container">
          <div className="results-header">
            <h2>Search Results</h2>
            <span className="results-count">{tracks.length} track(s) found</span>
          </div>

          <div className="table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Track</th>
                  <th>Artist</th>
                  <th>Album</th>
                  <th>Energy</th>
                  <th>Danceability</th>
                  <th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track, index) => (
                  <tr key={track.track_id || index}>
                    <td>{index + 1}</td>
                    <td className="track-title">{track.track_name || 'N/A'}</td>
                    <td>{track.artists || 'N/A'}</td>
                    <td>{track.album_name || 'N/A'}</td>
                    <td>
                      {track.energy !== null && track.energy !== undefined
                        ? `${(track.energy * 100).toFixed(0)}%`
                        : 'N/A'}
                    </td>
                    <td>
                      {track.danceability !== null && track.danceability !== undefined
                        ? `${(track.danceability * 100).toFixed(0)}%`
                        : 'N/A'}
                    </td>
                    <td>
                      {track.tempo
                        ? `${Math.round(track.tempo)} BPM`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="navigation-links">
        <a href="/query1">← Previous Query</a>
        <a href="/">Home</a>
        <a href="/query3">Next Query →</a>
      </div>
    </div>
  );
};

export default Query2;
