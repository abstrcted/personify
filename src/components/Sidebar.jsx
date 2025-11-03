import { NavLink } from 'react-router-dom';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import { 
  IconHome, 
  IconChartBar, 
  IconHeadphones, 
  IconMusic, 
  IconMicrophone, 
  IconGuitarPick,
  IconSparkles,
  IconUsers,
  IconSettings,
  IconLogout
} from '@tabler/icons-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useSpotifyAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <IconMusic size={32} stroke={2} />
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
        
        <NavLink to="/overview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconChartBar className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Overview</span>
        </NavLink>

        <NavLink to="/listening-history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconHeadphones className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Listening History</span>
        </NavLink>

        <NavLink to="/top-tracks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconMusic className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Top Tracks</span>
        </NavLink>

        <NavLink to="/top-artists" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconMicrophone className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Top Artists</span>
        </NavLink>

        <NavLink to="/genres" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconGuitarPick className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Genres</span>
        </NavLink>

        <div className="nav-divider"></div>

        <NavLink to="/personality" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconSparkles className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Personality Profile</span>
        </NavLink>

        <NavLink to="/matching" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconUsers className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Find Matches</span>
        </NavLink>

        <div className="nav-divider"></div>

        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <IconSettings className="nav-icon" size={20} stroke={2} />
          <span className="nav-text">Settings</span>
        </NavLink>
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
