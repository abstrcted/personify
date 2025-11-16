// Personify Backend Server
// Handles Spotify OAuth authentication and API requests

import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URI,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Scopes - what permissions we're requesting from the user
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'playlist-read-private'
];

// ===== ROUTES =====

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Personify Backend Running! 🎵',
    endpoints: {
      spotify: {
        '/login': 'Initiate Spotify OAuth',
        '/callback': 'OAuth callback handler',
        '/refresh': 'Refresh access token',
        '/me': 'Get current user profile',
        '/top-tracks': 'Get user top tracks',
        '/top-artists': 'Get user top artists',
        '/audio-features': 'Get audio features (Spotify)',
        '/recently-played': 'Get recently played tracks'
      },
      getsongbpm: {
        '/api/getsongbpm/track/:artist/:title': 'Get audio features for single track',
        '/api/getsongbpm/batch': 'POST - Batch fetch audio features'
      },
      database: {
        '/store-top-tracks': 'POST - Store user and tracks',
        '/store-tracks-data': 'POST - Store tracks with audio features'
      }
    }
  });
});

// Route 1: Initiate Spotify Login
app.get('/login', (req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
  res.redirect(authorizeURL);
});

// Route 2: Callback - Exchange code for tokens
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  console.log('📥 Callback received with code:', code ? 'YES' : 'NO');

  if (!code) {
    console.log('❌ No authorization code received');
    return res.redirect(`${process.env.FRONTEND_URI}?error=no_code`);
  }

  try {
    // Exchange authorization code for access token and refresh token
    console.log('🔄 Exchanging code for tokens...');
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    console.log('✅ Tokens received successfully');
    console.log('Redirecting to:', `${process.env.FRONTEND_URI}/callback`);

    // Redirect to frontend with tokens in URL (will move to cookies in production)
    res.redirect(
      `${process.env.FRONTEND_URI}/callback?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`
    );
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
    console.error('Error details:', error.body || error);
    res.redirect(`${process.env.FRONTEND_URI}?error=auth_failed`);
  }
});

// Route 3: Refresh access token
app.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  spotifyApi.setRefreshToken(refresh_token);

  try {
    const data = await spotifyApi.refreshAccessToken();
    res.json({
      access_token: data.body.access_token,
      expires_in: data.body.expires_in
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(400).json({ error: 'Failed to refresh token' });
  }
});

// ===== AUTHENTICATED ROUTES =====
// These routes require an access token

// Route 4: Get current user profile
app.get('/me', async (req, res) => {
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    const data = await spotifyApi.getMe();
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(error.statusCode || 500).json({ error: 'Failed to fetch profile' });
  }
});

// Route 5: Get user's top tracks
app.get('/top-tracks', async (req, res) => {
  const { access_token, time_range = 'medium_term', limit = 20 } = req.query;

  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    const data = await spotifyApi.getMyTopTracks({
      time_range, // short_term (~4 weeks), medium_term (~6 months), long_term (years)
      limit: parseInt(limit)
    });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(error.statusCode || 500).json({ error: 'Failed to fetch top tracks' });
  }
});

// Route 6: Get user's top artists
app.get('/top-artists', async (req, res) => {
  const { access_token, time_range = 'medium_term', limit = 20 } = req.query;

  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    const data = await spotifyApi.getMyTopArtists({
      time_range,
      limit: parseInt(limit)
    });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching top artists:', error);
    res.status(error.statusCode || 500).json({ error: 'Failed to fetch top artists' });
  }
});

// Route 7: Get audio features for tracks
app.post('/audio-features', async (req, res) => {
  const { access_token, track_ids } = req.body;

  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!track_ids || !Array.isArray(track_ids)) {
    return res.status(400).json({ error: 'track_ids array required' });
  }

  console.log(`🎵 Fetching audio features for ${track_ids.length} tracks`);
  console.log(`🔑 Token (first 10 chars): ${access_token.substring(0, 10)}...`);

  spotifyApi.setAccessToken(access_token);

  try {
    const data = await spotifyApi.getAudioFeaturesForTracks(track_ids);
    console.log(`✅ Successfully fetched audio features`);
    res.json(data.body);
  } catch (error) {
    console.error('❌ Error fetching audio features:', error);
    console.error('Status:', error.statusCode);
    console.error('Body:', error.body);
    res.status(error.statusCode || 500).json({ 
      error: 'Failed to fetch audio features',
      message: error.message,
      statusCode: error.statusCode
    });
  }
});

