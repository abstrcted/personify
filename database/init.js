// Database initialization script for Personify
// This script creates and initializes the SQLite database

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database file
const db = new Database(join(__dirname, 'personify.db'));

console.log('📊 Initializing Personify database...');

try {
  // Read and execute schema
  console.log('Creating tables...');
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  console.log('✅ Tables created successfully');

  // Read and execute seed data
  console.log('Inserting seed data...');
  const seed = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');
  db.exec(seed);
  console.log('✅ Seed data inserted successfully');

  // Verify the setup
  const userCount = db.prepare('SELECT COUNT(*) as count FROM USER').get();
  const trackCount = db.prepare('SELECT COUNT(*) as count FROM TRACK').get();
  const artistCount = db.prepare('SELECT COUNT(*) as count FROM ARTIST').get();

  console.log('\n📈 Database Statistics:');
  console.log(`   Users: ${userCount.count}`);
  console.log(`   Artists: ${artistCount.count}`);
  console.log(`   Tracks: ${trackCount.count}`);

  console.log('\n✨ Database initialized successfully!');
  console.log('   Location: database/personify.db');
} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
} finally {
  db.close();
}
