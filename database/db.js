// Database connection and helper functions for Personify
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const db = new Database(join(__dirname, 'personify.db'));
db.pragma('journal_mode = WAL'); // Better performance for concurrent access

// Helper functions for database operations
export const dbHelpers = {
  // User operations
  getUser: (userId) => {
    return db.prepare('SELECT * FROM USER WHERE user_id = ?').get(userId);
  },

  getUserByUsername: (username) => {
    return db.prepare('SELECT * FROM USER WHERE username = ?').get(username);
  },

  createUser: (username, email) => {
    const result = db.prepare('INSERT INTO USER (username, email) VALUES (?, ?)').run(username, email);
    return result.lastInsertRowid;
  },

  getAllUsers: () => {
    return db.prepare('SELECT * FROM USER').all();
  },

  // Traits operations
  getUserTraits: (userId) => {
    return db.prepare('SELECT * FROM TRAITS WHERE user_id = ?').get(userId);
  },

  setUserTraits: (userId, traits) => {
    const { extraversion, openness, conscientiousness, agreeableness, calmness } = traits;
    return db.prepare(`
      INSERT INTO TRAITS (user_id, extraversion, openness, conscientiousness, agreeableness, calmness)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        extraversion = excluded.extraversion,
        openness = excluded.openness,
        conscientiousness = excluded.conscientiousness,
        agreeableness = excluded.agreeableness,
        calmness = excluded.calmness
    `).run(userId, extraversion, openness, conscientiousness, agreeableness, calmness);
  },

  // Artist operations
  getArtist: (artistId) => {
    return db.prepare('SELECT * FROM ARTIST WHERE artist_id = ?').get(artistId);
  },

  searchArtists: (query) => {
    return db.prepare('SELECT * FROM ARTIST WHERE artist_name LIKE ?').all(`%${query}%`);
  },

  // Track operations
  getTrack: (trackId) => {
    return db.prepare('SELECT * FROM TRACK WHERE track_id = ?').get(trackId);
  },

  searchTracks: (query) => {
    return db.prepare('SELECT * FROM TRACK WHERE track_name LIKE ?').all(`%${query}%`);
  },

  // Get tracks by artist
  getTracksByArtist: (artistId) => {
    return db.prepare(`
      SELECT T.* FROM TRACK T
      JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      WHERE TA.artist_id = ?
    `).all(artistId);
  },

  // User favorites
  getUserFavorites: (userId) => {
    return db.prepare(`
      SELECT T.*, UF.added_at FROM TRACK T
      JOIN USER_FAVORITES UF ON T.track_id = UF.track_id
      WHERE UF.user_id = ?
      ORDER BY UF.added_at DESC
    `).all(userId);
  },

  addFavorite: (userId, trackId) => {
    return db.prepare('INSERT OR IGNORE INTO USER_FAVORITES (user_id, track_id) VALUES (?, ?)').run(userId, trackId);
  },

  removeFavorite: (userId, trackId) => {
    return db.prepare('DELETE FROM USER_FAVORITES WHERE user_id = ? AND track_id = ?').run(userId, trackId);
  },

  // Recommendation queries
  getTopArtistsByUser: (userId, limit = 10) => {
    return db.prepare(`
      SELECT 
        AR.artist_name,
        ROUND(AVG(T.popularity), 2) AS avg_track_popularity
      FROM USER U
      JOIN TRAITS TR ON U.user_id = TR.user_id
      JOIN ARTIST AR
      JOIN TRACK_ARTIST TA ON AR.artist_id = TA.artist_id
      JOIN TRACK T ON T.track_id = TA.track_id
      WHERE U.user_id = ?
      GROUP BY AR.artist_name
      ORDER BY avg_track_popularity DESC
      LIMIT ?
    `).all(userId, limit);
  },

  getPersonalityBasedRecommendations: (userId, limit = 10) => {
    return db.prepare(`
      SELECT 
        AR.artist_name,
        ROUND((ABS(TR.extraversion / 100 - AVG(T.energy)) 
              + ABS(TR.calmness / 100 - (1 - AVG(T.valence)))) / 2, 2) AS vibe_match_score
      FROM USER U
      JOIN TRAITS TR ON U.user_id = TR.user_id
      JOIN ARTIST AR
      JOIN TRACK_ARTIST TA ON AR.artist_id = TA.artist_id
      JOIN TRACK T ON T.track_id = TA.track_id
      WHERE U.user_id = ?
      GROUP BY AR.artist_name
      ORDER BY vibe_match_score ASC
      LIMIT ?
    `).all(userId, limit);
  },

  getUserPersonalityTag: (userId) => {
    return db.prepare(`
      SELECT 
        U.username,
        ROUND(AVG(T.energy), 2) AS avg_energy,
        ROUND(AVG(T.danceability), 2) AS avg_danceability,
        CASE 
          WHEN AVG(T.energy) > 0.7 AND AVG(T.danceability) > 0.7 THEN 'Party Lover'
          WHEN AVG(T.energy) > 0.6 THEN 'Active Listener'
          ELSE 'Calm Listener'
        END AS personality_tag
      FROM USER U
      JOIN USER_FAVORITES UF ON U.user_id = UF.user_id
      JOIN TRACK T ON T.track_id = UF.track_id
      WHERE U.user_id = ?
      GROUP BY U.username
    `).get(userId);
  },

  getHighEnergyAlbums: () => {
    return db.prepare(`
      SELECT 
        A.album_name,
        ROUND(AVG(T.energy), 2) AS avg_energy
      FROM ALBUM A
      JOIN TRACK T ON T.track_album = A.album_id
      GROUP BY A.album_name
      HAVING AVG(T.energy) > (SELECT AVG(energy) FROM TRACK)
      ORDER BY avg_energy DESC
    `).all();
  }
};

// Close database connection when process exits
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

export default db;
