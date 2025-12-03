// Query 5 Controller: Add Track to User's Liked Songs
// Pattern 1 - Simple submission with result display
// POST /api/liked-songs/:userId

export const addLikedSong = async (req, res) => {
  try {
    const { userId } = req.params;
    const { trackId } = req.body;
    
    // Validation
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }
    
    if (!trackId || isNaN(parseInt(trackId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid track ID is required' 
      });
    }

    const userIdNum = parseInt(userId);
    const trackIdNum = parseInt(trackId);

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

    // Check if track exists
    const track = db.prepare('SELECT track_id, track_name FROM TRACK WHERE track_id = ?').get(trackIdNum);
    if (!track) {
      return res.status(404).json({ 
        success: false, 
        message: `Track with ID ${trackIdNum} not found` 
      });
    }

    // Check if already liked
    const existing = db.prepare('SELECT * FROM USER_FAVORITES WHERE user_id = ? AND track_id = ?')
      .get(userIdNum, trackIdNum);
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: `Track "${track.track_name}" is already in your liked songs` 
      });
    }

    // Add to liked songs
    db.prepare('INSERT INTO USER_FAVORITES (user_id, track_id) VALUES (?, ?)')
      .run(userIdNum, trackIdNum);

    res.json({ 
      success: true, 
      message: `Successfully added "${track.track_name}" to ${user.username}'s liked songs`,
      track: {
        track_id: trackIdNum,
        track_name: track.track_name
      },
      user: {
        user_id: userIdNum,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Error in Query 5:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
