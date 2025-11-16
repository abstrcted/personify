# GetSongBPM Integration

## Overview

This project uses GetSongBPM API as an alternative to Spotify's audio features endpoint, which has strict rate limits and often returns 403 errors for developer accounts.

## How It Works

### Data Flow

1. **Fetch Tracks from Spotify**
   - Uses Spotify Web API to get user's top tracks
   - Retrieves: track name, artist, album, duration, popularity, etc.

2. **Fetch Audio Features from GetSongBPM**
   - Takes track names and artists from Spotify
   - Calls GetSongBPM API in batches (rate limited to 3 requests/second)
   - Retrieves: BPM (tempo), energy, danceability, musical key

3. **Store in Database**
   - Combines Spotify track data + GetSongBPM audio features
   - Saves to SQLite database for analysis

### API Endpoints

#### Single Track Lookup
```javascript
GET /api/getsongbpm/track/:artist/:title

Example:
GET /api/getsongbpm/track/Taylor Swift/Anti-Hero

Response:
{
  "success": true,
  "features": {
    "tempo": 97,
    "key": "C",
    "energy": 0.65,
    "danceability": 0.78,
    "artist": "Taylor Swift",
    "title": "Anti-Hero",
    "album": "Midnights",
    "genre": "pop"
  }
}
```

#### Batch Lookup
```javascript
POST /api/getsongbpm/batch

Body:
{
  "tracks": [
    { "spotify_id": "1", "artist": "Daft Punk", "title": "Get Lucky" },
    { "spotify_id": "2", "artist": "The Weeknd", "title": "Blinding Lights" }
  ]
}

Response:
{
  "success": true,
  "processed": 2,
  "results": [
    {
      "spotify_id": "1",
      "success": true,
      "features": { "tempo": 116, "energy": 0.78, ... }
    },
    {
      "spotify_id": "2",
      "success": true,
      "features": { "tempo": 171, "energy": 0.73, ... }
    }
  ]
}
```

### Rate Limiting

GetSongBPM allows **3 requests per second**. The batch endpoint automatically handles this:
- Processes tracks sequentially
- Waits 350ms between each request
- For 20 tracks: ~7 seconds total

### Audio Features Comparison

| Feature | Spotify API | GetSongBPM API |
|---------|-------------|----------------|
| Tempo (BPM) | ✅ | ✅ |
| Energy | ✅ | ✅ |
| Danceability | ✅ | ✅ |
| Key | ✅ | ✅ |
| Valence | ✅ | ❌ |
| Acousticness | ✅ | ❌ |
| Instrumentalness | ✅ | ❌ |
| Liveness | ✅ | ❌ |
| Speechiness | ✅ | ❌ |
| Genre | ❌ | ✅ |

## Implementation

### Frontend (TopTracks.jsx)

```javascript
// Prepare tracks for GetSongBPM
const tracksForBatch = tracks.map(track => ({
  spotify_id: track.id,
  artist: track.artists[0].name,
  title: track.name
}));

// Fetch audio features
const response = await fetch('http://127.0.0.1:3001/api/getsongbpm/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tracks: tracksForBatch })
});

const data = await response.json();
// Map results back to tracks and save to database
```

### Backend (server.js)

```javascript
// Batch endpoint with rate limiting
app.post('/api/getsongbpm/batch', async (req, res) => {
  const { tracks } = req.body;
  const results = [];
  
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    
    // Fetch from GetSongBPM
    const url = `https://api.getsongbpm.com/search/?api_key=${apiKey}&type=both&lookup=song:${track.title} artist:${track.artist}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Process result...
    
    // Rate limit: 350ms between requests
    if (i < tracks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }
  
  res.json({ success: true, results });
});
```

## Environment Variables

Add to `.env`:
```
GETSONGBPM_API_KEY=your_api_key_here
```

## Testing

Run the test script:
```bash
node test-getsongbpm.js
```

This will test both single track lookup and batch processing.

## Benefits

1. ✅ **No 403 Errors** - GetSongBPM doesn't have Spotify's strict quotas
2. ✅ **No OAuth Required** - Simple API key authentication
3. ✅ **Genre Data** - GetSongBPM provides genre information
4. ✅ **Reliable** - Works consistently without rate limit issues
5. ✅ **Free Tier** - Sufficient for development and small projects

## Limitations

1. ❌ **Missing Features** - No valence, acousticness, liveness, etc.
2. ⏱️ **Slower** - Rate limited to 3 req/sec (vs Spotify's 100 tracks at once)
3. 🎯 **Match Accuracy** - May not find exact matches for all tracks
4. 🔄 **No Real-time** - Can't analyze custom playlists or new releases immediately

## Future Enhancements

- Cache GetSongBPM results to avoid repeat lookups
- Fallback to Spotify audio features when available
- Implement retry logic for failed lookups
- Add progress indicator for batch processing
- Store "last updated" timestamps for features