// Route 8: Get recently played tracks
app.get('/recently-played', async (req, res) => {
  const { access_token, limit = 20 } = req.query;

  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    const data = await spotifyApi.getMyRecentlyPlayedTracks({
      limit: parseInt(limit)
    });
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching recently played:', error);
    res.status(error.statusCode || 500).json({ error: 'Failed to fetch recently played' });
  }
});

// Route 9: Store user's top tracks in database
app.post('/store-top-tracks', async (req, res) => {
  const { access_token, user_email, time_range = 'medium_term', limit = 50 } = req.body;

  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!user_email) {
    return res.status(400).json({ error: 'User email required' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    console.log(`📥 Storing top tracks for user: ${user_email}`);
    
    // Import database service
    const { saveUser, saveCompleteTrack, getUserAudioFeatureAverages } = await import('./src/services/databaseService.js');
    
    // Get user profile to save user data
    const profileData = await spotifyApi.getMe();
    const userId = saveUser(profileData.body);
    console.log(`✅ User saved/updated: ID ${userId}`);
    
    // Get top tracks
    const tracksData = await spotifyApi.getMyTopTracks({
      time_range,
      limit: parseInt(limit)
    });
    
    const tracks = tracksData.body.items;
    const trackIds = tracks.map(t => t.id);
    
    // Get audio features for all tracks
    const audioFeaturesData = await spotifyApi.getAudioFeaturesForTracks(trackIds);
    const audioFeatures = audioFeaturesData.body.audio_features;
    
    // Store each track with its audio features
    let stored = 0;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const features = audioFeatures[i];
      
      try {
        saveCompleteTrack(track, features, userId);
        stored++;
      } catch (error) {
        console.error(`Failed to store track: ${track.name}`, error.message);
      }
    }
    
    console.log(`✅ Stored ${stored}/${tracks.length} tracks`);
    
    // Get user's audio feature averages
    const averages = getUserAudioFeatureAverages(userId);
    
    res.json({
      success: true,
      message: `Successfully stored ${stored} tracks`,
      user_id: userId,
      tracks_stored: stored,
      audio_feature_averages: averages
    });
    
  } catch (error) {
    console.error('❌ Error storing top tracks:', error);
    res.status(error.statusCode || 500).json({ 
      error: 'Failed to store top tracks',
      message: error.message 
    });
  }
});

// Route 10: Store tracks data (receives data from frontend)
app.post('/store-tracks-data', async (req, res) => {
  const { user_email, user_display_name, tracks, audio_features } = req.body;

  if (!user_email || !tracks) {
    return res.status(400).json({ error: 'Missing required data (user_email and tracks)' });
  }

  try {
    const hasAudioFeatures = audio_features && Array.isArray(audio_features);
    console.log(`📥 Storing ${tracks.length} tracks for user: ${user_email}`);
    console.log(`🎵 Audio features: ${hasAudioFeatures ? 'Yes' : 'No'}`);
    
    // Import database service
    const { saveUser, saveCompleteTrack, getUserAudioFeatureAverages } = await import('./src/services/databaseService.js');
    
    // Save/update user
    const userId = saveUser({ email: user_email, display_name: user_display_name });
    console.log(`✅ User saved/updated: ID ${userId}`);
    
    // Store each track with its audio features (if available)
    let stored = 0;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const features = hasAudioFeatures ? audio_features[i] : null;
      
      try {
        saveCompleteTrack(track, features, userId);
        stored++;
      } catch (error) {
        console.error(`Failed to store track: ${track.name}`, error.message);
      }
    }
    
    console.log(`✅ Stored ${stored}/${tracks.length} tracks`);
    
    // Get user's audio feature averages (only if we have audio features)
    const averages = hasAudioFeatures ? getUserAudioFeatureAverages(userId) : null;
    
    res.json({
      success: true,
      message: `Successfully stored ${stored} tracks`,
      user_id: userId,
      tracks_stored: stored,
      audio_feature_averages: averages
    });
    
  } catch (error) {
    console.error('❌ Error storing tracks data:', error);
    res.status(500).json({ 
      error: 'Failed to store tracks data',
      message: error.message 
    });
  }
});


