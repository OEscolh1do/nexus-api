const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Built-in node module
const AppError = require('../../utils/AppError');

const DATA_DIR = path.join(__dirname, '../../../data');
const LEDGER_FILE = path.join(DATA_DIR, 'ledger.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
// Ensure ledger file exists
if (!fs.existsSync(LEDGER_FILE)) {
    fs.writeFileSync(LEDGER_FILE, JSON.stringify([])); // Empty array
}

const FinService = {
  /**
   * Records a new immutable transaction.
   */
  async recordTransaction(data, userId) {
    const { type, amount, category, description, date } = data;

    if (!['CREDIT', 'DEBIT'].includes(type)) {
        throw new AppError("Invalid transaction type. Must be CREDIT or DEBIT.", 400);
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
        throw new AppError("Invalid amount. Must be positive number.", 400);
    }

    const transaction = {
        id: crypto.randomUUID(),
        type,
        amount: parseFloat(amount),
        category: category || 'General',
        description: description || '',
        date: date || new Date().toISOString(),
        userId: userId || 'system',
        createdAt: new Date().toISOString(),
    };

    const ledger = this._readLedger();
    ledger.push(transaction);
    this._writeLedger(ledger);

    return transaction;
  },

  async getLedger({ startDate, endDate } = {}) {
      let ledger = this._readLedger();
      
      // Sort by date desc
      ledger.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (startDate) {
          ledger = ledger.filter(t => new Date(t.date) >= new Date(startDate));
      }
      if (endDate) {
          ledger = ledger.filter(t => new Date(t.date) <= new Date(endDate));
      }

      return ledger;
  },

  async getBalance() {
      const ledger = this._readLedger();
      
      const balance = ledger.reduce((acc, curr) => {
          if (curr.type === 'CREDIT') return acc + curr.amount;
          if (curr.type === 'DEBIT') return acc - curr.amount;
          return acc;
      }, 0);

      const income = ledger.filter(t => t.type === 'CREDIT').reduce((a, c) => a + c.amount, 0);
      const expenses = ledger.filter(t => t.type === 'DEBIT').reduce((a, c) => a + c.amount, 0);

      return {
          total: balance,
          income,
          expenses,
          count: ledger.length
      };
  },

  // --- Helpers ---
  _readLedger() {
      try {
          const data = fs.readFileSync(LEDGER_FILE, 'utf8');
          return JSON.parse(data);
      } catch (err) {
          console.error("Failed to read ledger", err);
          return [];
      }
  },

  _writeLedger(data) {
      try {
          fs.writeFileSync(LEDGER_FILE, JSON.stringify(data, null, 2));
      } catch (err) {
          throw new AppError("Failed to write to ledger file", 500);
      }
  }
};

module.exports = FinService;
