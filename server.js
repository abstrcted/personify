// Personify Backend Server
/* eslint-env node */
// Handles Spotify OAuth authentication and API requests

import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import db from './database/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Import query controllers
import { getTrackByArtistTitle } from './controllers/query1.js';
import { searchTracks } from './controllers/query2.js';
import { browseTracks } from './controllers/query3.js';
import { getUserStats } from './controllers/query4.js';
import { addLikedSong } from './controllers/query5.js';
import { getAccounts, transferFunds } from './controllers/query6.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Query Interface Routes (using controllers)
app.get('/api/db/track/:artist/:title', getTrackByArtistTitle);
app.get('/api/db/search', searchTracks);
app.get('/api/db/browse', browseTracks);
app.get('/api/user-stats/:userId', getUserStats);
app.post('/api/liked-songs/:userId', addLikedSong);
app.get('/api/transaction/accounts', getAccounts);
app.post('/api/transaction/transfer', transferFunds);

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// ==================== OLD INLINE ROUTE HANDLERS BELOW ====================
// NOTE: Query routes 1-6 are now handled by controllers in /controllers/*.js
// The routes below are kept but will not be reached since the controller
// routes are registered first and match the same patterns.
// Consider removing these in a future cleanup.

// Get audio features from local database (if present)
app.get('/api/db/track/:artist/:title-OLD', async (req, res) => {
  try {
    const { artist, title } = req.params;
    // Clean title similarly to remote lookup
    const cleanedTitle = title
      .replace(/\s*-\s*(Radio Edit|Single Version|Album Version|Remaster|Remastered|Extended Mix|Extended Version|Original Mix|Radio Mix|Edit)\s*(\[.*?\])?/gi, '')
      .replace(/\s*\[.*?\]\s*/g, '')
      .replace(/\s*\(.*?(Radio Edit|Single Version|Album Version|Remaster|Remastered|Extended Mix|Extended Version|Original Mix|Radio Mix|Edit).*?\)\s*/gi, '')
      .trim();

    // Try exact match first
    const stmt = `
      SELECT T.*, GROUP_CONCAT(AR.artist_name, ', ') as artists
      FROM TRACK T
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      WHERE LOWER(T.track_name) = ?
      GROUP BY T.track_id
      LIMIT 1
    `;
    const dbModule = await import('./database/db.js');
    const row = dbModule.default.prepare(stmt).get(cleanedTitle.toLowerCase());

    if (row) {
      const features = {
        tempo: row.tempo || null,
        key: null,
        energy: row.energy !== null ? parseFloat(row.energy) : null,
        danceability: row.danceability !== null ? parseFloat(row.danceability) : null,
        valence: row.valence !== null ? parseFloat(row.valence) : null,
        acousticness: row.acousticness !== null ? parseFloat(row.acousticness) : null,
        instrumentalness: row.instrumentalness !== null ? parseFloat(row.instrumentalness) : null,
        liveness: row.liveness !== null ? parseFloat(row.liveness) : null,
        speechiness: row.speechiness !== null ? parseFloat(row.speechiness) : null,
        loudness: row.loudness !== null ? parseFloat(row.loudness) : null,
        album: row.album_name || null,
        title: row.track_name,
        artist: row.artists || artist
      };

      return res.json({ success: true, features, source: 'db' });
    }

    // no exact match - try a LIKE search
    const likeStmt = `
      SELECT T.*, GROUP_CONCAT(AR.artist_name, ', ') as artists
      FROM TRACK T
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      WHERE LOWER(T.track_name) LIKE ?
      GROUP BY T.track_id
      LIMIT 1
    `;
    const likeRow = dbModule.default.prepare(likeStmt).get(`%${cleanedTitle.toLowerCase()}%`);

    if (likeRow) {
      const features = {
        tempo: likeRow.tempo || null,
        key: null,
        energy: likeRow.energy !== null ? parseFloat(likeRow.energy) : null,
        danceability: likeRow.danceability !== null ? parseFloat(likeRow.danceability) : null,
        valence: likeRow.valence !== null ? parseFloat(likeRow.valence) : null,
        acousticness: likeRow.acousticness !== null ? parseFloat(likeRow.acousticness) : null,
        instrumentalness: likeRow.instrumentalness !== null ? parseFloat(likeRow.instrumentalness) : null,
        liveness: likeRow.liveness !== null ? parseFloat(likeRow.liveness) : null,
        speechiness: likeRow.speechiness !== null ? parseFloat(likeRow.speechiness) : null,
        loudness: likeRow.loudness !== null ? parseFloat(likeRow.loudness) : null,
        album: likeRow.album_name || null,
        title: likeRow.track_name,
        artist: likeRow.artists || artist
      };

      return res.json({ success: true, features, source: 'db' });
    }

    return res.json({ success: false, notFound: true, message: 'Not found in local DB' });
  } catch (error) {
    console.error('❌ DB lookup error:', error);
    res.status(500).json({ error: 'DB lookup failed', message: error.message });
  }
});