// ===== GETSONGBPM API ROUTES =====

// Get audio features from GetSongBPM API
app.get('/api/getsongbpm/track/:artist/:title', async (req, res) => {
  try {
    let { artist, title } = req.params;
    const apiKey = process.env.GETSONGBPM_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'GetSongBPM API key not configured' });
    }

    // Clean up title by removing common version info that Spotify adds
    const originalTitle = title;
    title = title
      .replace(/\s*-\s*(Radio Edit|Single Version|Album Version|Remaster|Remastered|Extended Mix|Extended Version|Original Mix|Radio Mix|Edit)\s*(\[.*?\])?/gi, '')
      .replace(/\s*\[.*?\]\s*/g, '') // Remove anything in brackets
      .replace(/\s*\(.*?(Radio Edit|Single Version|Album Version|Remaster|Remastered|Extended Mix|Extended Version|Original Mix|Radio Mix|Edit).*?\)\s*/gi, '')
      .trim();
    
    console.log(`🔍 Fetching from GetSong API: ${artist} - ${originalTitle}`);
    if (title !== originalTitle) {
      console.log(`🧹 Cleaned title: "${originalTitle}" → "${title}"`);
    }

    // Try the search with cleaned title
    let url = `https://api.getsong.co/search/?api_key=${apiKey}&type=both&lookup=song:${encodeURIComponent(title)} artist:${encodeURIComponent(artist)}`;
    console.log(`📡 URL: ${url.replace(apiKey, 'API_KEY')}`);
    
    let response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Personify/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ API returned status ${response.status}`);
      throw new Error(`API returned ${response.status}`);
    }
    
    let data = await response.json();
    
    // If no results and we cleaned the title, try the original title
    if ((!data.search || data.search.length === 0) && title !== originalTitle) {
      console.log(`🔄 No results with cleaned title, trying original: "${originalTitle}"`);
      url = `https://api.getsong.co/search/?api_key=${apiKey}&type=both&lookup=song:${encodeURIComponent(originalTitle)} artist:${encodeURIComponent(artist)}`;
      
      response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Personify/1.0'
        }
      });
      
      if (response.ok) {
        data = await response.json();
      }
    }
    
    // If still no results, try with just the song title (no artist filter)
    if (!data.search || data.search.length === 0) {
      console.log(`🔄 No results with artist filter, trying song-only search: "${title}"`);
      url = `https://api.getsong.co/search/?api_key=${apiKey}&type=song&lookup=${encodeURIComponent(title)}`;
      
      response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Personify/1.0'
        }
      });
      
      if (response.ok) {
        const songOnlyData = await response.json();
        // Filter results by artist name if we got multiple results
        if (songOnlyData.search && songOnlyData.search.length > 0) {
          const matchingTrack = songOnlyData.search.find(track => 
            track.artist?.name?.toLowerCase().includes(artist.toLowerCase()) ||
            artist.toLowerCase().includes(track.artist?.name?.toLowerCase())
          );
          if (matchingTrack) {
            data = { search: [matchingTrack] };
            console.log(`✅ Found match with song-only search`);
          } else {
            // Use first result as fallback
            data = { search: [songOnlyData.search[0]] };
            console.log(`⚠️ Using first result from song-only search (artist may not match exactly)`);
          }
        }
      }
    }
    
    console.log(`📥 API Response:`, JSON.stringify(data, null, 2));
    
    if (data.search && data.search.length > 0) {
      const track = data.search[0];
      
      // Map GetSongBPM data to our expected format
      const audioFeatures = {
        tempo: parseFloat(track.tempo) || null,
        key: track.key_of || null,
        energy: track.energy ? parseFloat(track.energy) / 100 : null,
        danceability: track.danceability ? parseFloat(track.danceability) / 100 : null,
        valence: null, // GetSongBPM doesn't provide this
        acousticness: track.acousticness ? parseFloat(track.acousticness) / 100 : null,
        instrumentalness: null,
        liveness: null,
        speechiness: null,
        artist: track.artist?.name || artist,
        title: track.title || title,
        album: track.album?.title || null,
        genre: track.artist?.genres?.[0] || null
      };
      
      console.log(`✅ Found audio features for: ${artist} - ${originalTitle}`);
      res.json({ success: true, features: audioFeatures, source: 'getsong' });
    } else {
      console.log(`⚠️ Track not found in GetSong database: ${artist} - ${originalTitle}`);
      console.log(`🔄 Trying Spotify as fallback...`);
      
      // Fallback: Try searching GetSong with just the artist name to see if we can find any songs
      // This helps us determine if it's the song that's missing or the API is having issues
      res.json({ 
        success: false, 
        notFound: true,
        message: `Track not available in GetSong database. GetSong API has limited coverage and may not include all songs.` 
      });
    }
    
  } catch (error) {
    console.error('❌ GetSongBPM API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from GetSongBPM',
      message: error.message 
    });
  }
});

