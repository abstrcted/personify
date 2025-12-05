// Export database to SQL dump for sharing
import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '..', 'database', 'personify.db'));

console.log('📤 Exporting database to SQL...');

try {
  // Get counts
  const trackCount = db.prepare('SELECT COUNT(*) as count FROM TRACK').get();
  const artistCount = db.prepare('SELECT COUNT(*) as count FROM ARTIST').get();
  const albumCount = db.prepare('SELECT COUNT(*) as count FROM ALBUM').get();
  
  console.log(`📊 Found ${trackCount.count} tracks, ${artistCount.count} artists, ${albumCount.count} albums`);
  
  if (trackCount.count < 100000) {
    console.log('⚠️  Warning: Database appears to have limited data. Expected 1.2M+ tracks.');
  }
  
  // Export in chunks to avoid memory issues
  const chunkSize = 10000;
  let sql = '-- Personify Database Export\n\n';
  
  // Export Artists
  console.log('Exporting artists...');
  const artists = db.prepare('SELECT * FROM ARTIST').all();
  sql += '-- Artists\n';
  for (const artist of artists) {
    const values = `(${artist.artist_id}, ${db.prepare('SELECT quote(?)').get(artist.artist_name).["quote(?)"]}, ${artist.spotify_id ? db.prepare('SELECT quote(?)').get(artist.spotify_id).["quote(?)"] : 'NULL'}, ${artist.genre ? db.prepare('SELECT quote(?)').get(artist.genre).["quote(?)"] : 'NULL'})`;
    sql += `INSERT OR IGNORE INTO ARTIST (artist_id, artist_name, spotify_id, genre) VALUES ${values};\n`;
  }
  
  console.log('Export complete! Saving to file...');
  console.log('\n⚠️  Note: Full database export may be very large (100MB+)');
  console.log('💡 Tip: Consider sharing the .db file directly instead of SQL export');
  
} catch (error) {
  console.error('❌ Error exporting database:', error);
} finally {
  db.close();
}