// Search tracks by keyword (artist, title, or album)
app.get('/api/db/search-OLD', async (req, res) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const dbModule = await import('./database/db.js');
    const searchTerm = `%${q.toLowerCase()}%`;
    
    const stmt = `
      SELECT T.*, GROUP_CONCAT(AR.artist_name, ', ') as artists, AL.album_name
      FROM TRACK T
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      LEFT JOIN ALBUM AL ON T.track_album = AL.album_id
      WHERE LOWER(T.track_name) LIKE ? 
         OR LOWER(AR.artist_name) LIKE ?
         OR LOWER(AL.album_name) LIKE ?
      GROUP BY T.track_id
      ORDER BY T.track_name
      LIMIT ? OFFSET ?
    `;
    
    const rows = dbModule.default.prepare(stmt).all(searchTerm, searchTerm, searchTerm, parseInt(limit), parseInt(offset));
    
    const tracks = rows.map(row => ({
      track_id: row.track_id,
      title: row.track_name,
      artist: row.artists || 'Unknown',
      album: row.album_name || null,
      spotify_id: row.spotify_id,
      audio_features: {
        tempo: row.tempo,
        energy: row.energy,
        danceability: row.danceability,
        valence: row.valence,
        acousticness: row.acousticness,
        instrumentalness: row.instrumentalness,
        liveness: row.liveness,
        speechiness: row.speechiness,
        loudness: row.loudness
      }
    }));
    
    res.json({ success: true, tracks, count: tracks.length, query: q });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Browse all tracks (paginated)
app.get('/api/db/browse-OLD', async (req, res) => {
  try {
    const { limit = 50, offset = 0, sort = 'track_name' } = req.query;
    
    const dbModule = await import('./database/db.js');
    const validSorts = ['track_name', 'energy', 'danceability', 'valence', 'tempo'];
    const sortField = validSorts.includes(sort) ? sort : 'track_name';
    
    const stmt = `
      SELECT T.*, GROUP_CONCAT(AR.artist_name, ', ') as artists, AL.album_name
      FROM TRACK T
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      LEFT JOIN ALBUM AL ON T.track_album = AL.album_id
      GROUP BY T.track_id
      ORDER BY T.${sortField} DESC
      LIMIT ? OFFSET ?
    `;
    
    const rows = dbModule.default.prepare(stmt).all(parseInt(limit), parseInt(offset));
    
    const tracks = rows.map(row => ({
      track_id: row.track_id,
      title: row.track_name,
      artist: row.artists || 'Unknown',
      album: row.album_name || null,
      spotify_id: row.spotify_id,
      audio_features: {
        tempo: row.tempo,
        energy: row.energy,
        danceability: row.danceability,
        valence: row.valence,
        acousticness: row.acousticness,
        instrumentalness: row.instrumentalness,
        liveness: row.liveness,
        speechiness: row.speechiness,
        loudness: row.loudness
      }
    }));
    
    res.json({ success: true, tracks, count: tracks.length });
  } catch (error) {
    console.error('❌ Browse error:', error);
    res.status(500).json({ error: 'Browse failed', message: error.message });
  }
});

// ==================== END OF OLD INLINE HANDLERS ====================

// Get random tracks
app.get('/api/db/random', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const dbModule = await import('./database/db.js');
    
    const stmt = `
      SELECT T.*, GROUP_CONCAT(AR.artist_name, ', ') as artists, AL.album_name
      FROM TRACK T
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      LEFT JOIN ALBUM AL ON T.track_album = AL.album_id
      GROUP BY T.track_id
      ORDER BY RANDOM()
      LIMIT ?
    `;
    
    const rows = dbModule.default.prepare(stmt).all(parseInt(limit));
    
    const tracks = rows.map(row => ({
      track_id: row.track_id,
      title: row.track_name,
      artist: row.artists || 'Unknown',
      album: row.album_name || null,
      spotify_id: row.spotify_id,
      audio_features: {
        tempo: row.tempo,
        energy: row.energy,
        danceability: row.danceability,
        valence: row.valence,
        acousticness: row.acousticness,
        instrumentalness: row.instrumentalness,
        liveness: row.liveness,
        speechiness: row.speechiness,
        loudness: row.loudness
      }
    }));
    
    res.json({ success: true, tracks, count: tracks.length });
  } catch (error) {
    console.error('❌ Random tracks error:', error);
    res.status(500).json({ error: 'Failed to get random tracks', message: error.message });
  }
});