// Batch fetch audio features for multiple tracks
app.post('/api/getsongbpm/batch', async (req, res) => {
  try {
    const { tracks } = req.body; // Array of { artist, title, spotify_id }
    
    if (!Array.isArray(tracks)) {
      return res.status(400).json({ error: 'tracks must be an array' });
    }
    
    const results = [];
    const apiKey = process.env.GETSONGBPM_API_KEY;
    
    // Process in batches to avoid rate limiting (max 3 per second recommended)
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      try {
        // Clean up title by removing version info
        let cleanTitle = track.title
          .replace(/\s*-\s*(Radio Edit|Single Version|Album Version|Remaster|Remastered|Extended Mix|Extended Version|Original Mix|Radio Mix|Edit)\s*(\[.*?\])?/gi, '')
          .replace(/\s*\[.*?\]\s*/g, '')
          .replace(/\s*\(.*?(Radio Edit|Single Version|Album Version|Remaster|Remastered|Extended Mix|Extended Version|Original Mix|Radio Mix|Edit).*?\)\s*/gi, '')
          .trim();
        
        const url = `https://api.getsong.co/search/?api_key=${apiKey}&type=both&lookup=song:${encodeURIComponent(cleanTitle)} artist:${encodeURIComponent(track.artist)}`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Personify/1.0'
          }
        });
        const data = await response.json();
        
        if (data.search && data.search.length > 0) {
          const songData = data.search[0];
          results.push({
            spotify_id: track.spotify_id,
            success: true,
            features: {
              tempo: parseFloat(songData.tempo) || null,
              key: songData.key_of || null,
              energy: songData.energy ? parseFloat(songData.energy) / 100 : null,
              danceability: songData.danceability ? parseFloat(songData.danceability) / 100 : null
            }
          });
        } else {
          results.push({
            spotify_id: track.spotify_id,
            success: false,
            error: 'Not found'
          });
        }
        
        // Rate limiting: wait 350ms between requests (slightly less than 3 per second)
        if (i < tracks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 350));
        }
        
      } catch (error) {
        results.push({
          spotify_id: track.spotify_id,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({ 
      success: true, 
      processed: results.length,
      results 
    });
    
  } catch (error) {
    console.error('❌ Batch GetSongBPM Error:', error);
    res.status(500).json({ 
      error: 'Failed to process batch request',
      message: error.message 
    });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Personify Backend running on http://localhost:${PORT}`);
  console.log(`📊 Frontend: ${process.env.FRONTEND_URI}`);
  console.log(`🎵 Spotify Client ID: ${process.env.SPOTIFY_CLIENT_ID?.substring(0, 10)}...`);
  console.log(`🎼 GetSongBPM API: ${process.env.GETSONGBPM_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});
