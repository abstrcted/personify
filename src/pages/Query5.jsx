// Query 5: Add Track to Favorites
// Pattern 1 style - Simple form submission with confirmation
// Backend: POST /api/liked-songs/:userId

import { useState } from 'react';
import './Query5.css';

const Query5 = () => {
  const [userId, setUserId] = useState('');
  const [trackId, setTrackId] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }

    if (!trackId.trim()) {
      setError('Track ID is required');
      return;
    }

    const numericUserId = parseInt(userId.trim());
    const numericTrackId = parseInt(trackId.trim());

    if (isNaN(numericUserId) || numericUserId < 1) {
      setError('User ID must be a positive number');
      return;
    }

    if (isNaN(numericTrackId) || numericTrackId < 1) {
      setError('Track ID must be a positive number');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `/api/liked-songs/${numericUserId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trackId: numericTrackId })
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(`✓ Track ${numericTrackId} successfully added to user ${numericUserId}'s liked songs!`);
        setTrackId(''); // Clear track ID for next entry
      } else {
        setError(data.error || data.message || 'Failed to add track to favorites');
      }
    } catch (err) {
      setError('Failed to add track to favorites: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUserId('');
    setTrackId('');
    setSuccess('');
    setError('');
  };

  return (
    <div className="query5-container">
      <div className="query5-header">
        <h1>Query 5: Add Track to Favorites</h1>
        <p className="query5-description">
          Add a track to a user's liked songs collection
        </p>
      </div>

      <form onSubmit={handleSubmit} className="query5-form">
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
          <small className="form-hint">The numeric ID of the user</small>
        </div>

        <div className="form-group">
          <label htmlFor="trackId">Track ID *</label>
          <input
            id="trackId"
            type="number"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="e.g., 42"
            required
            min="1"
            className="form-input"
          />
          <small className="form-hint">The numeric ID of the track to add</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add to Favorites'}
          </button>
          <button type="button" onClick={handleReset} className="btn-secondary">
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <div className="error-help">
            <p>Common issues:</p>
            <ul>
              <li>User ID doesn't exist in the database</li>
              <li>Track ID doesn't exist in the database</li>
              <li>Track is already in user's favorites</li>
            </ul>
          </div>
        </div>
      )}

      {success && (
        <div className="success-message">
          <div className="success-icon">✓</div>
          <div className="success-content">
            <h3>Success!</h3>
            <p>{success}</p>
          </div>
        </div>
      )}

      <div className="info-panel">
        <h3>How to Use</h3>
        <ol>
          <li>Enter a valid User ID (you can find user IDs in the database or from Query 4)</li>
          <li>Enter a valid Track ID (you can find track IDs from Query 2 or Query 3)</li>
          <li>Click "Add to Favorites" to save the track to the user's collection</li>
        </ol>
        <p className="info-note">
          <strong>Note:</strong> If the track is already in the user's favorites, the operation will succeed silently (no duplicate entries).
        </p>
      </div>

      <div className="navigation-links">
        <a href="/query4">← Previous Query</a>
        <a href="/">Home</a>
        <a href="/query6">Next Query →</a>
      </div>
    </div>
  );
};

export default Query5;
