const db = require('../config/database');

class User {
  static async findByUsername(username) {
    const result = await db.query(
      'SELECT * FROM entitys WHERE user_name = $1 OR primary_email = $1',
      [username]
    );
    return result.rows[0];
  }

  static async findById(userId) {
    const result = await db.query(
      'SELECT entity_id, user_name, primary_email, primary_telephone, role, created_at FROM entitys WHERE entity_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  static async create(userData) {
    const { org_id, entity_name, user_name, primary_email, primary_telephone, entity_password, first_password, role } = userData;
    
    const result = await db.query(
      `INSERT INTO entitys (org_id, entity_name, user_name, primary_email, primary_telephone, 
       entity_password, first_password, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING entity_id, user_name, primary_email, role, created_at`,
      [org_id, entity_name, user_name, primary_email, primary_telephone, entity_password, first_password, role]
    );
    
    return result.rows[0];
  }

  static async getAllUsers(orgId) {
    const result = await db.query(
      `SELECT entity_id, entity_name, user_name, primary_email, primary_telephone, 
              role, created_at, updated_at 
       FROM entitys 
       WHERE org_id = $1 
       ORDER BY created_at DESC`,
      [orgId]
    );
    return result.rows;
  }
}

module.exports = User;
