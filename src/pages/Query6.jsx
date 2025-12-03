// Query 6: Transaction Demo - Bank Transfer
// Pattern 2 - Complex operation with explicit transaction control (BEGIN/COMMIT/ROLLBACK)
// Backend: POST /api/transaction/transfer
// Demonstrates atomicity: either all operations succeed or all are rolled back

import { useState, useEffect } from 'react';
import './Query6.css';

const Query6 = () => {
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [simulateError, setSimulateError] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch account balances on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3001/api/transaction/accounts');
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!fromAccount || !toAccount) {
      setError('Both accounts must be selected');
      return;
    }

    if (fromAccount === toAccount) {
      setError('Cannot transfer to the same account');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(
        'http://127.0.0.1:3001/api/transaction/transfer',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fromAccountId: parseInt(fromAccount),
            toAccountId: parseInt(toAccount),
            amount: transferAmount,
            simulateError: simulateError
          })
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          fromBalance: data.fromBalance,
          toBalance: data.toBalance,
          transactionId: data.transactionId
        });
        // Refresh account balances
        fetchAccounts();
      } else {
        // Transaction failed - rolled back
        setResult({
          success: false,
          message: data.message || data.error,
          rollback: true,
          error: data.error,
          reason: data.reason
        });
        // Refresh to show balances unchanged
        fetchAccounts();
      }
    } catch (err) {
      setError('Failed to process transfer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFromAccount('');
    setToAccount('');
    setAmount('');
    setSimulateError(false);
    setResult(null);
    setError('');
    fetchAccounts();
  };

  return (
    <div className="query6-container">
      <div className="query6-header">
        <h1>Query 6: Transaction Demo</h1>
        <p className="query6-description">
          Bank transfer with explicit transaction control (BEGIN, COMMIT, ROLLBACK)
        </p>
      </div>

      <div className="transaction-info">
        <h3>About This Transaction Demo</h3>
        <p>
          This interface demonstrates proper database transaction handling with explicit BEGIN/COMMIT/ROLLBACK commands.
          A bank transfer involves two interdependent operations that must execute atomically:
        </p>
        <ul>
          <li><strong>Operation 1:</strong> Deduct amount from source account</li>
          <li><strong>Operation 2:</strong> Add amount to destination account</li>
          <li><strong>Atomicity:</strong> Both operations succeed or both are rolled back</li>
          <li><strong>Consistency:</strong> Account balances are always valid (≥ 0)</li>
          <li><strong>Error Handling:</strong> Insufficient balance or constraint violations trigger ROLLBACK</li>
        </ul>
      </div>

      {/* Current Account Balances */}
      <div className="accounts-panel">
        <h3>Current Account Balances</h3>
        <div className="accounts-grid">
          {accounts.map(account => (
            <div key={account.account_id} className="account-card">
              <div className="account-name">{account.account_name}</div>
              <div className="account-balance">${parseFloat(account.balance).toFixed(2)}</div>
              <div className="account-id">Account #{account.account_id}</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="query6-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fromAccount">From Account *</label>
            <select
              id="fromAccount"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              required
              className="form-select"
            >
              <option value="">Select account...</option>
              {accounts.map(account => (
                <option key={account.account_id} value={account.account_id}>
                  {account.account_name} (${parseFloat(account.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="toAccount">To Account *</label>
            <select
              id="toAccount"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              required
              className="form-select"
            >
              <option value="">Select account...</option>
              {accounts.map(account => (
                <option key={account.account_id} value={account.account_id}>
                  {account.account_name} (${parseFloat(account.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Transfer Amount ($) *</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 100.00"
            required
            min="0.01"
            step="0.01"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
            />
            <span>Simulate Error (force rollback for testing)</span>
          </label>
          <small className="form-hint">
            When checked, the transaction will intentionally fail after deduction to demonstrate rollback behavior
          </small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Transfer Funds'}
          </button>
          <button type="button" onClick={handleReset} className="btn-secondary">
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Processing transaction...</p>
        </div>
      )}

      {result && result.success && (
        <div className="success-result">
          <div className="result-icon success-icon">✓</div>
          <div className="result-content">
            <h2>Transaction Successful - COMMITTED</h2>
            <p>{result.message}</p>
            <div className="transaction-details">
              <h4>Transaction Summary:</h4>
              <div className="detail-item">
                <span className="detail-label">Transaction ID:</span>
                <span className="detail-value">#{result.transactionId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">New Balance (From):</span>
                <span className="detail-value">${parseFloat(result.fromBalance).toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">New Balance (To):</span>
                <span className="detail-value">${parseFloat(result.toBalance).toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Transaction Status:</span>
                <span className="detail-value status-committed">COMMITTED</span>
              </div>
            </div>
            <div className="sql-flow">
              <h4>SQL Execution Flow:</h4>
              <ol>
                <li><code>BEGIN TRANSACTION;</code></li>
                <li><code>UPDATE BankAccounts SET balance = balance - {amount} WHERE account_id = {fromAccount};</code></li>
                <li><code>UPDATE BankAccounts SET balance = balance + {amount} WHERE account_id = {toAccount};</code></li>
                <li><code>INSERT INTO TransactionLog (...);</code></li>
                <li className="success-step"><code>COMMIT;</code> ✓ All changes saved</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div className="error-result">
          <div className="result-icon error-icon">✕</div>
          <div className="result-content">
            <h2>Transaction Failed - ROLLED BACK</h2>
            <p>{result.message}</p>
            {result.rollback && (
              <div className="rollback-notice">
                <strong>⟲ ROLLBACK PERFORMED</strong>
                <p>All changes have been rolled back. Account balances remain unchanged.</p>
                <p className="rollback-reason"><strong>Reason:</strong> {result.reason || result.error}</p>
              </div>
            )}
            <div className="transaction-details">
              <h4>Transaction Status:</h4>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-rollback">ROLLED BACK</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Error:</span>
                <span className="detail-value">{result.error || 'Unknown error'}</span>
              </div>
            </div>
            <div className="sql-flow">
              <h4>SQL Execution Flow:</h4>
              <ol>
                <li><code>BEGIN TRANSACTION;</code></li>
                <li><code>UPDATE BankAccounts SET balance = balance - {amount} WHERE account_id = {fromAccount};</code></li>
                <li className="error-step"><code>-- ERROR OCCURRED --</code></li>
                <li className="rollback-step"><code>ROLLBACK;</code> ✕ All changes reverted</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="navigation-links">
        <a href="/query5">← Previous Query</a>
        <a href="/">Home</a>
        <a href="/query1">Back to Query 1 →</a>
      </div>
    </div>
  );
};

export default Query6;
