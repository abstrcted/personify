import { useState, useEffect, useCallback } from 'react';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import SpotifyLogin from '../components/SpotifyLogin';
import { IconMusic, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import './TopArtists.css';

const TopArtists = () => {
  const { accessToken, isAuthenticated } = useSpotifyAuth();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('medium_term');
  const [expandedArtist, setExpandedArtist] = useState(null);
  const [artistTracks, setArtistTracks] = useState({});
  const [loadingTracks, setLoadingTracks] = useState({});

  const fetchTopArtists = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:3001/top-artists?access_token=${accessToken}&time_range=${timeRange}&limit=20`
      );
      const data = await response.json();
      if (data.items) {
        setArtists(data.items);
      }
    } catch (error) {
      console.error('Error fetching top artists:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, timeRange]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchTopArtists();
    }
  }, [isAuthenticated, accessToken, timeRange, fetchTopArtists]);

  const fetchArtistTopTracks = async (artistId) => {
    if (artistTracks[artistId]) {
      // Already loaded, just toggle
      setExpandedArtist(expandedArtist === artistId ? null : artistId);
      return;
    }

    setLoadingTracks(prev => ({ ...prev, [artistId]: true }));
    try {
      const response = await fetch(
        `http://127.0.0.1:3001/artist-top-tracks/${artistId}?access_token=${accessToken}&market=US`
      );
      const data = await response.json();
      if (data.tracks) {
        setArtistTracks(prev => ({ ...prev, [artistId]: data.tracks }));
        setExpandedArtist(artistId);
      }
    } catch (error) {
      console.error('Error fetching artist top tracks:', error);
    } finally {
      setLoadingTracks(prev => ({ ...prev, [artistId]: false }));
    }
  };

  // time range label helper removed (unused)

  if (!isAuthenticated) {
    return (
      <div className="top-artists-login">
        <div className="feature-locked-message">
          <h2>🎤 Top Artists</h2>
          <p className="locked-description">
            This feature requires Spotify authentication to access your personal listening history.
          </p>
          <SpotifyLogin />
          <div className="feature-note">
            <strong>Note:</strong> You can still explore our 1.2M song database and calculate personality profiles without connecting Spotify!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="top-artists-container">
      <header className="page-header">
        <h1>Your Top Artists</h1>
        <p className="page-subtitle">Your most listened to artists on Spotify</p>
      </header>

      <div className="time-range-selector">
        <button
          className={`time-btn ${timeRange === 'short_term' ? 'active' : ''}`}
          onClick={() => setTimeRange('short_term')}
        >
          Last 4 Weeks
        </button>
        <button
          className={`time-btn ${timeRange === 'medium_term' ? 'active' : ''}`}
          onClick={() => setTimeRange('medium_term')}
        >
          Last 6 Months
        </button>
        <button
          className={`time-btn ${timeRange === 'long_term' ? 'active' : ''}`}
          onClick={() => setTimeRange('long_term')}
        >
          All Time
        </button>
      </div>

      {loading && <div className="loading-state">Loading your top artists...</div>}

      {!loading && artists.length > 0 && (
        <div className="top-artists-page">
          <div className="artists-main-content">
            <div className="artists-list">
              {artists.map((artist, index) => (
                <div 
                  key={artist.id} 
                  className="artist-card"
                  onClick={() => fetchArtistTopTracks(artist.id)}
                >
                  <div className="artist-rank">{index + 1}</div>
                  <div className="artist-header">
                    {artist.images && artist.images[0] && (
                      <img
                        src={artist.images[0].url}
                        alt={artist.name}
                        className="artist-image"
                      />
                    )}
                    <div className="artist-info">
                      <h3 className="artist-name">{artist.name}</h3>
                      <div className="artist-meta">
                        <span className="artist-genres">
                          {artist.genres.slice(0, 2).join(', ') || 'Various'}
                        </span>
                        <span className="artist-followers">
                          {artist.followers.total.toLocaleString()} followers
                        </span>
                        <span className="artist-popularity">
                          {artist.popularity}% popularity
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tracks-sidebar">
            <div className="tracks-sidebar-header">
              <IconMusic size={24} />
              <h3>Top Tracks</h3>
            </div>

            {expandedArtist && artistTracks[expandedArtist] && (
              <>
                <div className="selected-artist-info">
                  {artists.find(a => a.id === expandedArtist)?.images[0] && (
                    <img
                      src={artists.find(a => a.id === expandedArtist).images[0].url}
                      alt=""
                      className="selected-artist-image"
                    />
                  )}
                  <div className="selected-artist-name">
                    {artists.find(a => a.id === expandedArtist)?.name}
                  </div>
                </div>

                <div className="artist-top-tracks">
                  <div className="tracks-list">
                    {artistTracks[expandedArtist].slice(0, 10).map((track) => (
                      <div key={track.id} className="track-item">
                        {track.album.images && track.album.images[1] && (
                          <img
                            src={track.album.images[1].url}
                            alt={track.album.name}
                            className="track-image"
                          />
                        )}
                        <div className="track-name">{track.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!expandedArtist && (
              <div className="tracks-sidebar-empty">
                <IconMusic size={48} stroke={1.5} />
                <p>Click an artist to see their top tracks</p>
              </div>
            )}

            {loadingTracks[expandedArtist] && (
              <div className="tracks-sidebar-empty">
                <p>Loading tracks...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && artists.length === 0 && (
        <div className="empty-state">
          <h3>No Artists Found</h3>
          <p>Start listening to music on Spotify to see your top artists here!</p>
        </div>
      )}
    </div>
  );
};

export default TopArtists;
