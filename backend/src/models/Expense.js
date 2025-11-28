const db = require('../config/database');

class Expense {
  static async create(expenseData) {
    const { entity_id, org_id, goal_id, amount, expense_category, description, expense_date } = expenseData;
    
    const result = await db.query(
      `INSERT INTO expenses (entity_id, org_id, goal_id, amount, expense_category, description, expense_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [entity_id, org_id, goal_id, amount, expense_category, description, expense_date]
    );
    
    return result.rows[0];
  }

  static async findByUserId(entityId, limit = 20, offset = 0) {
    const result = await db.query(
      `SELECT e.*, sg.goal_name 
       FROM expenses e
       LEFT JOIN savings_goals sg ON e.goal_id = sg.goal_id
       WHERE e.entity_id = $1 
       ORDER BY e.expense_date DESC, e.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [entityId, limit, offset]
    );
    
    const totalResult = await db.query(
      'SELECT COUNT(*) FROM expenses WHERE entity_id = $1',
      [entityId]
    );
    
    return {
      expenses: result.rows,
      total: parseInt(totalResult.rows[0].count)
    };
  }

  static async getExpenseSummary(entityId, startDate, endDate) {
    const result = await db.query(
      `SELECT 
        expense_category,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
       FROM expenses 
       WHERE entity_id = $1 
         AND expense_date BETWEEN $2 AND $3
       GROUP BY expense_category
       ORDER BY total_amount DESC`,
      [entityId, startDate, endDate]
    );
    
    return result.rows;
  }

  static async getAllExpenses(orgId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT e.*, en.entity_name, en.user_name, sg.goal_name 
       FROM expenses e
       JOIN entitys en ON e.entity_id = en.entity_id
       LEFT JOIN savings_goals sg ON e.goal_id = sg.goal_id
       WHERE e.org_id = $1 
       ORDER BY e.expense_date DESC, e.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );
    
    const totalResult = await db.query(
      'SELECT COUNT(*) FROM expenses WHERE org_id = $1',
      [orgId]
    );
    
    return {
      expenses: result.rows,
      total: parseInt(totalResult.rows[0].count)
    };
  }
}

module.exports = Expense;