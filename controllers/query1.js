// Query 1 Controller: Simple Track Lookup
// Pattern 1 - Direct lookup with straightforward result display
// GET /api/db/track/:artist/:title

export const getTrackByArtistTitle = async (req, res) => {
  try {
    const { artist, title } = req.params;
    
    // Validation
    if (!artist || artist.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Artist name must be at least 2 characters' 
      });
    }
    
    if (!title || title.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Track title must be at least 2 characters' 
      });
    }

    // Clean title similarly to remote lookup
    const cleanedTitle = title
      .replace(/\s*-\s*(Radio Edit|Single Version|Album Version|Remaster|Remastered|Extended Mix|Extended Version|Original Mix|Radio Mix|Edit)\s*(\[.*?\])?/gi, '')
      .replace(/\s*\[.*?\]\s*/g, '')
      .replace(/\s*\(.*?(Radio Edit|Single Version|Album Version|Remaster|Remastered|Extended Mix|Extended Version|Original Mix|Radio Mix|Edit).*?\)\s*/gi, '')
      .trim();

    // Import db dynamically
    const dbModule = await import('../database/db.js');
    const db = dbModule.default;

    // Try exact match first
    let track = db.prepare(`
      SELECT T.*, GROUP_CONCAT(AR.artist_name, ', ') as artists, AL.album_name
      FROM TRACK T
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      LEFT JOIN ALBUM AL ON T.track_album = AL.album_id
      WHERE LOWER(AR.artist_name) LIKE LOWER(?) AND LOWER(T.track_name) = LOWER(?)
      GROUP BY T.track_id
      LIMIT 1
    `).get(`%${artist}%`, cleanedTitle);

    // If not found, try with original title
    if (!track && cleanedTitle !== title) {
      track = db.prepare(`
        SELECT T.*, GROUP_CONCAT(AR.artist_name, ', ') as artists, AL.album_name
        FROM TRACK T
        LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
        LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
        LEFT JOIN ALBUM AL ON T.track_album = AL.album_id
        WHERE LOWER(AR.artist_name) LIKE LOWER(?) AND LOWER(T.track_name) = LOWER(?)
        GROUP BY T.track_id
        LIMIT 1
      `).get(`%${artist}%`, title);
    }

    if (!track) {
      return res.status(404).json({ 
        success: false, 
        message: `Track "${title}" by "${artist}" not found in database` 
      });
    }

    res.json({ 
      success: true, 
      features: track 
    });

  } catch (error) {
    console.error('Error in Query 1:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
