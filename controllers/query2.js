// Query 2 Controller: Track Search
// Pattern 2 - Search with dynamic table rendering
// GET /api/db/search?q=keyword

export const searchTracks = async (req, res) => {
  try {
    const { q } = req.query;
    
    // Validation
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters' 
      });
    }

    const keyword = q.trim();
    
    // Import db dynamically
    const dbModule = await import('../database/db.js');
    const db = dbModule.default;

    const tracks = db.prepare(`
      SELECT T.track_id, T.track_name, T.energy, T.valence, T.danceability, T.tempo,
             T.acousticness, T.instrumentalness, T.speechiness,
             GROUP_CONCAT(AR.artist_name, ', ') as artists,
             AL.album_name
      FROM TRACK T
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      LEFT JOIN ALBUM AL ON T.track_album = AL.album_id
      WHERE LOWER(T.track_name) LIKE LOWER(?) 
         OR LOWER(AR.artist_name) LIKE LOWER(?)
      GROUP BY T.track_id
      LIMIT 50
    `).all(`%${keyword}%`, `%${keyword}%`);

    if (tracks.length === 0) {
      return res.json({ 
        success: true, 
        tracks: [], 
        message: `No tracks found matching "${keyword}"` 
      });
    }

    res.json({ 
      success: true, 
      tracks,
      count: tracks.length 
    });

  } catch (error) {
    console.error('Error in Query 2:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
