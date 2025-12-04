// Script to fetch and update track durations from Spotify API
import SpotifyWebApi from 'spotify-web-api-node';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, '../database/personify.db'));

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function updateTrackDurations() {
  try {
    // Get client credentials token
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('✅ Spotify API authenticated');

    // Get only tracks that are in user favorites and missing duration
    const tracks = db.prepare(`
      SELECT DISTINCT T.track_id, T.track_name, T.spotify_id 
      FROM TRACK T
      JOIN USER_FAVORITES UF ON T.track_id = UF.track_id
      WHERE T.duration_ms IS NULL 
      AND T.spotify_id LIKE 'csv-%'
    `).all();

    console.log(`\nFound ${tracks.length} liked tracks without duration_ms`);

    let updated = 0;
    let notFound = 0;

    for (const track of tracks) {
      console.log(`\nSearching for: ${track.track_name}`);
      
      try {
        // Search Spotify for the track
        const searchResult = await spotifyApi.searchTracks(track.track_name, { limit: 1 });
        
        if (searchResult.body.tracks.items.length > 0) {
          const spotifyTrack = searchResult.body.tracks.items[0];
          const duration = spotifyTrack.duration_ms;
          const spotifyId = spotifyTrack.id;
          
          // Update the track with real Spotify data
          db.prepare(`
            UPDATE TRACK 
            SET duration_ms = ?, spotify_id = ?
            WHERE track_id = ?
          `).run(duration, spotifyId, track.track_id);
          
          console.log(`✅ Updated: ${track.track_name}`);
          console.log(`   Duration: ${Math.round(duration / 1000)}s`);
          console.log(`   New Spotify ID: ${spotifyId}`);
          updated++;
        } else {
          console.log(`❌ Not found on Spotify: ${track.track_name}`);
          notFound++;
        }
        
        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing ${track.track_name}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Not found: ${notFound}`);
    console.log(`   Total processed: ${tracks.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

updateTrackDurations();
