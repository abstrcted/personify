// Callback Page - Handles OAuth redirect from Spotify
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';

const Callback = () => {
  const navigate = useNavigate();
  const { setTokens } = useSpotifyAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const expires_in = params.get('expires_in');
    const error = params.get('error');

    console.log('🔍 Callback - Full URL:', window.location.href);
    console.log('🔍 Callback - Search params:', window.location.search);
    console.log('🔍 Callback - access_token:', access_token ? 'YES' : 'NO');
    console.log('🔍 Callback - refresh_token:', refresh_token ? 'YES' : 'NO');
    console.log('🔍 Callback - expires_in:', expires_in);
    console.log('🔍 Callback - error:', error);

    if (error) {
      console.error('❌ Authentication error:', error);
      navigate('/?error=' + error, { replace: true });
      return;
    }

    if (access_token && refresh_token && expires_in) {
      console.log('✅ Tokens found! Storing...');
      // Store tokens
      setTokens(access_token, refresh_token, parseInt(expires_in));
      
      console.log('✅ Tokens stored! Redirecting to home...');
      // Redirect to home page (replace history so back button works correctly)
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } else {
      console.error('❌ Missing tokens!', { access_token: !!access_token, refresh_token: !!refresh_token, expires_in: !!expires_in });
      // Missing parameters
      navigate('/?error=missing_tokens', { replace: true });
    }
  }, []); // Empty dependency array - only run once

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="loading-spinner"></div>
      <h2>Connecting to Spotify...</h2>
      <p>Please wait while we complete the authentication</p>
    </div>
  );
};

export default Callback;
