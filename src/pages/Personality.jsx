import { useState, useEffect } from 'react';
import { IconSparkles, IconTrendingUp, IconTrendingDown, IconBolt, IconRun, IconMoodHappy, IconMusic, IconWaveSawTool, IconMicrophone, IconVolume } from '@tabler/icons-react';
import './Personality.css';

const Personality = () => {
  const [traits, setTraits] = useState(null);
  const [avgStats, setAvgStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userId = 1; // Hardcoded for now, matches Overview

  // Trait definitions with descriptions
  const traitDefinitions = {
    reflective: {
      name: 'Reflective',
      opposite: 'Conversational',
      description: 'Your preference for instrumental music over spoken word content',
      high: 'You enjoy pure musical expression without words',
      low: 'You appreciate vocal-heavy, conversational music'
    },
    moodiness: {
      name: 'Moodiness',
      opposite: 'Joyfulness',
      description: 'Your tendency toward melancholic or emotionally complex music',
      high: 'You gravitate toward somber, introspective sounds',
      low: 'You lean toward upbeat, positive vibes'
    },
    openness: {
      name: 'Openness',
      opposite: 'Balance',
      description: 'Your willingness to explore diverse artists and genres',
      high: 'You love discovering new artists and sounds',
      low: 'You prefer sticking with familiar favorites'
    },
    chaoticness: {
      name: 'Chaoticness',
      opposite: 'Calmness',
      description: 'Your preference for high-energy, unpredictable music',
      high: 'You thrive on intense, energetic soundscapes',
      low: 'You prefer peaceful, steady rhythms'
    },
    extraversion: {
      name: 'Extraversion',
      opposite: 'Introspection',
      description: 'Your preference for social, danceable music',
      high: 'Your music is made for parties and social settings',
      low: 'Your music is for quiet, personal moments'
    },
    whimsy: {
      name: 'Whimsy',
      opposite: 'Groundedness',
      description: 'Your attraction to ethereal, imaginative sounds',
      high: 'You appreciate acoustic and instrumental beauty',
      low: 'You prefer straightforward, produced music'
    }
  };

  useEffect(() => {
    calculateTraits();
    fetchMusicStats();
  }, []);

  const fetchMusicStats = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/liked-songs/${userId}`);
      const data = await response.json();
      if (data.success && data.avgStats) {
        setAvgStats(data.avgStats);
      }
    } catch (error) {
      console.error('Error fetching music stats:', error);
    }
  };

  const calculateTraits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/calculate-traits?userId=${userId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate traits. Make sure you have liked songs in your library.');
      }
      
      const data = await response.json();
      setTraits(data);
    } catch (err) {
      setError(err.message);
      setTraits(null);
    } finally {
      setLoading(false);
    }
  };

  const getTraitColor = (value) => {
    if (value >= 70) return '#1db954';
    if (value >= 40) return '#ffd700';
    return '#ff6b6b';
  };

  const renderTraitBar = (traitKey, value, oppositeName) => {
    const definition = traitDefinitions[traitKey];
    if (!definition) return null;

    // Handle null, undefined, or invalid values
    const safeValue = value != null && !isNaN(value) ? Math.round(value) : 0;

    return (
      <div className="trait-container" key={traitKey}>
        <div className="trait-header">
          <h3>{definition.name}</h3>
          <span className="trait-value" style={{ color: getTraitColor(safeValue) }}>
            {safeValue}%
          </span>
        </div>
        <p className="trait-description">{definition.description}</p>
        
        <div className="trait-bar-wrapper">
          <span className="trait-label left">{definition.name}</span>
          <div className="trait-bar">
            <div 
              className="trait-fill" 
              style={{ 
                width: `${safeValue}%`,
                backgroundColor: getTraitColor(safeValue)
              }}
            />
            <div className="trait-marker" style={{ left: '50%' }} />
          </div>
          <span className="trait-label right">{oppositeName}</span>
        </div>
        
        <p className="trait-interpretation">
          {safeValue >= 60 ? (
            <><IconTrendingUp size={16} /> {definition.high}</>
          ) : safeValue <= 40 ? (
            <><IconTrendingDown size={16} /> {definition.low}</>
          ) : (
            <>You have a balanced approach to this dimension</>
          )}
        </p>
      </div>
    );
  };

  if (loading && !traits) {
    return (
      <div className="personality-container">
        <div className="personality-header">
          <IconSparkles size={40} />
          <h1>Personality Profile</h1>
        </div>
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your personality profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="personality-container">
      <div className="personality-header">
        <IconSparkles size={40} />
        <h1>Your Music Personality</h1>
        <p className="subtitle">
          Discover your musical personality traits based on your listening habits
        </p>
      </div>

      {/* Music Characteristics Section */}
      {avgStats && (
        <section className="music-characteristics-section">
          <h2 className="section-title">Your Music Characteristics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon energy">
                <IconBolt size={32} stroke={1.5} />
              </div>
              <div className="stat-content">
                <h3>Energy</h3>
                <p className="stat-value">{(parseFloat(avgStats.avgEnergy) * 100).toFixed(1)}%</p>
                <p className="stat-label">Average intensity</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon danceability">
                <IconRun size={32} stroke={1.5} />
              </div>
              <div className="stat-content">
                <h3>Danceability</h3>
                <p className="stat-value">{(parseFloat(avgStats.avgDanceability) * 100).toFixed(1)}%</p>
                <p className="stat-label">How danceable</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon valence">
                <IconMoodHappy size={32} stroke={1.5} />
              </div>
              <div className="stat-content">
                <h3>Valence</h3>
                <p className="stat-value">{(parseFloat(avgStats.avgValence) * 100).toFixed(1)}%</p>
                <p className="stat-label">Musical positivity</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon acousticness">
                <IconMusic size={32} stroke={1.5} />
              </div>
              <div className="stat-content">
                <h3>Acousticness</h3>
                <p className="stat-value">{(parseFloat(avgStats.avgAcousticness) * 100).toFixed(1)}%</p>
                <p className="stat-label">Acoustic sound</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon instrumentalness">
                <IconWaveSawTool size={32} stroke={1.5} />
              </div>
              <div className="stat-content">
                <h3>Instrumentalness</h3>
                <p className="stat-value">{(parseFloat(avgStats.avgInstrumentalness) * 100).toFixed(1)}%</p>
                <p className="stat-label">Instrumental tracks</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon speechiness">
                <IconMicrophone size={32} stroke={1.5} />
              </div>
              <div className="stat-content">
                <h3>Speechiness</h3>
                <p className="stat-value">{(parseFloat(avgStats.avgSpeechiness) * 100).toFixed(1)}%</p>
                <p className="stat-label">Spoken words</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon tempo">
                <IconVolume size={32} stroke={1.5} />
              </div>
              <div className="stat-content">
                <h3>Avg Tempo</h3>
                <p className="stat-value">{Math.round(parseFloat(avgStats.avgTempo))}</p>
                <p className="stat-label">BPM</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!traits ? (
        <div className="empty-state">
          <IconSparkles size={80} className="empty-icon" />
          <h2>Building Your Personality Profile</h2>
          <p>
            We&apos;re analyzing your liked songs to determine your unique music personality...
          </p>
          {loading && <div className="spinner" />}
        </div>
      ) : (
        <div className="traits-content">
          <div className="traits-grid">{renderTraitBar('reflective', traits.reflective, 'Conversational')}
            {renderTraitBar('moodiness', traits.moodiness, 'Joyfulness')}
            {renderTraitBar('openness', traits.openness, 'Balance')}
            {renderTraitBar('chaoticness', traits.chaoticness, 'Calmness')}
            {renderTraitBar('extraversion', traits.extraversion, 'Introspection')}
            {renderTraitBar('whimsy', traits.whimsy, 'Groundedness')}
          </div>

          <div className="info-card">
            <h3>How are these calculated?</h3>
            <ul>
              <li><strong>Reflective:</strong> Based on speechiness (lower = more instrumental/reflective)</li>
              <li><strong>Moodiness:</strong> Derived from valence (emotional positivity) of your tracks</li>
              <li><strong>Openness:</strong> Measured by artist variety vs. total tracks</li>
              <li><strong>Chaoticness:</strong> Combination of energy, danceability, and valence</li>
              <li><strong>Extraversion:</strong> Based on valence and danceability scores</li>
              <li><strong>Whimsy:</strong> Calculated from acousticness and instrumentalness</li>
            </ul>
            <p className="note">
              Each trait has an opposite dimension (e.g., Reflective ↔ Conversational) that is automatically 
              calculated as 100 minus the primary trait value.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Personality;
