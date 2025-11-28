const db = require('../config/database');

class Deposit {
  static async create(depositData) {
    const { wallet_id, entity_id, org_id, amount, transaction_type, description } = depositData;
    
    const result = await db.query(
      `INSERT INTO deposits (wallet_id, entity_id, org_id, amount, transaction_type, description) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [wallet_id, entity_id, org_id, amount, transaction_type, description]
    );
    
    return result.rows[0];
  }

  static async findByUserId(entityId, limit = 20, offset = 0) {
    const result = await db.query(
      `SELECT * FROM deposits 
       WHERE entity_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [entityId, limit, offset]
    );
    
    const totalResult = await db.query(
      'SELECT COUNT(*) FROM deposits WHERE entity_id = $1',
      [entityId]
    );
    
    return {
      transactions: result.rows,
      total: parseInt(totalResult.rows[0].count)
    };
  }

  static async getAllDeposits(orgId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT d.*, e.entity_name, e.user_name 
       FROM deposits d
       JOIN entitys e ON d.entity_id = e.entity_id
       WHERE d.org_id = $1 
       ORDER BY d.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );
    
    const totalResult = await db.query(
      'SELECT COUNT(*) FROM deposits WHERE org_id = $1',
      [orgId]
    );
    
    return {
      deposits: result.rows,
      total: parseInt(totalResult.rows[0].count)
    };
  }
}

module.exports = Deposit;