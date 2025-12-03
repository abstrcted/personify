// Query 3: Browse Tracks with Pagination
// Pattern 2 - Paginated browsing with sorting options
// Backend: GET /api/db/browse

import { useState, useEffect } from 'react';
import './Query3.css';

const Query3 = () => {
  const [tracks, setTracks] = useState([]);
  const [sortBy, setSortBy] = useState('track_name');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sortOptions = [
    { value: 'track_name', label: 'Track Name' },
    { value: 'energy', label: 'Energy' },
    { value: 'danceability', label: 'Danceability' },
    { value: 'valence', label: 'Valence' },
    { value: 'tempo', label: 'Tempo' }
  ];

  const fetchTracks = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:3001/api/db/browse?sort=${sortBy}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTracks(data.tracks || []);
      } else {
        setError(data.error || 'Failed to fetch tracks');
      }
    } catch (err) {
      setError('Failed to browse tracks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [sortBy, limit, offset]);

  const handlePrevious = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNext = () => {
    if (tracks.length === limit) {
      setOffset(offset + limit);
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setOffset(0); // Reset to first page
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setOffset(0); // Reset to first page
  };

  return (
    <div className="query3-container">
      <div className="query3-header">
        <h1>Query 3: Browse Tracks</h1>
        <p className="query3-description">
          Browse all tracks in the database with sorting and pagination
        </p>
      </div>

      <div className="controls-panel">
        <div className="control-group">
          <label htmlFor="sortBy">Sort By:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={handleSortChange}
            className="control-select"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="limit">Results Per Page:</label>
          <select
            id="limit"
            value={limit}
            onChange={handleLimitChange}
            className="control-select"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading tracks...</p>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="results-container">
          <div className="results-header">
            <h2>Tracks</h2>
            <span className="results-info">
              Showing {offset + 1} - {offset + tracks.length}
            </span>
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
                  <th>Dance</th>
                  <th>Valence</th>
                  <th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track, index) => (
                  <tr key={track.track_id || index}>
                    <td>{offset + index + 1}</td>
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
                      {track.valence !== null && track.valence !== undefined
                        ? `${(track.valence * 100).toFixed(0)}%`
                        : 'N/A'}
                    </td>
                    <td>
                      {track.tempo
                        ? `${Math.round(track.tempo)}`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button
              onClick={handlePrevious}
              disabled={offset === 0}
              className="btn-pagination"
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {Math.floor(offset / limit) + 1}
            </span>
            <button
              onClick={handleNext}
              disabled={tracks.length < limit}
              className="btn-pagination"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <div className="navigation-links">
        <a href="/query2">← Previous Query</a>
        <a href="/">Home</a>
        <a href="/query4">Next Query →</a>
      </div>
    </div>
  );
};

export default Query3;
