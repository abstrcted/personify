// Query 3 Controller: Browse Tracks with Pagination
// Pattern 2 - Browse with sorting and pagination
// GET /api/db/browse?sort=field&order=asc&limit=20&offset=0

export const browseTracks = async (req, res) => {
  try {
    const { 
      sort = 'track_name', 
      order = 'asc', 
      limit = 20, 
      offset = 0 
    } = req.query;

    // Validation
    const allowedSorts = ['track_name', 'energy', 'valence', 'danceability', 'tempo'];
    const allowedOrders = ['asc', 'desc'];
    
    if (!allowedSorts.includes(sort)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid sort field' 
      });
    }
    
    if (!allowedOrders.includes(order.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid sort order' 
      });
    }

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Limit must be between 1 and 100' 
      });
    }
    
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Offset must be non-negative' 
      });
    }

    // Import db dynamically
    const dbModule = await import('../database/db.js');
    const db = dbModule.default;

    // Get total count
    const { total } = db.prepare('SELECT COUNT(*) as total FROM TRACK').get();

    // Get paginated results (include audio feature fields)
    const tracks = db.prepare(`
      SELECT T.track_id, T.track_name, T.energy, T.valence, T.danceability, T.tempo,
             T.acousticness, T.instrumentalness, T.speechiness,
             GROUP_CONCAT(AR.artist_name, ', ') as artists,
             AL.album_name
      FROM TRACK T
      LEFT JOIN TRACK_ARTIST TA ON T.track_id = TA.track_id
      LEFT JOIN ARTIST AR ON TA.artist_id = AR.artist_id
      LEFT JOIN ALBUM AL ON T.track_album = AL.album_id
      GROUP BY T.track_id
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `).all(limitNum, offsetNum);

    res.json({ 
      success: true, 
      tracks,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    });

  } catch (error) {
    console.error('Error in Query 3:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
