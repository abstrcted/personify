// Database service for storing Spotify data
// Handles communication between frontend and database

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const db = new Database(join(__dirname, '../../database/personify.db'));
db.pragma('journal_mode = WAL');

// Store or update user from Spotify profile
export const saveUser = (spotifyUser) => {
  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM USER WHERE email = ?').get(spotifyUser.email);
    
    if (existingUser) {
      // Update username if changed
      db.prepare('UPDATE USER SET username = ? WHERE email = ?').run(
        spotifyUser.display_name,
        spotifyUser.email
      );
      return existingUser.user_id;
    } else {
      // Insert new user
      const result = db.prepare('INSERT INTO USER (username, email) VALUES (?, ?)').run(
        spotifyUser.display_name,
        spotifyUser.email
      );
      return result.lastInsertRowid;
    }
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Store artist
export const saveArtist = (artistData) => {
  try {
    // Check if artist exists
    const existing = db.prepare('SELECT artist_id FROM ARTIST WHERE spotify_id = ?').get(artistData.id);
    
    if (existing) {
      return existing.artist_id;
    }

    // Insert new artist
    const result = db.prepare(`
      INSERT INTO ARTIST (artist_name, spotify_id, genre)
      VALUES (?, ?, ?)
    `).run(
      artistData.name,
      artistData.id,
      artistData.genres?.[0] || null
    );

    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error saving artist:', error);
    throw error;
  }
};

// Store album
export const saveAlbum = (albumData, artistId) => {
  try {
    // Check if album exists
    const existing = db.prepare('SELECT album_id FROM ALBUM WHERE spotify_id = ?').get(albumData.id);
    
    if (existing) {
      return existing.album_id;
    }

    // Insert new album
    const result = db.prepare(`
      INSERT INTO ALBUM (album_name, artist_id, release_date, spotify_id)
      VALUES (?, ?, ?, ?)
    `).run(
      albumData.name,
      artistId,
      albumData.release_date || null,
      albumData.id
    );

    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error saving album:', error);
    throw error;
  }
};

// Store track with audio features
export const saveTrack = (trackData, audioFeatures = null) => {
  try {
    // Check if track exists
    const existing = db.prepare('SELECT track_id FROM TRACK WHERE spotify_id = ?').get(trackData.id);
    
    if (existing) {
      // Update audio features if provided
      if (audioFeatures) {
        db.prepare(`
          UPDATE TRACK SET
            energy = ?, valence = ?, danceability = ?,
            acousticness = ?, instrumentalness = ?, speechiness = ?,
            liveness = ?, loudness = ?, tempo = ?
          WHERE track_id = ?
        `).run(
          audioFeatures.energy,
          audioFeatures.valence,
          audioFeatures.danceability,
          audioFeatures.acousticness,
          audioFeatures.instrumentalness,
          audioFeatures.speechiness,
          audioFeatures.liveness,
          audioFeatures.loudness,
          audioFeatures.tempo,
          existing.track_id
        );
      }
      return existing.track_id;
    }

    // Insert new track
    const result = db.prepare(`
      INSERT INTO TRACK (
        track_name, track_album, duration_ms, popularity, spotify_id,
        energy, valence, danceability, acousticness, instrumentalness,
        speechiness, liveness, loudness, tempo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trackData.name,
      null, // album_id will be set later
      trackData.duration_ms,
      trackData.popularity,
      trackData.id,
      audioFeatures?.energy || null,
      audioFeatures?.valence || null,
      audioFeatures?.danceability || null,
      audioFeatures?.acousticness || null,
      audioFeatures?.instrumentalness || null,
      audioFeatures?.speechiness || null,
      audioFeatures?.liveness || null,
      audioFeatures?.loudness || null,
      audioFeatures?.tempo || null
    );

    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error saving track:', error);
    throw error;
  }
};

// Link track to artist
export const linkTrackToArtist = (trackId, artistId) => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO TRACK_ARTIST (track_id, artist_id)
      VALUES (?, ?)
    `).run(trackId, artistId);
  } catch (error) {
    console.error('Error linking track to artist:', error);
    throw error;
  }
};

// Add track to user favorites
export const addToFavorites = (userId, trackId) => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO USER_FAVORITES (user_id, track_id)
      VALUES (?, ?)
    `).run(userId, trackId);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

// Save complete track with all relationships
export const saveCompleteTrack = (trackData, audioFeatures, userId) => {
  try {
    // Save album's primary artist first
    const primaryArtistId = saveArtist(trackData.artists[0]);
    
    // Save album
    const albumId = saveAlbum(trackData.album, primaryArtistId);
    
    // Save track
    const trackId = saveTrack(trackData, audioFeatures);
    
    // Update track's album reference
    db.prepare('UPDATE TRACK SET track_album = ? WHERE track_id = ?').run(albumId, trackId);
    
    // Link all artists to track
    trackData.artists.forEach(artist => {
      const artistId = saveArtist(artist);
      linkTrackToArtist(trackId, artistId);
    });
    
    // Add to user favorites
    if (userId) {
      addToFavorites(userId, trackId);
    }
    
    return trackId;
  } catch (error) {
    console.error('Error saving complete track:', error);
    throw error;
  }
};

// Get user's stored tracks
export const getUserTracks = (userId) => {
  try {
    return db.prepare(`
      SELECT 
        T.*,
        A.album_name,
        GROUP_CONCAT(AR.artist_name, ', ') as artists
      FROM TRACK T
      JOIN USER_FAVORITES UF ON T.track_id = UF.track_id
      LEFT JOIN ALBUM A ON T.track_album = A.album_id
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      WHERE UF.user_id = ?
      GROUP BY T.track_id
      ORDER BY UF.added_at DESC
    `).all(userId);
  } catch (error) {
    console.error('Error getting user tracks:', error);
    throw error;
  }
};

// Get average audio features for user
export const getUserAudioFeatureAverages = (userId) => {
  try {
    return db.prepare(`
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
  } catch (error) {
    console.error('Error getting audio feature averages:', error);
    throw error;
  }
};

