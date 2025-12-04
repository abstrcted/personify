// Migration script to add new personality trait columns to existing database
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../database/personify.db'));

console.log('🔄 Starting database migration for personality traits...\n');

try {
  // Check if TRAITS table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='TRAITS'
  `).get();

  if (!tableExists) {
    console.log('⚠️  TRAITS table does not exist. Creating new table...');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS TRAITS (
        trait_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        patience INTEGER CHECK(patience >= 0 AND patience <= 100),
        moodiness INTEGER CHECK(moodiness >= 0 AND moodiness <= 100),
        openness INTEGER CHECK(openness >= 0 AND openness <= 100),
        chaoticness INTEGER CHECK(chaoticness >= 0 AND chaoticness <= 100),
        extraversion INTEGER CHECK(extraversion >= 0 AND extraversion <= 100),
        whimsy INTEGER CHECK(whimsy >= 0 AND whimsy <= 100),
        balance INTEGER CHECK(balance >= 0 AND balance <= 100),
        calmness INTEGER CHECK(calmness >= 0 AND calmness <= 100),
        groundedness INTEGER CHECK(groundedness >= 0 AND groundedness <= 100),
        introspection INTEGER CHECK(introspection >= 0 AND introspection <= 100),
        joyfulness INTEGER CHECK(joyfulness >= 0 AND joyfulness <= 100),
        hustle INTEGER CHECK(hustle >= 0 AND hustle <= 100),
        conscientiousness INTEGER CHECK(conscientiousness >= 0 AND conscientiousness <= 100),
        agreeableness INTEGER CHECK(agreeableness >= 0 AND agreeableness <= 100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
      );
    `);
    
    console.log('✅ TRAITS table created successfully!\n');
  } else {
    console.log('✅ TRAITS table exists. Checking for new columns...\n');
    
    // Get existing columns
    const columns = db.prepare('PRAGMA table_info(TRAITS)').all();
    const columnNames = columns.map(col => col.name);
    
    console.log('Current columns:', columnNames.join(', '));
    
    // List of new columns to add
    const newColumns = [
      { name: 'patience', definition: 'INTEGER CHECK(patience >= 0 AND patience <= 100)' },
      { name: 'moodiness', definition: 'INTEGER CHECK(moodiness >= 0 AND moodiness <= 100)' },
      { name: 'whimsy', definition: 'INTEGER CHECK(whimsy >= 0 AND whimsy <= 100)' },
      { name: 'balance', definition: 'INTEGER CHECK(balance >= 0 AND balance <= 100)' },
      { name: 'groundedness', definition: 'INTEGER CHECK(groundedness >= 0 AND groundedness <= 100)' },
      { name: 'introspection', definition: 'INTEGER CHECK(introspection >= 0 AND introspection <= 100)' },
      { name: 'joyfulness', definition: 'INTEGER CHECK(joyfulness >= 0 AND joyfulness <= 100)' },
      { name: 'hustle', definition: 'INTEGER CHECK(hustle >= 0 AND hustle <= 100)' },
      { name: 'chaoticness', definition: 'INTEGER CHECK(chaoticness >= 0 AND chaoticness <= 100)' },
      { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    // Add missing columns
    let addedCount = 0;
    for (const col of newColumns) {
      if (!columnNames.includes(col.name)) {
        try {
          db.exec(`ALTER TABLE TRAITS ADD COLUMN ${col.name} ${col.definition}`);
          console.log(`  ✅ Added column: ${col.name}`);
          addedCount++;
        } catch (error) {
          console.log(`  ⚠️  Could not add ${col.name}: ${error.message}`);
        }
      }
    }
    
    if (addedCount === 0) {
      console.log('\n✅ All columns already exist. No changes needed.');
    } else {
      console.log(`\n✅ Added ${addedCount} new column(s).`);
    }
    
    // Add UNIQUE constraint to user_id if it doesn't exist
    console.log('\n🔍 Checking UNIQUE constraint on user_id...');
    const indexExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='TRAITS' AND sql LIKE '%user_id%UNIQUE%'
    `).get();
    
    if (!indexExists) {
      try {
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_traits_user_id ON TRAITS(user_id)');
        console.log('✅ Added UNIQUE index on user_id');
      } catch (error) {
        console.log('⚠️  UNIQUE constraint may already exist via table definition');
      }
    } else {
      console.log('✅ UNIQUE constraint already exists on user_id');
    }
  }
  
  console.log('\n✅ Migration completed successfully!');
  console.log('\n📊 Final TRAITS table structure:');
  const finalColumns = db.prepare('PRAGMA table_info(TRAITS)').all();
  finalColumns.forEach(col => {
    console.log(`  - ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.pk ? ', PRIMARY KEY' : ''})`);
  });
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
