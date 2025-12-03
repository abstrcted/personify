// Query 4 Controller: User Statistics
// Pattern 1 - Simple lookup with straightforward result display
// GET /api/user-stats/:userId

export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validation
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }

    const userIdNum = parseInt(userId);

    // Import db dynamically
    const dbModule = await import('../database/db.js');
    const db = dbModule.default;

    // Check if user exists
    const user = db.prepare('SELECT user_id, username FROM USER WHERE user_id = ?').get(userIdNum);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: `User with ID ${userIdNum} not found` 
      });
    }

    // Get user's audio feature averages
    const stats = db.prepare(`
      SELECT 
        AVG(T.energy) as avg_energy,
        AVG(T.valence) as avg_valence,
        AVG(T.danceability) as avg_danceability,
        AVG(T.tempo) as avg_tempo,
        AVG(T.acousticness) as avg_acousticness,
        AVG(T.speechiness) as avg_speechiness,
        COUNT(DISTINCT UF.track_id) as total_liked_songs
      FROM USER_FAVORITES UF
      JOIN TRACK T ON UF.track_id = T.track_id
      WHERE UF.user_id = ? AND T.energy IS NOT NULL
    `).get(userIdNum);

    if (!stats || stats.total_liked_songs === 0) {
      return res.json({ 
        success: true, 
        stats: {
          user_id: userIdNum,
          username: user.username,
          message: 'No liked songs found for this user',
          total_liked_songs: 0
        }
      });
    }

    res.json({ 
      success: true, 
      stats: {
        user_id: userIdNum,
        username: user.username,
        avg_energy: parseFloat(stats.avg_energy?.toFixed(3)) || 0,
        avg_valence: parseFloat(stats.avg_valence?.toFixed(3)) || 0,
        avg_danceability: parseFloat(stats.avg_danceability?.toFixed(3)) || 0,
        avg_tempo: parseFloat(stats.avg_tempo?.toFixed(1)) || 0,
        avg_acousticness: parseFloat(stats.avg_acousticness?.toFixed(3)) || 0,
        avg_speechiness: parseFloat(stats.avg_speechiness?.toFixed(3)) || 0,
        total_liked_songs: stats.total_liked_songs
      }
    });

  } catch (error) {
    console.error('Error in Query 4:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