// Calculate and save user personality traits
export const calculateAndSaveTraits = (userId) => {
  try {
    // Get audio feature averages and artist variety
    const stats = db.prepare(`
      SELECT 
        ROUND(AVG(T.duration_ms), 0) as avg_duration_ms,
        ROUND(AVG(T.valence), 3) as avg_valence,
        ROUND(AVG(T.energy), 3) as avg_energy,
        ROUND(AVG(T.danceability), 3) as avg_danceability,
        ROUND(AVG(T.acousticness), 3) as avg_acousticness,
        ROUND(AVG(T.instrumentalness), 3) as avg_instrumentalness,
        COUNT(DISTINCT TA.artist_id) as unique_artists,
        COUNT(*) as total_tracks
      FROM TRACK T
      JOIN USER_FAVORITES UF ON T.track_id = UF.track_id
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      WHERE UF.user_id = ?
        AND T.energy IS NOT NULL
        AND T.valence IS NOT NULL
    `).get(userId);

    if (!stats || stats.total_tracks === 0) {
      throw new Error('Not enough track data to calculate traits');
    }

    // Calculate traits (0-100 scale)
    const patience = Math.min(100, Math.max(0, 
      Math.round(((stats.avg_duration_ms - 120000) / 240000) * 100)
    ));
    const moodiness = Math.round((1 - stats.avg_valence) * 100);
    const openness = Math.min(100, Math.round((stats.unique_artists / stats.total_tracks) * 150));
    const chaoticness = Math.round(
      (stats.avg_energy * 0.4 + stats.avg_danceability * 0.4 + stats.avg_valence * 0.2) * 100
    );
    const extraversion = Math.round((stats.avg_valence * 0.6 + stats.avg_danceability * 0.4) * 100);
    const whimsy = Math.round(Math.max(stats.avg_acousticness, stats.avg_instrumentalness) * 100);

    // Calculate opposite traits
    const traits = {
      patience,
      moodiness,
      openness,
      chaoticness,
      extraversion,
      whimsy,
      balance: 100 - openness,
      calmness: 100 - chaoticness,
      groundedness: 100 - whimsy,
      introspection: 100 - extraversion,
      joyfulness: 100 - moodiness,
      hustle: 100 - patience,
      conscientiousness: 50,
      agreeableness: 50
    };

    // Save to database
    db.prepare(`
      INSERT INTO TRAITS (
        user_id, patience, moodiness, openness, chaoticness, extraversion, whimsy,
        balance, calmness, groundedness, introspection, joyfulness, hustle,
        conscientiousness, agreeableness
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        patience = excluded.patience,
        moodiness = excluded.moodiness,
        openness = excluded.openness,
        chaoticness = excluded.chaoticness,
        extraversion = excluded.extraversion,
        whimsy = excluded.whimsy,
        balance = excluded.balance,
        calmness = excluded.calmness,
        groundedness = excluded.groundedness,
        introspection = excluded.introspection,
        joyfulness = excluded.joyfulness,
        hustle = excluded.hustle,
        conscientiousness = excluded.conscientiousness,
        agreeableness = excluded.agreeableness
    `).run(
      userId, traits.patience, traits.moodiness, traits.openness, traits.chaoticness,
      traits.extraversion, traits.whimsy, traits.balance, traits.calmness,
      traits.groundedness, traits.introspection, traits.joyfulness, traits.hustle,
      traits.conscientiousness, traits.agreeableness
    );

    return traits;
  } catch (error) {
    console.error('Error calculating and saving traits:', error);
    throw error;
  }
};

// Get user traits
export const getUserTraits = (userId) => {
  try {
    return db.prepare('SELECT * FROM TRAITS WHERE user_id = ?').get(userId);
  } catch (error) {
    console.error('Error getting user traits:', error);
    throw error;
  }
};

export default {
  saveUser,
  saveArtist,
  saveAlbum,
  saveTrack,
  linkTrackToArtist,
  addToFavorites,
  saveCompleteTrack,
  getUserTracks,
  getUserAudioFeatureAverages,
  calculateAndSaveTraits,
  getUserTraits
};
