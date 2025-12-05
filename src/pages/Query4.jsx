// Query 4: User Statistics Lookup
// Pattern 1 style - Simple lookup with direct display
// Backend: GET /api/user-stats/:userId (will create endpoint)

import { useState } from 'react';
import './Query4.css';

const Query4 = () => {
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }

    const numericUserId = parseInt(userId.trim());
    if (isNaN(numericUserId) || numericUserId < 1) {
      setError('User ID must be a positive number');
      return;
    }

    setError('');
    setStats(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/user-stats/${numericUserId}`
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || data.message || 'User not found or no data available');
      }
    } catch (err) {
      setError('Failed to fetch user statistics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUserId('');
    setStats(null);
    setError('');
  };

  return (
    <div className="query4-container">
      <div className="query4-header">
        <h1>Query 4: User Statistics</h1>
        <p className="query4-description">
          View audio feature averages for a specific user
        </p>
      </div>

      <form onSubmit={handleSubmit} className="query4-form">
        <div className="form-group">
          <label htmlFor="userId">User ID *</label>
          <input
            id="userId"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g., 1"
            required
            min="1"
            className="form-input"
          />
          <small className="form-hint">Enter a numeric user ID to view their listening statistics</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Get Statistics'}
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

      {stats && (
        <div className="result-container">
          <h2>User Statistics - ID: {userId}</h2>
          
          <div className="stats-summary">
            <div className="summary-card">
              <span className="summary-label">Total Tracks</span>
              <span className="summary-value">{stats.track_count || 0}</span>
            </div>
          </div>

          <h3>Average Audio Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-label">Energy</span>
              <span className="feature-value">
                {stats.avg_energy !== null ? `${(stats.avg_energy * 100).toFixed(1)}%` : 'N/A'}
              </span>
              <div className="feature-bar">
                <div
                  className="feature-bar-fill"
                  style={{ width: `${(stats.avg_energy || 0) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="feature-card">
              <span className="feature-label">Valence</span>
              <span className="feature-value">
                {stats.avg_valence !== null ? `${(stats.avg_valence * 100).toFixed(1)}%` : 'N/A'}
              </span>
              <div className="feature-bar">
                <div
                  className="feature-bar-fill"
                  style={{ width: `${(stats.avg_valence || 0) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="feature-card">
              <span className="feature-label">Danceability</span>
              <span className="feature-value">
                {stats.avg_danceability !== null ? `${(stats.avg_danceability * 100).toFixed(1)}%` : 'N/A'}
              </span>
              <div className="feature-bar">
                <div
                  className="feature-bar-fill"
                  style={{ width: `${(stats.avg_danceability || 0) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="feature-card">
              <span className="feature-label">Acousticness</span>
              <span className="feature-value">
                {stats.avg_acousticness !== null ? `${(stats.avg_acousticness * 100).toFixed(1)}%` : 'N/A'}
              </span>
              <div className="feature-bar">
                <div
                  className="feature-bar-fill"
                  style={{ width: `${(stats.avg_acousticness || 0) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="feature-card">
              <span className="feature-label">Tempo</span>
              <span className="feature-value">
                {stats.avg_tempo !== null ? `${parseFloat(stats.avg_tempo).toFixed(1)} BPM` : 'N/A'}
              </span>
            </div>

            <div className="feature-card">
              <span className="feature-label">Loudness</span>
              <span className="feature-value">
                {stats.avg_loudness !== null ? `${parseFloat(stats.avg_loudness).toFixed(1)} dB` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="stats-interpretation">
            <h4>Interpretation</h4>
            <ul>
              <li>
                <strong>Energy:</strong> {stats.avg_energy > 0.7 ? 'High energy - prefers intense, fast, loud tracks' : stats.avg_energy > 0.4 ? 'Moderate energy - balanced listening' : 'Low energy - prefers calm, relaxed tracks'}
              </li>
              <li>
                <strong>Valence:</strong> {stats.avg_valence > 0.7 ? 'Positive mood - prefers happy, cheerful music' : stats.avg_valence > 0.4 ? 'Neutral mood - balanced emotional content' : 'Lower valence - prefers melancholic or serious music'}
              </li>
              <li>
                <strong>Danceability:</strong> {stats.avg_danceability > 0.7 ? 'Highly danceable - prefers rhythmic, beat-driven tracks' : stats.avg_danceability > 0.4 ? 'Moderately danceable' : 'Less danceable - prefers non-dance music'}
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="navigation-links">
        <a href="/query3">← Previous Query</a>
        <a href="/">Home</a>
        <a href="/query5">Next Query →</a>
      </div>
    </div>
  );
};

export default Query4;
