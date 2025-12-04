// Migration script to replace patience/hustle with reflective/conversational
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, '../database/personify.db'));

console.log('🔄 Starting migration: patience/hustle → reflective/conversational...\n');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // Check if patience column exists
  const columns = db.prepare("PRAGMA table_info(TRAITS)").all();
  const hasPatienceColumn = columns.some(col => col.name === 'patience');
  const hasReflectiveColumn = columns.some(col => col.name === 'reflective');

  if (!hasPatienceColumn && hasReflectiveColumn) {
    console.log('✅ Migration already completed - reflective column exists');
    db.exec('ROLLBACK');
    process.exit(0);
  }

  if (!hasPatienceColumn) {
    console.log('⚠️  patience column not found - adding reflective column...');
    db.exec(`ALTER TABLE TRAITS ADD COLUMN reflective INTEGER CHECK(reflective >= 0 AND reflective <= 100)`);
    db.exec(`ALTER TABLE TRAITS ADD COLUMN conversational INTEGER CHECK(conversational >= 0 AND conversational <= 100)`);
    console.log('✅ Added reflective and conversational columns');
  } else {
    console.log('📋 Found patience column - renaming to reflective...');
    
    // SQLite doesn't support RENAME COLUMN directly in older versions
    // So we'll add new columns and copy data
    
    // Add new columns
    console.log('  Adding reflective column...');
    db.exec(`ALTER TABLE TRAITS ADD COLUMN reflective INTEGER CHECK(reflective >= 0 AND reflective <= 100)`);
    
    console.log('  Adding conversational column...');
    db.exec(`ALTER TABLE TRAITS ADD COLUMN conversational INTEGER CHECK(conversational >= 0 AND conversational <= 100)`);
    
    // Copy data from patience to reflective and hustle to conversational
    console.log('  Copying data from patience → reflective...');
    const copyPatienceResult = db.exec(`UPDATE TRAITS SET reflective = patience WHERE patience IS NOT NULL`);
    
    console.log('  Copying data from hustle → conversational...');
    const copyHustleResult = db.exec(`UPDATE TRAITS SET conversational = hustle WHERE hustle IS NOT NULL`);
    
    // Note: We can't easily drop columns in SQLite without recreating the table
    // For now, we'll just leave the old columns (they won't be used)
    console.log('✅ Data migrated successfully');
    console.log('ℹ️  Note: Old patience/hustle columns left in place for safety');
  }

  // Commit transaction
  db.exec('COMMIT');
  
  console.log('\n✅ Migration completed successfully!');
  console.log('\nNew trait structure:');
  console.log('  - Reflective (low speechiness = reflective/instrumental)');
  console.log('  - Conversational (high speechiness = conversational/vocal)');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  db.exec('ROLLBACK');
  process.exit(1);
} finally {
  db.close();
}
