import { Card, ProgressBar, Badge } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { IconMusic, IconBolt, IconMoodHappy, IconWalk, IconKey, IconGauge } from '@tabler/icons-react';
import './AudioFeatures.css';

const AudioFeatures = ({ features, trackName }) => {
  // Handle error state
  if (features?.error) {
    return (
      <Card className="audio-features-card error-state">
        <Card.Body>
          <div className="no-features">
            <IconMusic size={32} stroke={1.5} className="text-danger" />
            <p className="text-danger">Error loading audio features</p>
            <small className="text-muted">{features.message}</small>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Handle not found state
  if (features?.notFound) {
    return (
      <Card className="audio-features-card not-found-state">
        <Card.Body>
          <div className="no-features">
            <IconMusic size={32} stroke={1.5} className="text-warning" />
            <p className="text-warning">Track not found in GetSong database</p>
            <small className="text-muted">This track may not be available in the audio features database yet.</small>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Handle no features
  if (!features) {
    return (
      <Card className="audio-features-card">
        <Card.Body>
          <div className="no-features">
            <IconMusic size={32} stroke={1.5} />
            <p>No audio features available for this track</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const getKeyLabel = (key) => {
    const keys = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
    if (typeof key === 'number' && key >= 0 && key <= 11) {
      return keys[key];
    }
    return key || 'Unknown';
  };

  const getEnergyColor = (value) => {
    if (value >= 0.7) return 'danger';
    if (value >= 0.4) return 'warning';
    return 'info';
  };

  const getDanceabilityColor = (value) => {
    if (value >= 0.7) return 'success';
    if (value >= 0.4) return 'primary';
    return 'secondary';
  };

  return (
    <Card className="audio-features-card">
      <Card.Body>
        {trackName && <h5 className="features-title">{trackName}</h5>}
        
        <div className="features-grid">
          {/* Tempo/BPM */}
          {features.tempo && (
            <div className="feature-item">
              <div className="feature-header">
                <IconGauge size={20} stroke={2} />
                <span className="feature-label">Tempo</span>
              </div>
              <div className="feature-value-large">{Math.round(features.tempo)} BPM</div>
            </div>
          )}

          {/* Musical Key */}
          {features.key && (
            <div className="feature-item">
              <div className="feature-header">
                <IconKey size={20} stroke={2} />
                <span className="feature-label">Key</span>
              </div>
              <div className="feature-value-large">{getKeyLabel(features.key)}</div>
            </div>
          )}

          {/* Energy */}
          {features.energy !== null && features.energy !== undefined && (
            <div className="feature-item full-width">
              <div className="feature-header">
                <IconBolt size={20} stroke={2} />
                <span className="feature-label">Energy</span>
                <Badge bg={getEnergyColor(features.energy)}>
                  {Math.round(features.energy * 100)}%
                </Badge>
              </div>
              <ProgressBar 
                now={features.energy * 100} 
                variant={getEnergyColor(features.energy)}
                className="feature-progress"
              />
              <div className="feature-description">
                {features.energy >= 0.7 && "High energy - intense and fast"}
                {features.energy >= 0.4 && features.energy < 0.7 && "Moderate energy - balanced"}
                {features.energy < 0.4 && "Low energy - calm and relaxed"}
              </div>
            </div>
          )}

          {/* Danceability */}
          {features.danceability !== null && features.danceability !== undefined && (
            <div className="feature-item full-width">
              <div className="feature-header">
                <IconWalk size={20} stroke={2} />
                <span className="feature-label">Danceability</span>
                <Badge bg={getDanceabilityColor(features.danceability)}>
                  {Math.round(features.danceability * 100)}%
                </Badge>
              </div>
              <ProgressBar 
                now={features.danceability * 100} 
                variant={getDanceabilityColor(features.danceability)}
                className="feature-progress"
              />
              <div className="feature-description">
                {features.danceability >= 0.7 && "Very danceable - great for dancing"}
                {features.danceability >= 0.4 && features.danceability < 0.7 && "Moderately danceable"}
                {features.danceability < 0.4 && "Less danceable - not suitable for dancing"}
              </div>
            </div>
          )}

          {/* Valence (if available from Spotify) */}
          {features.valence !== null && features.valence !== undefined && (
            <div className="feature-item full-width">
              <div className="feature-header">
                <IconMoodHappy size={20} stroke={2} />
                <span className="feature-label">Valence (Mood)</span>
                <Badge bg="info">
                  {Math.round(features.valence * 100)}%
                </Badge>
              </div>
              <ProgressBar 
                now={features.valence * 100} 
                variant="info"
                className="feature-progress"
              />
              <div className="feature-description">
                {features.valence >= 0.7 && "Positive mood - happy and cheerful"}
                {features.valence >= 0.3 && features.valence < 0.7 && "Neutral mood"}
                {features.valence < 0.3 && "Negative mood - sad or melancholic"}
              </div>
            </div>
          )}

          {/* Genre (if available) */}
          {features.genre && (
            <div className="feature-item full-width">
              <div className="feature-header">
                <IconMusic size={20} stroke={2} />
                <span className="feature-label">Genre</span>
              </div>
              <Badge bg="dark" className="genre-badge">{features.genre}</Badge>
            </div>
          )}
        </div>

        <div className="features-footer">
          <small className="text-muted">
            Powered by {features.valence !== null ? 'Spotify' : 'GetSongBPM'} API
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

AudioFeatures.propTypes = {
  trackName: PropTypes.string,
  features: PropTypes.shape({
    error: PropTypes.bool,
    message: PropTypes.string,
    notFound: PropTypes.bool,
    tempo: PropTypes.number,
    key: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    energy: PropTypes.number,
    danceability: PropTypes.number,
    valence: PropTypes.number,
    acousticness: PropTypes.number,
    instrumentalness: PropTypes.number,
    liveness: PropTypes.number,
    speechiness: PropTypes.number,
    loudness: PropTypes.number,
    genre: PropTypes.string
  })
};

export default AudioFeatures;
