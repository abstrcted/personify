import { useState, useEffect } from 'react';
import { IconHeart, IconMusic, IconBolt, IconMoodHappy, IconRun, IconMicrophone, IconVolume, IconWaveSawTool, IconX } from '@tabler/icons-react';
import './Overview.css';

const Overview = () => {
  const [likedSongs, setLikedSongs] = useState([]);
  const [avgStats, setAvgStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = 1; // Hardcoded for now

  const fetchLikedSongs = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/liked-songs/${userId}`);
      const data = await response.json();
      if (data.success) {
        setLikedSongs(data.songs);
        setAvgStats(data.avgStats);
      }
    } catch (error) {
      console.error('Error fetching liked songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSong = async (trackId) => {
    try {
      await fetch(`http://127.0.0.1:3001/api/liked-songs/${userId}/${trackId}`, {
        method: 'DELETE'
      });
      // Refetch to update stats and list
      fetchLikedSongs();
    } catch (error) {
      console.error('Error removing song:', error);
    }
  };

  useEffect(() => {
    fetchLikedSongs();
  }, [userId]);

  if (loading) {
    return <div className="loading-state">Loading your music profile...</div>;
  }

  if (likedSongs.length === 0) {
    return (
      <div className="overview-empty">
        <IconHeart size={64} stroke={1.5} />
        <h2>No Liked Songs Yet</h2>
        <p>Start liking songs from the Home page to see your music profile here!</p>
      </div>
    );
  }

  return (
    <div className="overview-page">
      <header className="page-header">
        <h1>Your Music Profile</h1>
        <p className="page-subtitle">
          {likedSongs.length} liked {likedSongs.length === 1 ? 'song' : 'songs'}
        </p>
      </header>

      {/* Average Audio Features */}
      {avgStats && (
        <section className="overview-stats">
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

      {/* Liked Songs List */}
      <section className="liked-songs-section">
        <h2 className="section-title">Your Liked Songs</h2>
        <div className="track-list">
          {likedSongs.map((song, index) => (
            <div key={song.track_id} className="track-row">
              <div className="track-row-header">
                <div className="track-number">{index + 1}</div>
                <div className="track-main-info">
                  <h3 className="track-title">{song.track_name}</h3>
                  <div className="track-meta">
                    <span className="track-artist">{song.artists}</span>
                    <span className="meta-separator">•</span>
                    <span className="track-album">{song.album_name || 'Unknown Album'}</span>
                    {song.tempo && (
                      <>
                        <span className="meta-separator">•</span>
                        <span className="track-tempo">{Math.round(song.tempo)} BPM</span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeSong(song.track_id)}
                  title="Remove from Liked Songs"
                >
                  <IconX size={20} />
                </button>
              </div>
              
              <div className="track-features-grid">
                <div className="feature-item">
                  <span className="feature-label">Energy</span>
                  <div className="feature-bar-wrapper">
                    <div className="feature-bar-bg">
                      <div 
                        className="feature-bar-fill energy"
                        style={{ width: `${(song.energy || 0) * 100}%` }}
                      />
                    </div>
                    <span className="feature-value">{((song.energy || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="feature-item">
                  <span className="feature-label">Danceability</span>
                  <div className="feature-bar-wrapper">
                    <div className="feature-bar-bg">
                      <div 
                        className="feature-bar-fill danceability"
                        style={{ width: `${(song.danceability || 0) * 100}%` }}
                      />
                    </div>
                    <span className="feature-value">{((song.danceability || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="feature-item">
                  <span className="feature-label">Valence</span>
                  <div className="feature-bar-wrapper">
                    <div className="feature-bar-bg">
                      <div 
                        className="feature-bar-fill valence"
                        style={{ width: `${(song.valence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="feature-value">{((song.valence || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="feature-item">
                  <span className="feature-label">Acousticness</span>
                  <div className="feature-bar-wrapper">
                    <div className="feature-bar-bg">
                      <div 
                        className="feature-bar-fill acousticness"
                        style={{ width: `${(song.acousticness || 0) * 100}%` }}
                      />
                    </div>
                    <span className="feature-value">{((song.acousticness || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="feature-item">
                  <span className="feature-label">Instrumentalness</span>
                  <div className="feature-bar-wrapper">
                    <div className="feature-bar-bg">
                      <div 
                        className="feature-bar-fill instrumentalness"
                        style={{ width: `${(song.instrumentalness || 0) * 100}%` }}
                      />
                    </div>
                    <span className="feature-value">{((song.instrumentalness || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="feature-item">
                  <span className="feature-label">Speechiness</span>
                  <div className="feature-bar-wrapper">
                    <div className="feature-bar-bg">
                      <div 
                        className="feature-bar-fill speechiness"
                        style={{ width: `${(song.speechiness || 0) * 100}%` }}
                      />
                    </div>
                    <span className="feature-value">{((song.speechiness || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Overview;