// Get database statistics
app.get('/api/db/stats', async (req, res) => {
  try {
    const dbModule = await import('./database/db.js');
    
    const totalTracks = dbModule.default.prepare('SELECT COUNT(*) as count FROM TRACK').get();
    const totalArtists = dbModule.default.prepare('SELECT COUNT(*) as count FROM ARTIST').get();
    const tracksWithFeatures = dbModule.default.prepare(
      'SELECT COUNT(*) as count FROM TRACK WHERE tempo IS NOT NULL'
    ).get();
    
    res.json({
      success: true,
      stats: {
        total_tracks: totalTracks.count,
        total_artists: totalArtists.count,
        tracks_with_features: tracksWithFeatures.count,
        feature_coverage: ((tracksWithFeatures.count / totalTracks.count) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', message: error.message });
  }
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

// Route: Get artist's top tracks
app.get('/artist-top-tracks/:artistId', async (req, res) => {
  const { artistId } = req.params;
  const { access_token, market = 'US' } = req.query;

  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    const data = await spotifyApi.getArtistTopTracks(artistId, market);
    res.json(data.body);
  } catch (error) {
    console.error('Error fetching artist top tracks:', error);
    res.status(error.statusCode || 500).json({ error: 'Failed to fetch artist top tracks' });
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

// Route: Store user's top 250 tracks (pages Spotify and stores results)
app.post('/store-top-250', async (req, res) => {
  const { access_token, user_email, time_range = 'medium_term' } = req.body;

  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!user_email) {
    return res.status(400).json({ error: 'User email required' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    console.log(`📥 Storing top 250 tracks for user: ${user_email}`);

    // Import database service
    const { saveUser, saveCompleteTrack, getUserAudioFeatureAverages } = await import('./src/services/databaseService.js');

    // Save/update user
    const profileData = await spotifyApi.getMe();
    const userId = saveUser(profileData.body);
    console.log(`✅ User saved/updated: ID ${userId}`);

    // Page through Spotify top tracks in chunks of 50 (max allowed per request)
    const pageSize = 50;
    const maxDesired = 250;
    const collected = new Map(); // spotify_id -> track

    for (let offset = 0; offset < maxDesired; offset += pageSize) {
      console.log(`🔁 Fetching top tracks offset=${offset} limit=${pageSize}`);
      const resp = await spotifyApi.getMyTopTracks({ time_range, limit: pageSize, offset });
      const items = resp.body.items || [];
      if (!items.length) break;

      for (const t of items) {
        if (!collected.has(t.id)) collected.set(t.id, t);
      }

      // If fewer than pageSize returned, no more pages
      if (items.length < pageSize) break;
    }

    const tracks = Array.from(collected.values()).slice(0, maxDesired);
    console.log(`📦 Collected ${tracks.length} unique tracks`);

    // Fetch audio features in chunks (Spotify allows up to 100 ids per request)
    const chunkSize = 100;
    const allIds = tracks.map(t => t.id);
    const featuresById = {};

    for (let i = 0; i < allIds.length; i += chunkSize) {
      const chunk = allIds.slice(i, i + chunkSize);
      console.log(`🎯 Fetching audio features for chunk ${i}..${i + chunk.length}`);
      const featResp = await spotifyApi.getAudioFeaturesForTracks(chunk);
      const audioFeatures = featResp.body.audio_features || [];
      for (const af of audioFeatures) {
        if (af && af.id) featuresById[af.id] = af;
      }
    }

    // Store each track with its audio features
    let stored = 0;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const features = featuresById[track.id] || null;

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
      message: `Successfully stored ${stored} tracks (top ${tracks.length})`,
      user_id: userId,
      tracks_stored: stored,
      audio_feature_averages: averages
    });

  } catch (error) {
    console.error('❌ Error storing top 250 tracks:', error);
    res.status(error.statusCode || 500).json({
      error: 'Failed to store top 250 tracks',
      message: error.message
    });
  }
});

// Route: Import a Spotify playlist by ID or URL and store its tracks
app.post('/import/playlist', async (req, res) => {
  const { access_token, playlist_id, playlist_url, user_email, user_display_name } = req.body;

  if (!access_token && !(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)) {
    return res.status(400).json({ error: 'access_token required (or configure client credentials in env)' });
  }

  // Determine playlist ID from provided id or URL
  let pid = playlist_id || null;
  if (!pid && playlist_url) {
    // Extract from URL like: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
    const m = playlist_url.match(new RegExp('playlist[/:]([a-zA-Z0-9]+)'));
    if (m) pid = m[1];
  }

  if (!pid) return res.status(400).json({ error: 'playlist_id or playlist_url required' });
  
  // Validate playlist ID format (base-62: letters, numbers, typically 22 chars for Spotify IDs)
  if (!/^[a-zA-Z0-9]{15,30}$/.test(pid)) {
    return res.status(400).json({ error: `Invalid playlist ID format: ${pid}` });
  }

  console.log(`📥 Import playlist request for ID: ${pid}`);

  try {
    // If access token provided by client, use it; otherwise try client credentials
    let token;
    if (access_token) {
      spotifyApi.setAccessToken(access_token);
      token = access_token;
      console.log(`🔑 Using provided access token`);
    } else {
      console.log(`🔑 Using client credentials grant`);
      const tokenResp = await spotifyApi.clientCredentialsGrant();
      token = tokenResp.body.access_token;
      spotifyApi.setAccessToken(token);
    }

    // Import database service
    const { saveUser, saveCompleteTrack, getUserAudioFeatureAverages } = await import('./src/services/databaseService.js');

    // Save or create user record (use provided email/display or fallback)
    const profileData = user_email ? { email: user_email, display_name: user_display_name || user_email } : null;
    const userId = profileData ? saveUser(profileData) : null;

    // First, verify playlist exists and is accessible
    console.log(`🔍 Verifying playlist access for ID: ${pid}`);
    console.log(`🌐 API URL: https://api.spotify.com/v1/playlists/${pid}`);
    const metaUrl = `https://api.spotify.com/v1/playlists/${pid}?fields=id,name,public,owner,tracks(total)`;
    const metaResp = await fetch(metaUrl, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!metaResp.ok) {
      const errText = await metaResp.text();
      console.error(`❌ Playlist metadata fetch failed: ${metaResp.status} ${metaResp.statusText}`);
      console.error(`Response body:`, errText);
      
      if (metaResp.status === 404) {
        throw new Error(`Playlist not found (404). The playlist ID "${pid}" may be invalid, deleted, or not accessible with the current token. Verify the playlist exists and is public or that your token has playlist-read-private scope.`);
      }
      throw new Error(`Cannot access playlist ${pid}. Status ${metaResp.status}: ${metaResp.statusText}`);
    }
    
    const metaData = await metaResp.json();
    console.log(`✅ Playlist found: "${metaData.name}" by ${metaData.owner?.display_name || metaData.owner?.id} (${metaData.tracks?.total || 0} tracks, public: ${metaData.public})`);


    // Page through playlist tracks using direct REST API (more reliable than SDK wrapper)
    console.log(`📥 Fetching playlist tracks: ${pid}`);
    const tracks = [];
    let offset = 0;
    let more = true;
    while (more) {
      console.log(`🔁 Fetching playlist tracks offset=${offset} limit=100`);
      const url = `https://api.spotify.com/v1/playlists/${pid}/tracks?limit=100&offset=${offset}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`❌ Playlist tracks fetch failed: ${resp.status} ${resp.statusText}`, errText);
        throw new Error(`Spotify API error ${resp.status}: ${resp.statusText}`);
      }

      const data = await resp.json();
      console.log(`✅ Received ${data.items?.length || 0} items`);
      const items = data.items || [];
      for (const it of items) {
        if (it.track && it.track.id) tracks.push(it.track);
      }

      if (!items.length || items.length < 100) {
        more = false;
      } else {
        offset += 100;
      }
    }
    console.log(`📦 Collected ${tracks.length} total tracks`);

    const unique = [];
    const seen = new Set();
    for (const t of tracks) {
      if (!t || !t.id) continue;
      if (!seen.has(t.id)) { seen.add(t.id); unique.push(t); }
    }

    // Fetch audio features in chunks (100)
    const ids = unique.map(t => t.id);
    const featuresById = {};
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const feats = await spotifyApi.getAudioFeaturesForTracks(chunk);
      for (const af of feats.body.audio_features || []) {
        if (af && af.id) featuresById[af.id] = af;
      }
    }

    // Persist
    let stored = 0;
    for (const t of unique) {
      const f = featuresById[t.id] || null;
      try {
        saveCompleteTrack(t, f, userId);
        stored++;
      } catch (err) {
        console.error('Failed to save track', t.name, err.message || err);
      }
    }

    const averages = userId ? getUserAudioFeatureAverages(userId) : null;

    res.json({ success: true, playlist_id: pid, tracks_found: unique.length, tracks_stored: stored, audio_feature_averages: averages });
  } catch (error) {
    console.error('❌ Import playlist error:', error);
    res.status(500).json({ error: 'Failed to import playlist', message: error.message });
  }
});

// Route: Import tracks from CSV file
app.post('/import/csv', async (req, res) => {
  const { csv_path, user_email, user_display_name } = req.body;
  
  if (!csv_path) {
    return res.status(400).json({ error: 'csv_path required (absolute path to CSV file)' });
  }
  
  try {
    console.log(`📥 Importing tracks from CSV: ${csv_path}`);
    
    // Check if file exists
    if (!fs.existsSync(csv_path)) {
      return res.status(404).json({ error: `CSV file not found: ${csv_path}` });
    }
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csv_path, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`📊 Parsed ${records.length} rows from CSV`);
    
    // Import database service
    const { saveUser, saveCompleteTrack } = await import('./src/services/databaseService.js');
    
    // Save or create user record
    const userId = user_email ? saveUser({ email: user_email, display_name: user_display_name || 'CSV Import' }) : null;
    
    let stored = 0;
    let skipped = 0;
    
    for (const row of records) {
      try {
        // Map CSV columns to track data
        const trackData = {
          name: row.title || row.track_name || row.name,
          artists: [{ name: row.artist || row.artist_name || 'Unknown' }],
          album: { name: row.album || row.album_name || null },
          id: row.spotify_id || `csv-${row.artist}-${row.title}`.toLowerCase().replace(/\s+/g, '-')
        };
        
        // Map audio features
        const audioFeatures = {
          tempo: row.tempo ? parseFloat(row.tempo) : null,
          key: row.key || null,
          energy: row.energy ? parseFloat(row.energy) : null,
          danceability: row.danceability ? parseFloat(row.danceability) : null,
          valence: row.valence ? parseFloat(row.valence) : null,
          acousticness: row.acousticness ? parseFloat(row.acousticness) : null,
          instrumentalness: row.instrumentalness ? parseFloat(row.instrumentalness) : null,
          liveness: row.liveness ? parseFloat(row.liveness) : null,
          speechiness: row.speechiness ? parseFloat(row.speechiness) : null,
          loudness: row.loudness ? parseFloat(row.loudness) : null
        };
        
        // Only save if we have at least artist and title
        if (trackData.name && trackData.artists[0].name !== 'Unknown') {
          saveCompleteTrack(trackData, audioFeatures, userId);
          stored++;
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.error(`Failed to import row:`, row, error.message);
        skipped++;
      }
    }
    
    console.log(`✅ Imported ${stored} tracks, skipped ${skipped}`);
    
    res.json({
      success: true,
      message: `Successfully imported ${stored} tracks from CSV`,
      tracks_imported: stored,
      tracks_skipped: skipped,
      total_rows: records.length
    });
    
  } catch (error) {
    console.error('❌ CSV import error:', error);
    res.status(500).json({ error: 'Failed to import CSV', message: error.message });
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


// ===== RAPIDAPI TRACK ANALYSIS ROUTES =====

// Get audio features from RapidAPI Track Analysis
app.get('/api/rapidapi/track/:artist/:title', async (req, res) => {
  try {
    const { artist, title } = req.params;
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured in environment');
      return res.status(500).json({ success: false, error: 'RAPIDAPI_KEY not configured' });
    }

    console.log(`🔍 Fetching from RapidAPI: ${artist} - ${title}`);
    
    // RapidAPI Track Analysis endpoint - correct format from docs
    const url = `https://track-analysis.p.rapidapi.com/pktx/analysis?song=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
    console.log(`🌐 RapidAPI URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'track-analysis.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ RapidAPI returned status ${response.status}`);
      let errText = '';
      try {
        errText = await response.text();
        console.error(`Error details:`, errText);
      } catch (e) {
        console.error(`Could not read error response body`);
      }
      
      // Return not found instead of error so it can fall through to GetSongBPM
      return res.json({ 
        success: false, 
        notFound: true,
        message: `RapidAPI error ${response.status} - track may not be available` 
      });
    }
    
    const data = await response.json();
    console.log(`📥 RapidAPI Response:`, JSON.stringify(data, null, 2));
    
    // Map RapidAPI response to our normalized format
    // RapidAPI returns: tempo, key, mode, energy, danceability, happiness (valence), acousticness, etc.
    if (data && data.id) {
      const audioFeatures = {
        tempo: data.tempo || null,
        key: data.key || null,
        energy: data.energy !== undefined ? parseFloat(data.energy) / 100 : null, // Convert to 0-1 scale
        danceability: data.danceability !== undefined ? parseFloat(data.danceability) / 100 : null,
        valence: data.happiness !== undefined ? parseFloat(data.happiness) / 100 : null, // happiness = valence
        acousticness: data.acousticness !== undefined ? parseFloat(data.acousticness) / 100 : null,
        instrumentalness: data.instrumentalness !== undefined ? parseFloat(data.instrumentalness) / 100 : null,
        liveness: data.liveness !== undefined ? parseFloat(data.liveness) / 100 : null,
        speechiness: data.speechiness !== undefined ? parseFloat(data.speechiness) / 100 : null,
        loudness: data.loudness ? parseFloat(data.loudness.replace(/[^\d.-]/g, '')) : null, // Parse "-5 dB" to -5
        artist: artist,
        title: title,
        album: null,
        genre: null
      };
      
      console.log(`✅ Found audio features for: ${artist} - ${title}`);
      res.json({ success: true, features: audioFeatures, source: 'rapidapi' });
    } else {
      console.log(`⚠️ Track not found in RapidAPI: ${artist} - ${title}`);
      res.json({ 
        success: false, 
        notFound: true,
        message: `Track not available in RapidAPI database.` 
      });
    }
    
  } catch (error) {
    console.error('❌ RapidAPI Error:', error.message);
    // Return notFound instead of 500 so UI can fall through to GetSongBPM
    res.json({ 
      success: false,
      notFound: true,
      message: `RapidAPI failed: ${error.message}` 
    });
  }
});

// Batch fetch from RapidAPI
app.post('/api/rapidapi/batch', async (req, res) => {
  try {
    const { tracks } = req.body;
    
    if (!Array.isArray(tracks)) {
      return res.status(400).json({ error: 'tracks must be an array' });
    }
    
    const results = [];
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured in environment');
      return res.status(500).json({ success: false, error: 'RAPIDAPI_KEY not configured' });
    }
    
    // Process tracks with rate limiting (avoid hitting RapidAPI limits)
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      try {
        const url = `https://track-analysis.p.rapidapi.com/pktx/analysis?song=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`;
        
        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'track-analysis.p.rapidapi.com'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.id) {
            results.push({
              spotify_id: track.spotify_id,
              success: true,
              features: {
                tempo: data.tempo || null,
                key: data.key || null,
                energy: data.energy !== undefined ? parseFloat(data.energy) / 100 : null,
                danceability: data.danceability !== undefined ? parseFloat(data.danceability) / 100 : null,
                valence: data.happiness !== undefined ? parseFloat(data.happiness) / 100 : null,
                acousticness: data.acousticness !== undefined ? parseFloat(data.acousticness) / 100 : null,
                instrumentalness: data.instrumentalness !== undefined ? parseFloat(data.instrumentalness) / 100 : null,
                liveness: data.liveness !== undefined ? parseFloat(data.liveness) / 100 : null,
                speechiness: data.speechiness !== undefined ? parseFloat(data.speechiness) / 100 : null,
                loudness: data.loudness ? parseFloat(data.loudness.replace(/[^\d.-]/g, '')) : null
              }
            });
          } else {
            results.push({
              spotify_id: track.spotify_id,
              success: false,
              error: 'Not found'
            });
          }
        } else {
          results.push({
            spotify_id: track.spotify_id,
            success: false,
            error: `API error ${response.status}`
          });
        }
        
        // Rate limiting: wait 500ms between requests
        if (i < tracks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
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
    console.error('❌ Batch RapidAPI Error:', error);
    res.status(500).json({ 
      error: 'Failed to process batch request',
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

// ==================== LIKED SONGS ENDPOINTS ====================

// Get user's liked songs with full details
app.get('/api/liked-songs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const dbModule = await import('./database/db.js');
    
    const likedSongs = dbModule.default.prepare(`
      SELECT 
        T.track_id,
        T.track_name,
        T.tempo,
        T.energy,
        T.danceability,
        T.valence,
        T.acousticness,
        T.instrumentalness,
        T.speechiness,
        T.liveness,
        T.loudness,
        T.duration_ms,
        T.popularity,
        AL.album_name,
        GROUP_CONCAT(AR.artist_name, ', ') as artists,
        UF.added_at
      FROM USER_FAVORITES UF
      JOIN TRACK T ON UF.track_id = T.track_id
      LEFT JOIN ALBUM AL ON T.track_album = AL.album_id
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      WHERE UF.user_id = ?
      GROUP BY T.track_id, UF.added_at
      ORDER BY UF.added_at DESC
    `).all(userId);

    // Calculate average characteristics
    let avgStats = null;
    if (likedSongs.length > 0) {
      const validSongs = likedSongs.filter(s => 
        s.energy !== null && s.danceability !== null && s.valence !== null
      );
      
      if (validSongs.length > 0) {
        avgStats = {
          avgEnergy: (validSongs.reduce((sum, s) => sum + (s.energy || 0), 0) / validSongs.length).toFixed(3),
          avgDanceability: (validSongs.reduce((sum, s) => sum + (s.danceability || 0), 0) / validSongs.length).toFixed(3),
          avgValence: (validSongs.reduce((sum, s) => sum + (s.valence || 0), 0) / validSongs.length).toFixed(3),
          avgAcousticness: (validSongs.reduce((sum, s) => sum + (s.acousticness || 0), 0) / validSongs.length).toFixed(3),
          avgInstrumentalness: (validSongs.reduce((sum, s) => sum + (s.instrumentalness || 0), 0) / validSongs.length).toFixed(3),
          avgSpeechiness: (validSongs.reduce((sum, s) => sum + (s.speechiness || 0), 0) / validSongs.length).toFixed(3),
          avgTempo: (validSongs.reduce((sum, s) => sum + (s.tempo || 0), 0) / validSongs.length).toFixed(1)
        };
      }
    }

    res.json({
      success: true,
      count: likedSongs.length,
      songs: likedSongs,
      avgStats
    });
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a song to liked songs
app.post('/api/liked-songs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { trackId } = req.body;

    if (!trackId) {
      return res.status(400).json({ success: false, error: 'trackId is required' });
    }

    const dbModule = await import('./database/db.js');
    const { dbHelpers } = await import('./database/db.js');
    
    // Check if track exists
    const track = dbModule.default.prepare('SELECT track_id FROM TRACK WHERE track_id = ?').get(trackId);
    if (!track) {
      return res.status(404).json({ success: false, error: 'Track not found' });
    }

    // Add to favorites
    dbHelpers.addFavorite(userId, trackId);

    res.json({ success: true, message: 'Song added to liked songs' });
  } catch (error) {
    console.error('Error adding liked song:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove a song from liked songs
app.delete('/api/liked-songs/:userId/:trackId', async (req, res) => {
  try {
    const { userId, trackId } = req.params;
    const { dbHelpers } = await import('./database/db.js');
    
    dbHelpers.removeFavorite(userId, trackId);

    res.json({ success: true, message: 'Song removed from liked songs' });
  } catch (error) {
    console.error('Error removing liked song:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if a song is liked
app.get('/api/liked-songs/:userId/check/:trackId', async (req, res) => {
  try {
    const { userId, trackId } = req.params;
    const dbModule = await import('./database/db.js');
    
    const result = dbModule.default.prepare(
      'SELECT 1 FROM USER_FAVORITES WHERE user_id = ? AND track_id = ?'
    ).get(userId, trackId);

    res.json({ success: true, isLiked: !!result });
  } catch (error) {
    console.error('Error checking liked status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== QUERY INTERFACE ENDPOINTS ====================
// NOTE: These routes are now handled by controllers in /controllers/*.js

// Query 4: Get user statistics (audio feature averages) - OLD VERSION
app.get('/api/user-stats/:userId-OLD', async (req, res) => {
  try {
    const { userId } = req.params;
    const dbModule = await import('./database/db.js');
    
    // Check if user exists
    const user = dbModule.default.prepare('SELECT user_id FROM USER WHERE user_id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Get audio feature averages using existing query
    const stats = dbModule.default.prepare(`
      SELECT 
        ROUND(AVG(T.energy), 3) as avg_energy,
        ROUND(AVG(T.valence), 3) as avg_valence,
        ROUND(AVG(T.danceability), 3) as avg_danceability,
        ROUND(AVG(T.acousticness), 3) as avg_acousticness,
        ROUND(AVG(T.tempo), 1) as avg_tempo,
        ROUND(AVG(T.loudness), 2) as avg_loudness,
        COUNT(*) as track_count
      FROM TRACK T
      JOIN USER_FAVORITES UF ON T.track_id = UF.track_id
      WHERE UF.user_id = ?
        AND T.energy IS NOT NULL
    `).get(userId);
    
    if (!stats || stats.track_count === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No tracks found for this user' 
      });
    }
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test endpoint working' });
});

// Query 6: Get bank accounts for transaction demo - OLD VERSION
app.get('/api/transaction/accounts-OLD', async (req, res) => {
  console.log('📥 GET /api/transaction/accounts called');
  try {
    console.log('Attempting to query BankAccounts table...');
    const accounts = db.prepare(`
      SELECT account_id, account_name, balance, last_updated
      FROM BankAccounts
      ORDER BY account_id
    `).all();
    
    console.log(`Found ${accounts.length} accounts`);
    res.json({ success: true, accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Query 6: Transaction demo - bank transfer with explicit BEGIN/COMMIT/ROLLBACK - OLD VERSION
app.post('/api/transaction/transfer-OLD', (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, simulateError } = req.body;
    
    // Validation
    if (!fromAccountId || !toAccountId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both fromAccountId and toAccountId are required' 
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be a positive number' 
      });
    }
    
    if (fromAccountId === toAccountId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot transfer to the same account' 
      });
    }
    
    console.log(`\n🔄 Starting transaction: Transfer $${amount} from account ${fromAccountId} to ${toAccountId}`);
    
    try {
      // ===== BEGIN TRANSACTION =====
      console.log('📝 Executing: BEGIN TRANSACTION;');
      db.prepare('BEGIN TRANSACTION').run();
      
      // Step 1: Check source account balance
      const fromAccount = db.prepare('SELECT account_id, account_name, balance FROM BankAccounts WHERE account_id = ?').get(fromAccountId);
      
      if (!fromAccount) {
        throw new Error(`Source account ${fromAccountId} not found`);
      }
      
      if (fromAccount.balance < amount) {
        throw new Error(`Insufficient balance. Available: $${fromAccount.balance}, Required: $${amount}`);
      }
      
      // Step 2: Check destination account exists
      const toAccount = db.prepare('SELECT account_id, account_name, balance FROM BankAccounts WHERE account_id = ?').get(toAccountId);
      
      if (!toAccount) {
        throw new Error(`Destination account ${toAccountId} not found`);
      }
      
      // Simulate error if requested (for testing rollback)
      if (simulateError) {
        console.log('⚠️ Simulated error triggered - forcing rollback');
        throw new Error('Simulated error: Transaction intentionally failed for testing');
      }
      
      // Step 3: Deduct from source account
      console.log(`📝 Executing: UPDATE BankAccounts SET balance = balance - ${amount} WHERE account_id = ${fromAccountId};`);
      db.prepare(`
        UPDATE BankAccounts 
        SET balance = balance - ?, last_updated = CURRENT_TIMESTAMP 
        WHERE account_id = ?
      `).run(amount, fromAccountId);
      
      // Step 4: Add to destination account
      console.log(`📝 Executing: UPDATE BankAccounts SET balance = balance + ${amount} WHERE account_id = ${toAccountId};`);
      db.prepare(`
        UPDATE BankAccounts 
        SET balance = balance + ?, last_updated = CURRENT_TIMESTAMP 
        WHERE account_id = ?
      `).run(amount, toAccountId);
      
      // Step 5: Log the transaction
      console.log('📝 Executing: INSERT INTO TransactionLog (...);');
      const logResult = db.prepare(`
        INSERT INTO TransactionLog (from_account, to_account, amount, status)
        VALUES (?, ?, ?, 'SUCCESS')
      `).run(fromAccountId, toAccountId, amount);
      
      // ===== COMMIT TRANSACTION =====
      console.log('✅ Executing: COMMIT;');
      db.prepare('COMMIT').run();
      
      // Get updated balances
      const updatedFrom = db.prepare('SELECT balance FROM BankAccounts WHERE account_id = ?').get(fromAccountId);
      const updatedTo = db.prepare('SELECT balance FROM BankAccounts WHERE account_id = ?').get(toAccountId);
      
      console.log(`✅ Transaction successful! New balances: ${fromAccount.account_name}=$${updatedFrom.balance}, ${toAccount.account_name}=$${updatedTo.balance}\n`);
      
      res.json({
        success: true,
        message: `Successfully transferred $${amount} from ${fromAccount.account_name} to ${toAccount.account_name}`,
        transactionId: logResult.lastInsertRowid,
        fromBalance: updatedFrom.balance,
        toBalance: updatedTo.balance
      });
      
    } catch (error) {
      // ===== ROLLBACK TRANSACTION =====
      console.error('❌ Transaction error:', error.message);
      console.log('⟲ Executing: ROLLBACK;');
      
      try {
        db.prepare('ROLLBACK').run();
        console.log('⟲ Rollback completed - all changes reverted\n');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      
      // Log failed transaction
      try {
        db.prepare(`
          INSERT INTO TransactionLog (from_account, to_account, amount, status, error_message)
          VALUES (?, ?, ?, 'FAILED', ?)
        `).run(fromAccountId, toAccountId, amount, error.message);
      } catch (logError) {
        console.error('Failed to log transaction:', logError);
      }
      
      res.status(400).json({
        success: false,
        message: 'Transaction failed and was rolled back',
        error: error.message,
        reason: error.message
      });
    }
    
  } catch (error) {
    console.error('❌ Transfer endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to process transfer'
    });
  }
});

// ==================== END OF OLD QUERY ENDPOINTS ====================

// Query 6: Transaction demo - batch import tracks (legacy endpoint, kept for compatibility)
app.post('/api/transaction/import-batch', async (req, res) => {
  try {
    const { userId, tracks } = req.body;
    
    // Validation
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ success: false, error: 'tracks must be a non-empty array' });
    }
    
    const dbModule = await import('./database/db.js');
    
    // Check if user exists
    const user = dbModule.default.prepare('SELECT user_id FROM USER WHERE user_id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found',
        message: 'Transaction aborted: User does not exist in database'
      });
    }
    
    // Import database service with transaction support
    const { saveCompleteTrack } = await import('./src/services/databaseService.js');
    
    // Use a transaction to ensure all-or-nothing behavior
    const transaction = dbModule.default.transaction((tracksData, uid) => {
      for (const track of tracksData) {
        // Validate each track has required fields
        if (!track.name || !track.artists || !Array.isArray(track.artists) || track.artists.length === 0) {
          throw new Error(`Invalid track data: ${track.name || 'unnamed track'}`);
        }
        
        // Ensure album exists
        if (!track.album) {
          track.album = { name: 'Unknown Album', id: `unknown-${Date.now()}` };
        }
        
        // Save track (this will throw if there's an error, triggering rollback)
        saveCompleteTrack(track, null, uid);
      }
      return tracksData.length;
    });
    
    // Execute transaction
    const tracksProcessed = transaction(tracks, userId);
    
    console.log(`✅ Transaction successful: ${tracksProcessed} tracks imported for user ${userId}`);
    
    res.json({
      success: true,
      message: `Successfully imported ${tracksProcessed} track(s) in a single transaction`,
      tracksProcessed,
      userId
    });
    
  } catch (error) {
    console.error('❌ Transaction failed and rolled back:', error);
    
    // Transaction failed - rollback already happened automatically
    res.status(500).json({
      success: false,
      message: 'Transaction failed and was rolled back. No data was saved.',
      error: error.message
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
