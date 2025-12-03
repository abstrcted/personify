// Query 6 Controller: Bank Transfer Transaction Demo
// Pattern 2 - Complex operation with explicit transaction control (BEGIN/COMMIT/ROLLBACK)
// GET /api/transaction/accounts - Get all bank accounts
// POST /api/transaction/transfer - Perform transfer with explicit transaction control

import db from '../database/db.js';

export const getAccounts = async (req, res) => {
  console.log('📥 GET /api/transaction/accounts called');
  try {
    console.log('Attempting to query BankAccounts table...');
    const accounts = db.prepare(`
      SELECT account_id, account_name, balance, last_updated
      FROM BankAccounts
      ORDER BY account_id
    `).all();
    
    console.log(`Found ${accounts.length} accounts`);
    res.json({ success: true, accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const transferFunds = (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, simulateError } = req.body;
    
    // Validation
    if (!fromAccountId || !toAccountId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both fromAccountId and toAccountId are required' 
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be a positive number' 
      });
    }
    
    if (fromAccountId === toAccountId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot transfer to the same account' 
      });
    }
    
    console.log(`\n🔄 Starting transaction: Transfer $${amount} from account ${fromAccountId} to ${toAccountId}`);
    
    try {
      // ===== BEGIN TRANSACTION =====
      console.log('📝 Executing: BEGIN TRANSACTION;');
      db.prepare('BEGIN TRANSACTION').run();
      
      // Step 1: Check source account balance
      const fromAccount = db.prepare('SELECT account_id, account_name, balance FROM BankAccounts WHERE account_id = ?')
        .get(fromAccountId);
      
      if (!fromAccount) {
        throw new Error(`Source account ${fromAccountId} not found`);
      }
      
      if (fromAccount.balance < amount) {
        throw new Error(`Insufficient balance. Available: $${fromAccount.balance}, Required: $${amount}`);
      }
      
      // Step 2: Check destination account exists
      const toAccount = db.prepare('SELECT account_id, account_name, balance FROM BankAccounts WHERE account_id = ?')
        .get(toAccountId);
      
      if (!toAccount) {
        throw new Error(`Destination account ${toAccountId} not found`);
      }
      
      // Simulate error if requested (for testing rollback)
      if (simulateError) {
        console.log('⚠️ Simulated error triggered - forcing rollback');
        throw new Error('Simulated error: Transaction intentionally failed for testing');
      }
      
      // Step 3: Deduct from source account
      console.log(`📝 Executing: UPDATE BankAccounts SET balance = balance - ${amount} WHERE account_id = ${fromAccountId};`);
      db.prepare(`
        UPDATE BankAccounts 
        SET balance = balance - ?, last_updated = CURRENT_TIMESTAMP 
        WHERE account_id = ?
      `).run(amount, fromAccountId);
      
      // Step 4: Add to destination account
      console.log(`📝 Executing: UPDATE BankAccounts SET balance = balance + ${amount} WHERE account_id = ${toAccountId};`);
      db.prepare(`
        UPDATE BankAccounts 
        SET balance = balance + ?, last_updated = CURRENT_TIMESTAMP 
        WHERE account_id = ?
      `).run(amount, toAccountId);
      
      // Step 5: Log the transaction
      console.log('📝 Executing: INSERT INTO TransactionLog...');
      const logResult = db.prepare(`
        INSERT INTO TransactionLog (from_account, to_account, amount, status)
        VALUES (?, ?, ?, 'SUCCESS')
      `).run(fromAccountId, toAccountId, amount);
      
      // ===== COMMIT =====
      console.log('✅ Executing: COMMIT;');
      db.prepare('COMMIT').run();
      
      // Get updated balances
      const updatedFrom = db.prepare('SELECT balance FROM BankAccounts WHERE account_id = ?').get(fromAccountId);
      const updatedTo = db.prepare('SELECT balance FROM BankAccounts WHERE account_id = ?').get(toAccountId);
      
      console.log(`✅ Transaction successful! New balances: ${fromAccount.account_name}=$${updatedFrom.balance}, ${toAccount.account_name}=$${updatedTo.balance}\n`);
      
      return res.json({
        success: true,
        message: `Successfully transferred $${amount} from ${fromAccount.account_name} to ${toAccount.account_name}`,
        transactionId: logResult.lastInsertRowid,
        fromBalance: updatedFrom.balance,
        toBalance: updatedTo.balance,
        details: {
          fromAccount: fromAccount.account_name,
          toAccount: toAccount.account_name,
          amount: amount
        }
      });
      
    } catch (transactionError) {
      // ===== ROLLBACK =====
      console.log(`❌ Transaction error: ${transactionError.message}`);
      console.log('⟲ Executing: ROLLBACK;');
      db.prepare('ROLLBACK').run();
      console.log('⟲ Rollback completed - all changes reverted\n');
      
      // Log failed transaction
      try {
        db.prepare(`
          INSERT INTO TransactionLog (from_account, to_account, amount, status, error_message)
          VALUES (?, ?, ?, 'FAILED', ?)
        `).run(fromAccountId, toAccountId, amount, transactionError.message);
      } catch (logError) {
        console.error('Failed to log failed transaction:', logError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Transaction rolled back',
        error: transactionError.message,
        reason: simulateError ? 'Simulated error for testing' : 'Transaction failed - all changes reverted'
      });
    }
    
  } catch (error) {
    console.error('Error in transfer endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
