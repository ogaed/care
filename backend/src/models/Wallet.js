const db = require('../config/database');

class Wallet {
  static async findByUserId(entityId) {
    const result = await db.query(
      'SELECT * FROM wallets WHERE entity_id = $1',
      [entityId]
    );
    return result.rows[0];
  }

  static async createWallet(entityId, orgId) {
    const result = await db.query(
      'INSERT INTO wallets (entity_id, org_id, balance, total_saved) VALUES ($1, $2, $3, $4) RETURNING *',
      [entityId, orgId, 0.00, 0.00]
    );
    return result.rows[0];
  }

  static async updateBalance(walletId, amount, isDeposit = true) {
    const balanceOperation = isDeposit ? '+' : '-';
    const totalSavedOperation = isDeposit ? '+' : '';
    
    console.log(`Updating wallet ${walletId}: ${isDeposit ? 'DEPOSIT' : 'WITHDRAWAL'}, amount: ${amount}`);
    console.log(`SQL: balance = balance ${balanceOperation} ${amount}, total_saved = total_saved ${totalSavedOperation} ${amount}`);
    
    const result = await db.query(
      `UPDATE wallets 
       SET balance = balance ${balanceOperation} $1, 
           total_saved = total_saved ${isDeposit ? '+' : ''} $1,
           updated_at = CURRENT_TIMESTAMP 
       WHERE wallet_id = $2 
       RETURNING *`,
      [amount, walletId]
    );
    
    console.log(`Result: balance=${result.rows[0].balance}, total_saved=${result.rows[0].total_saved}`);
    return result.rows[0];
  }
}

module.exports = Wallet;