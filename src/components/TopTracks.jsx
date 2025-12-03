// Top Tracks Component - Displays user's top tracks from Spotify
import { useState, useEffect } from 'react';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import { Card, Button, Spinner, Badge, Collapse } from 'react-bootstrap';
import AudioFeatures from './AudioFeatures';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import './TopTracks.css';

const TopTracks = () => {
  const { accessToken, isAuthenticated, user } = useSpotifyAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('medium_term');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [audioFeaturesMap, setAudioFeaturesMap] = useState({});
  const [expandedTrack, setExpandedTrack] = useState(null);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [loadingTrackFeatures, setLoadingTrackFeatures] = useState({});

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

  const fetchAudioFeatures = async () => {
    if (tracks.length === 0) return;
    
    setLoadingFeatures(true);
    
    try {
      // Prepare track data for GetSongBPM API
      const tracksForBatch = tracks.map(track => ({
        spotify_id: track.id,
        artist: track.artists[0].name,
        title: track.name
      }));
      
      console.log(`🎵 Fetching audio features for ${tracksForBatch.length} tracks...`);
      
      const batchResponse = await fetch('http://127.0.0.1:3001/api/getsongbpm/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: tracksForBatch })
      });

      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        console.log(`✅ GetSongBPM processed ${batchData.processed} tracks`);
        
        // Create a map of spotify_id -> features
        const featuresMap = {};
        batchData.results.forEach(result => {
          if (result.success && result.features) {
            featuresMap[result.spotify_id] = result.features;
          }
        });
        
        setAudioFeaturesMap(featuresMap);
        console.log(`✅ Successfully got features for ${Object.keys(featuresMap).length} tracks`);
      } else {
        console.warn('⚠️ GetSongBPM batch fetch failed');
      }
    } catch (error) {
      console.error('❌ Error fetching audio features:', error);
    } finally {
      setLoadingFeatures(false);
    }
  };

  const fetchSingleTrackFeatures = async (track) => {
    console.log('🎵 fetchSingleTrackFeatures called for:', track.name);
    
    if (audioFeaturesMap[track.id]) {
      // Already have features, just toggle
      console.log('✅ Features already loaded, toggling display');
      setExpandedTrack(expandedTrack === track.id ? null : track.id);
      return;
    }
    
    // Show loading state
    setLoadingTrackFeatures(prev => ({ ...prev, [track.id]: true }));
    
    try {
      const artist = track.artists[0]?.name || 'Unknown Artist';

      // First try local DB
      const dbUrl = `http://127.0.0.1:3001/api/db/track/${encodeURIComponent(artist)}/${encodeURIComponent(track.name)}`;
      console.log('📡 Checking local DB for audio features:', dbUrl);
      let response = await fetch(dbUrl);
      if (response.ok) {
        const dbData = await response.json();
        console.log('📥 Local DB response:', dbData);
        if (dbData.success && dbData.features) {
          setAudioFeaturesMap(prev => ({ ...prev, [track.id]: dbData.features }));
          setExpandedTrack(track.id);
          return;
        }
      }

      // Try RapidAPI Track Analysis
      const rapidUrl = `http://127.0.0.1:3001/api/rapidapi/track/${encodeURIComponent(artist)}/${encodeURIComponent(track.name)}`;
      console.log('📡 Trying RapidAPI Track Analysis:', rapidUrl);
      response = await fetch(rapidUrl);
      if (response.ok) {
        const rapidData = await response.json();
        console.log('📥 RapidAPI response:', rapidData);
        if (rapidData.success && rapidData.features) {
          console.log('✅ Audio features loaded from RapidAPI:', rapidData.features);
          setAudioFeaturesMap(prev => ({ ...prev, [track.id]: rapidData.features }));
          setExpandedTrack(track.id);
          return;
        }
      }

      // Fall back to GetSong API
      const apiUrl = `http://127.0.0.1:3001/api/getsongbpm/track/${encodeURIComponent(artist)}/${encodeURIComponent(track.name)}`;
      console.log('📡 Fetching audio features from GetSong API:', apiUrl);
      response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 GetSong API Response:', data);

      if (data.success && data.features) {
        console.log('✅ Audio features loaded from GetSong:', data.features);
        setAudioFeaturesMap(prev => ({ ...prev, [track.id]: data.features }));
        setExpandedTrack(track.id);
      } else if (data.notFound) {
        console.log('⚠️ Track not found in GetSong database');
        setAudioFeaturesMap(prev => ({ ...prev, [track.id]: { notFound: true, message: data.message } }));
        setExpandedTrack(track.id);
      } else {
        throw new Error(data.error || 'No features found');
      }
    } catch (error) {
      console.error('❌ Failed to fetch audio features:', error.message);
      setAudioFeaturesMap(prev => ({ ...prev, [track.id]: { error: true, message: error.message } }));
      setExpandedTrack(track.id);
    } finally {
      setLoadingTrackFeatures(prev => ({ ...prev, [track.id]: false }));
    }
  };

  const saveToDatabase = async () => {
    if (!accessToken || !user || tracks.length === 0) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      // Prepare track data for GetSongBPM API
      const tracksForBatch = tracks.map(track => ({
        spotify_id: track.id,
        artist: track.artists[0].name,
        title: track.name
      }));
      
      console.log(`🎵 Fetching audio features for ${tracksForBatch.length} tracks from GetSongBPM...`);
      
      // Fetch audio features from GetSongBPM API
      let audioFeaturesMap = {};
      
      try {
        const batchResponse = await fetch('http://127.0.0.1:3001/api/getsongbpm/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks: tracksForBatch })
        });

        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          console.log(`✅ GetSongBPM processed ${batchData.processed} tracks`);
          
          // Create a map of spotify_id -> features
          batchData.results.forEach(result => {
            if (result.success && result.features) {
              audioFeaturesMap[result.spotify_id] = result.features;
            }
          });
          
          console.log(`✅ Successfully got features for ${Object.keys(audioFeaturesMap).length} tracks`);
          
          // Store features in state for display
          setAudioFeaturesMap(audioFeaturesMap);
        } else {
          console.warn('⚠️ GetSongBPM batch fetch failed');
        }
      } catch (audioError) {
        console.warn('⚠️ Audio features fetch failed:', audioError.message);
      }
      
      // Convert audioFeaturesMap to array format matching Spotify's structure
      const audioFeatures = tracks.map(track => {
        const features = audioFeaturesMap[track.id];
        if (features) {
          return {
            id: track.id,
            tempo: features.tempo,
            key: features.key,
            energy: features.energy,
            danceability: features.danceability,
            valence: null, // GetSongBPM doesn't provide these
            acousticness: null,
            instrumentalness: null,
            liveness: null,
            speechiness: null
          };
        }
        return null;
      });
      
      // Send tracks + audio features to backend for storage
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
            variant="info"
            onClick={fetchAudioFeatures}
            disabled={loadingFeatures || tracks.length === 0}
            className="features-button"
          >
            {loadingFeatures ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Loading Features...
              </>
            ) : (
              <>🎼 Show Audio Features</>
            )}
          </Button>
          
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
                
                {/* Audio Features Display - Always show button */}
                <div className="track-audio-features">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => fetchSingleTrackFeatures(track)}
                    className="features-toggle"
                    disabled={loadingTrackFeatures[track.id]}
                  >
                    {loadingTrackFeatures[track.id] ? (
                      <>
                        <Spinner animation="border" size="sm" /> Loading...
                      </>
                    ) : expandedTrack === track.id && audioFeaturesMap[track.id] ? (
                      <>
                        <IconChevronUp size={16} /> Hide Features
                      </>
                    ) : (
                      <>
                        <IconChevronDown size={16} /> Show Features
                      </>
                    )}
                  </Button>
                  
                  <Collapse in={expandedTrack === track.id && !!audioFeaturesMap[track.id]}>
                    <div className="features-collapse">
                      {audioFeaturesMap[track.id] && (
                        <AudioFeatures 
                          features={audioFeaturesMap[track.id]} 
                          trackName={null}
                        />
                      )}
                    </div>
                  </Collapse>
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
