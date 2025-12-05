import { NavLink } from 'react-router-dom';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import { 
  IconHome, 
  IconMusic, 
  IconMicrophone, 
  IconSparkles,
  IconLogout,
  IconDatabase
} from '@tabler/icons-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout, isAuthenticated } = useSpotifyAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <img src="/Logo.png" alt="Personify Logo" className="sidebar-logo-img" />
          Personify
        </h1>
        <p className="sidebar-tagline">Music meets personality</p>
      </div>

      {user && (
        <div className="sidebar-user">
          {user.images?.[0]?.url && (
            <img src={user.images[0].url} alt={user.display_name} className="sidebar-user-avatar" />
          )}
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.display_name}</p>
            <p className="sidebar-user-email">{user.email}</p>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconHome className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Home</span>
        </NavLink>

        <NavLink to="/top-tracks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} title={!isAuthenticated ? 'Requires Spotify connection' : ''}>
          <IconMusic className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Top Tracks {!isAuthenticated && <span className="spotify-required">🔒</span>}</span>
        </NavLink>

        <NavLink to="/top-artists" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} title={!isAuthenticated ? 'Requires Spotify connection' : ''}>
          <IconMicrophone className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Top Artists {!isAuthenticated && <span className="spotify-required">🔒</span>}</span>
        </NavLink>

        <div className="nav-divider"></div>

        <NavLink to="/personality" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconSparkles className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Personality Profile</span>
        </NavLink>

        <div className="nav-divider"></div>

        <div className="nav-section-title">Database Queries</div>
        
        <NavLink to="/query1" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconDatabase className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Query 1: Track Lookup</span>
        </NavLink>

        <NavLink to="/query2" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconDatabase className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Query 2: Track Search</span>
        </NavLink>

        <NavLink to="/query3" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconDatabase className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Query 3: Browse Tracks</span>
        </NavLink>

        <NavLink to="/query4" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconDatabase className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Query 4: User Stats</span>
        </NavLink>

        <NavLink to="/query5" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconDatabase className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Query 5: Add Favorite</span>
        </NavLink>

        <NavLink to="/query6" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconDatabase className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Query 6: Transaction</span>
        </NavLink>

        <div className="nav-divider"></div>
      </nav>

      {user && (
        <button className="sidebar-logout" onClick={logout}>
          <IconLogout className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Logout</span>
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
