import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import SpotifyLogin from '../components/SpotifyLogin';
import { IconMusic, IconSparkles, IconMicrophone, IconUsers, IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useSpotifyAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbStats, setDbStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState('track_name');
  const [searchMode, setSearchMode] = useState('browse'); // 'browse', 'search', or 'random'
  const [likedSongs, setLikedSongs] = useState(new Set());
  const limit = 50;
  const userId = 1; // Hardcoded for now - in production, get from auth context

  // NOTE: track click handler removed (unused) to satisfy lint rules

  // Fetch liked songs
  const fetchLikedSongs = useCallback(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/liked-songs/${userId}`);
      const data = await response.json();
      if (data.success) {
        const likedIds = new Set(data.songs.map(song => song.track_id));
        setLikedSongs(likedIds);
      }
    } catch (error) {
      console.error('Error fetching liked songs:', error);
    }
  }, [userId]);

  // Toggle like status
  const toggleLike = async (trackId, e) => {
    e.stopPropagation(); // Prevent track click
    try {
      const isLiked = likedSongs.has(trackId);
      
      if (isLiked) {
        // Unlike
        await fetch(`http://127.0.0.1:3001/api/liked-songs/${userId}/${trackId}`, {
          method: 'DELETE'
        });
        setLikedSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(trackId);
          return newSet;
        });
      } else {
        // Like
        await fetch(`http://127.0.0.1:3001/api/liked-songs/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId })
        });
        setLikedSongs(prev => new Set([...prev, trackId]));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Fetch database stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3001/api/db/stats');
        const data = await response.json();
        if (data.success) {
          setDbStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
    fetchLikedSongs();
  }, [fetchLikedSongs]);

  // Fetch tracks from database
  const fetchTracks = useCallback(async (mode = 'browse', query = '') => {
    setLoading(true);
    try {
      let url;
      if (mode === 'search' && query.trim().length >= 2) {
        url = `http://127.0.0.1:3001/api/db/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      } else if (mode === 'random') {
        url = `http://127.0.0.1:3001/api/db/random?limit=${limit}`;
      } else {
        const offset = currentPage * limit;
        url = `http://127.0.0.1:3001/api/db/browse?limit=${limit}&offset=${offset}&sort=${sortBy}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTracks(data.tracks);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy]);

  useEffect(() => {
    if (isAuthenticated && searchMode === 'browse') {
      fetchTracks('browse');
    }
  }, [isAuthenticated, currentPage, sortBy, searchMode, fetchTracks]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setCurrentPage(0);
      setSearchMode('search');
      fetchTracks('search', searchQuery);
    }
  };

  const handleRandom = () => {
    setCurrentPage(0);
    setSearchMode('random');
    fetchTracks('random');
  };
  
  const handleBackToBrowse = () => {
    setSearchQuery('');
    setCurrentPage(0);
    setSearchMode('browse');
    fetchTracks('browse');
  };

  if (!isAuthenticated) {
    return (
      <div className="home-welcome">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome to Personify</h1>
          <p className="welcome-subtitle">Discover how your music reflects your personality</p>
          
          <div className="welcome-features">
            <div className="feature-card">
              <span className="feature-icon">
                <IconMusic size={48} stroke={1.5} />
              </span>
              <h3>Analyze Your Music</h3>
              <p>Deep dive into your listening habits and preferences</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">
                <IconSparkles size={48} stroke={1.5} />
              </span>
              <h3>Personality Insights</h3>
              <p>See how your music taste reflects your personality traits</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">
                <IconUsers size={48} stroke={1.5} />
              </span>
              <h3>Find Your Match</h3>
              <p>Connect with users who share similar musical DNA</p>
            </div>
          </div>

          <SpotifyLogin />
        </div>
      </div>
    );
  }

  return (
    <div className="home-dashboard">
      <header className="page-header">
        <h1>Welcome back, {user?.display_name}! 👋</h1>
        <p className="page-subtitle">Browse {dbStats?.total_tracks?.toLocaleString() || '...'} tracks in our database</p>
      </header>

      {/* Database Stats */}
      {dbStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <IconMusic size={32} stroke={1.5} />
            </div>
            <div className="stat-content">
              <h3>Total Tracks</h3>
              <p className="stat-value">{dbStats.total_tracks?.toLocaleString()}</p>
              <p className="stat-label">In database</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <IconMicrophone size={32} stroke={1.5} />
            </div>
            <div className="stat-content">
              <h3>Artists</h3>
              <p className="stat-value">{dbStats.total_artists?.toLocaleString()}</p>
              <p className="stat-label">Unique artists</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <IconSparkles size={32} stroke={1.5} />
            </div>
            <div className="stat-content">
              <h3>Audio Features</h3>
              <p className="stat-value">{dbStats.tracks_with_features?.toLocaleString()}</p>
              <p className="stat-label">{dbStats.feature_coverage} coverage</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <IconMusic size={32} stroke={1.5} />
            </div>
            <div className="stat-content">
              <h3>Current Page</h3>
              <p className="stat-value">{currentPage + 1}</p>
              <p className="stat-label">of many</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="browse-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by artist, track, or album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn" disabled={searchQuery.length < 2}>
            Search
          </button>
        </form>
        
        {searchMode !== 'browse' && (
          <button onClick={handleBackToBrowse} className="action-btn secondary">
            Back to Browse
          </button>
        )}
        
        <button onClick={handleRandom} className="action-btn secondary">
          Random
        </button>
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
          disabled={searchMode !== 'browse'}
        >
          <option value="track_name">Name</option>
          <option value="energy">Energy</option>
          <option value="danceability">Danceability</option>
          <option value="valence">Happiness</option>
          <option value="tempo">Tempo</option>
        </select>
      </div>

      {/* Track Grid */}
      <div className="home-track-browser">
        {loading && <div className="loading-state">Loading tracks...</div>}

        {!loading && tracks.length > 0 && (
          <>
            <div className="track-list">
              {tracks.map((track, index) => (
                <div key={track.track_id} className="track-row">
                  <div className="track-row-header">
                    <div className="track-number">{currentPage * 50 + index + 1}</div>
                    <div className="track-main-info">
                      <h3 className="track-title">{track.track_name || 'Unknown Track'}</h3>
                      <div className="track-meta">
                        <span className="track-artist">{track.artists || 'Unknown Artist'}</span>
                        <span className="meta-separator">•</span>
                        <span className="track-album">{track.album_name || 'Unknown Album'}</span>
                        {track.tempo && (
                          <>
                            <span className="meta-separator">•</span>
                            <span className="track-tempo">{Math.round(track.tempo)} BPM</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button 
                      className={`like-btn ${likedSongs.has(track.track_id) ? 'liked' : ''}`}
                      onClick={(e) => toggleLike(track.track_id, e)}
                      title={likedSongs.has(track.track_id) ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                    >
                      {likedSongs.has(track.track_id) ? (
                        <IconHeartFilled size={24} />
                      ) : (
                        <IconHeart size={24} />
                      )}
                    </button>
                  </div>
                  
                  <div className="track-features-grid">
                    <div className="feature-item">
                      <span className="feature-label">Energy</span>
                      <div className="feature-bar-wrapper">
                        <div className="feature-bar-bg">
                          <div 
                            className="feature-bar-fill energy"
                            style={{ width: `${(track.energy || 0) * 100}%` }}
                          />
                        </div>
                        <span className="feature-value">{((track.energy || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="feature-item">
                      <span className="feature-label">Danceability</span>
                      <div className="feature-bar-wrapper">
                        <div className="feature-bar-bg">
                          <div 
                            className="feature-bar-fill danceability"
                            style={{ width: `${(track.danceability || 0) * 100}%` }}
                          />
                        </div>
                        <span className="feature-value">{((track.danceability || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="feature-item">
                      <span className="feature-label">Valence</span>
                      <div className="feature-bar-wrapper">
                        <div className="feature-bar-bg">
                          <div 
                            className="feature-bar-fill valence"
                            style={{ width: `${(track.valence || 0) * 100}%` }}
                          />
                        </div>
                        <span className="feature-value">{((track.valence || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="feature-item">
                      <span className="feature-label">Acousticness</span>
                      <div className="feature-bar-wrapper">
                        <div className="feature-bar-bg">
                          <div 
                            className="feature-bar-fill acousticness"
                            style={{ width: `${(track.acousticness || 0) * 100}%` }}
                          />
                        </div>
                        <span className="feature-value">{((track.acousticness || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="feature-item">
                      <span className="feature-label">Instrumentalness</span>
                      <div className="feature-bar-wrapper">
                        <div className="feature-bar-bg">
                          <div 
                            className="feature-bar-fill instrumentalness"
                            style={{ width: `${(track.instrumentalness || 0) * 100}%` }}
                          />
                        </div>
                        <span className="feature-value">{((track.instrumentalness || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="feature-item">
                      <span className="feature-label">Speechiness</span>
                      <div className="feature-bar-wrapper">
                        <div className="feature-bar-bg">
                          <div 
                            className="feature-bar-fill speechiness"
                            style={{ width: `${(track.speechiness || 0) * 100}%` }}
                          />
                        </div>
                        <span className="feature-value">{((track.speechiness || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="action-btn secondary"
              >
                Previous
              </button>
              <span className="page-info">Page {currentPage + 1}</span>
              <button 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={tracks.length < 50}
                className="action-btn secondary"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;