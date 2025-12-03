// Setup script for Query 6 Transaction Demo
// Run this to initialize the BankAccounts table and seed data

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database/personify.db');
const db = new Database(dbPath);

console.log('🔧 Setting up Transaction Demo tables...\n');

try {
  // Create BankAccounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS BankAccounts (
      account_id INTEGER PRIMARY KEY,
      account_name VARCHAR(50) NOT NULL,
      balance DECIMAL(10, 2) NOT NULL CHECK(balance >= 0),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ BankAccounts table created');

  // Create TransactionLog table
  db.exec(`
    CREATE TABLE IF NOT EXISTS TransactionLog (
      transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_account INTEGER,
      to_account INTEGER,
      amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) NOT NULL,
      error_message TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_account) REFERENCES BankAccounts(account_id),
      FOREIGN KEY (to_account) REFERENCES BankAccounts(account_id)
    );
  `);
  console.log('✅ TransactionLog table created');

  // Check if accounts already exist
  const existingAccounts = db.prepare('SELECT COUNT(*) as count FROM BankAccounts').get();
  
  if (existingAccounts.count === 0) {
    // Insert seed data
    const insertAccount = db.prepare(`
      INSERT INTO BankAccounts (account_id, account_name, balance) 
      VALUES (?, ?, ?)
    `);

    insertAccount.run(1, 'Alice', 500.00);
    insertAccount.run(2, 'Bob', 300.00);
    insertAccount.run(3, 'Charlie', 150.00);
    
    console.log('✅ Seed data inserted');
  } else {
    console.log('ℹ️  Accounts already exist, skipping seed data');
  }

  // Display current accounts
  console.log('\n📊 Current Bank Accounts:');
  const accounts = db.prepare('SELECT * FROM BankAccounts ORDER BY account_id').all();
  console.table(accounts);

  console.log('\n✅ Transaction Demo setup complete!');
  console.log('You can now test Query 6 at http://localhost:5173/query6\n');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
