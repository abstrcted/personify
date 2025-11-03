import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'personify.db'));

console.log('🔍 Checking user primitivo (ID: 5)...\n');

// Check tracks
const tracks = db.prepare(`
  SELECT t.track_name, t.popularity, t.duration_ms
  FROM TRACK t 
  JOIN USER_FAVORITES uf ON t.track_id = uf.track_id 
  WHERE uf.user_id = 5 
  LIMIT 10
`).all();

console.log('📀 Your saved tracks:');
console.table(tracks);

// Count total
const count = db.prepare('SELECT COUNT(*) as count FROM USER_FAVORITES WHERE user_id = 5').get();
console.log(`\n✅ Total tracks for user 5: ${count.count}`);

// Check if any have audio features
const withFeatures = db.prepare(`
  SELECT COUNT(*) as count 
  FROM TRACK t 
  JOIN USER_FAVORITES uf ON t.track_id = uf.track_id 
  WHERE uf.user_id = 5 AND t.energy IS NOT NULL
`).get();

console.log(`🎵 Tracks with audio features: ${withFeatures.count}`);

db.close();
