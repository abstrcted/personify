// Spotify Authentication Context
// Manages Spotify access tokens and user authentication state

import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SpotifyAuthContext = createContext();

export const useSpotifyAuth = () => {
  const context = useContext(SpotifyAuthContext);
  if (!context) {
    throw new Error('useSpotifyAuth must be used within SpotifyAuthProvider');
  }
  return context;
};

export const SpotifyAuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing tokens on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('spotify_access_token');
    const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
    const storedExpiresAt = localStorage.getItem('spotify_expires_at');

    if (storedAccessToken && storedExpiresAt) {
      const expiresAtTime = parseInt(storedExpiresAt);
      
      // Check if token is still valid
      if (Date.now() < expiresAtTime) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setExpiresAt(expiresAtTime);
        fetchUserProfile(storedAccessToken);
      } else if (storedRefreshToken) {
        // Token expired, try to refresh
        refreshAccessToken(storedRefreshToken);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`http://127.0.0.1:3001/me?access_token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh access token
  const refreshAccessToken = async (refresh_token) => {
    try {
      const response = await fetch('http://127.0.0.1:3001/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token })
      });

      if (response.ok) {
        const data = await response.json();
        const newExpiresAt = Date.now() + data.expires_in * 1000;
        
        setAccessToken(data.access_token);
        setExpiresAt(newExpiresAt);
        
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_expires_at', newExpiresAt.toString());
        
        fetchUserProfile(data.access_token);
      } else {
        // Refresh failed, clear tokens
        logout();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
    }
  };

  // Store tokens (called from callback page)
  const setTokens = (access_token, refresh_token, expires_in) => {
    const expiresAtTime = Date.now() + expires_in * 1000;
    
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setExpiresAt(expiresAtTime);

    localStorage.setItem('spotify_access_token', access_token);
    localStorage.setItem('spotify_refresh_token', refresh_token);
    localStorage.setItem('spotify_expires_at', expiresAtTime.toString());

    fetchUserProfile(access_token);
  };

  // Login - redirect to backend OAuth route
  const login = () => {
    window.location.href = 'http://127.0.0.1:3001/login';
  };

  // Logout - clear all tokens
  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    setUser(null);
    
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
  };

  // Check if token needs refresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!accessToken || !expiresAt || !refreshToken) return;

    // Refresh token 5 minutes before expiry
    const timeUntilRefresh = expiresAt - Date.now() - 5 * 60 * 1000;

    if (timeUntilRefresh > 0) {
      const timeoutId = setTimeout(() => {
        refreshAccessToken(refreshToken);
      }, timeUntilRefresh);

      return () => clearTimeout(timeoutId);
    } else {
      // Token already expired or about to expire
      refreshAccessToken(refreshToken);
    }
  }, [accessToken, expiresAt, refreshToken]);

  const value = {
    accessToken,
    refreshToken,
    user,
    loading,
    isAuthenticated: !!accessToken && !!user,
    login,
    logout,
    setTokens
  };

  return (
    <SpotifyAuthContext.Provider value={value}>
      {children}
    </SpotifyAuthContext.Provider>
  );
};

SpotifyAuthProvider.propTypes = {
  children: PropTypes.node
};
