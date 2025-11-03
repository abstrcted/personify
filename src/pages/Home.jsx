import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import SpotifyLogin from '../components/SpotifyLogin';
import { IconMusic, IconSparkles, IconUsers, IconMicrophone, IconGuitarPick, IconChartBar, IconRefresh } from '@tabler/icons-react';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useSpotifyAuth();

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
        <p className="page-subtitle">Here's what's happening with your music</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <IconMusic size={32} stroke={1.5} />
          </div>
          <div className="stat-content">
            <h3>Top Tracks</h3>
            <p className="stat-value">20</p>
            <p className="stat-label">Saved to database</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <IconMicrophone size={32} stroke={1.5} />
          </div>
          <div className="stat-content">
            <h3>Artists</h3>
            <p className="stat-value">-</p>
            <p className="stat-label">In your library</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <IconGuitarPick size={32} stroke={1.5} />
          </div>
          <div className="stat-content">
            <h3>Genres</h3>
            <p className="stat-value">-</p>
            <p className="stat-label">You explore</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <IconSparkles size={32} stroke={1.5} />
          </div>
          <div className="stat-content">
            <h3>Personality</h3>
            <p className="stat-value">-</p>
            <p className="stat-label">Not yet analyzed</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary">
            <IconChartBar size={20} stroke={2} />
            View Analytics
          </button>
          <button className="action-btn secondary">
            <IconRefresh size={20} stroke={2} />
            Sync Spotify Data
          </button>
          <button className="action-btn secondary">
            <IconSparkles size={20} stroke={2} />
            Take Personality Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
