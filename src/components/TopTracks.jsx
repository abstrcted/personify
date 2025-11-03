// Top Tracks Component - Displays user's top tracks from Spotify
import { useState, useEffect } from 'react';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import './TopTracks.css';

const TopTracks = () => {
  const { accessToken, isAuthenticated, user } = useSpotifyAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('medium_term');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const fetchTopTracks = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:3001/top-tracks?access_token=${accessToken}&time_range=${timeRange}&limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch top tracks');
      }

      const data = await response.json();
      setTracks(data.items);
    } catch (err) {
      console.error('Error fetching top tracks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchTopTracks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, timeRange]);

  const saveToDatabase = async () => {
    if (!accessToken || !user || tracks.length === 0) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      // Get track IDs for audio features
      const trackIds = tracks.map(t => t.id);
      
      let audioFeatures = null;
      
      // Try to fetch audio features directly from Spotify (bypass backend)
      try {
        const trackIdsString = trackIds.join(',');
        const directResponse = await fetch(
          `https://api.spotify.com/v1/audio-features?ids=${trackIdsString}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (directResponse.ok) {
          const directData = await directResponse.json();
          audioFeatures = directData.audio_features;
          console.log('✅ Fetched audio features directly from Spotify for', audioFeatures.length, 'tracks');
        } else {
          const errorData = await directResponse.json();
          console.warn('⚠️ Direct fetch failed:', errorData);
          console.warn('⚠️ Could not fetch audio features, saving tracks without them');
        }
      } catch (audioError) {
        console.warn('⚠️ Audio features fetch failed:', audioError.message);
      }
      
      // Send tracks + audio features (or null) to backend for storage
      const response = await fetch('http://127.0.0.1:3001/store-tracks-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          user_display_name: user.display_name,
          tracks: tracks,
          audio_features: audioFeatures
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save tracks');
      }

      const data = await response.json();
      
      const featureMsg = audioFeatures 
        ? ` with audio features` 
        : ` (audio features not available - try logging in again)`;
      
      setSaveMessage({
        type: 'success',
        text: `✅ ${data.message}! Saved ${data.tracks_stored} tracks${featureMsg}.`
      });
      
      if (data.audio_feature_averages) {
        console.log('Audio feature averages:', data.audio_feature_averages);
      }
      
    } catch (err) {
      console.error('Error saving to database:', err);
      setSaveMessage({
        type: 'error',
        text: '❌ Failed to save tracks. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show if not logged in
  }

  return (
    <div className="top-tracks-container">
      <div className="top-tracks-header">
        <h2>🎵 Your Top Tracks</h2>
        <div className="header-actions">
          <div className="time-range-buttons">
            <Button
              size="sm"
              variant={timeRange === 'short_term' ? 'success' : 'outline-secondary'}
              onClick={() => setTimeRange('short_term')}
            >
              Last 4 Weeks
            </Button>
            <Button
              size="sm"
              variant={timeRange === 'medium_term' ? 'success' : 'outline-secondary'}
              onClick={() => setTimeRange('medium_term')}
            >
              Last 6 Months
            </Button>
            <Button
              size="sm"
              variant={timeRange === 'long_term' ? 'success' : 'outline-secondary'}
              onClick={() => setTimeRange('long_term')}
            >
              All Time
            </Button>
          </div>
          
          <Button
            variant="primary"
            onClick={saveToDatabase}
            disabled={saving || tracks.length === 0}
            className="save-button"
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>💾 Save to Database</>
            )}
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div className={`alert alert-${saveMessage.type === 'success' ? 'success' : 'danger'}`}>
          {saveMessage.text}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <Spinner animation="border" variant="success" />
          <p>Loading your top tracks...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>❌ Error: {error}</p>
          <Button onClick={fetchTopTracks} variant="outline-danger" size="sm">
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && tracks.length > 0 && (
        <div className="tracks-grid">
          {tracks.map((track, index) => (
            <Card key={track.id} className="track-card">
              <div className="track-rank">#{index + 1}</div>
              <Card.Img
                variant="top"
                src={track.album.images[0]?.url}
                alt={track.name}
                className="track-image"
              />
              <Card.Body>
                <Card.Title className="track-name">{track.name}</Card.Title>
                <Card.Text className="track-artist">
                  {track.artists.map(artist => artist.name).join(', ')}
                </Card.Text>
                <div className="track-details">
                  <Badge bg="dark">{track.album.name}</Badge>
                  <Badge bg="success">
                    {Math.floor(track.duration_ms / 60000)}:
                    {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                  </Badge>
                  <Badge bg="info">Popularity: {track.popularity}</Badge>
                </div>
                <div className="track-actions">
                  <Button
                    href={track.external_urls.spotify}
                    target="_blank"
                    variant="success"
                    size="sm"
                    className="spotify-link"
                  >
                    🎵 Open in Spotify
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && tracks.length === 0 && (
        <div className="no-tracks">
          <p>No tracks found. Start listening to music on Spotify!</p>
        </div>
      )}
    </div>
  );
};

export default TopTracks;
