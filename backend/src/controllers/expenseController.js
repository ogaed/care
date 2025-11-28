const db = require('../config/database');

// const createExpense = async (req, res) => {
//   try {
//     const { goal_id, amount, expense_category, description, expense_date } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ error: 'Valid amount required' });
//     }

//     if (!expense_category) {
//       return res.status(400).json({ error: 'Expense category required' });
//     }

//     // Check if user has sufficient balance
//     const wallet = await db.query(
//       'SELECT * FROM wallets WHERE entity_id = $1',
//       [req.user.entity_id]
//     );

//     if (wallet.rows.length === 0 || wallet.rows[0].balance < amount) {
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     const expense = await db.query(
//       `INSERT INTO expenses (entity_id, org_id, goal_id, amount, expense_category, description, expense_date) 
//        VALUES ($1, $2, $3, $4, $5, $6, $7) 
//        RETURNING *`,
//       [
//         req.user.entity_id, 
//         req.user.org_id, 
//         goal_id, 
//         amount, 
//         expense_category, 
//         description, 
//         expense_date || new Date().toISOString().split('T')[0]
//       ]
//     );

//     // Create withdrawal transaction
//     await db.query(
//       `INSERT INTO deposits (wallet_id, entity_id, org_id, amount, transaction_type, description) 
//        VALUES ($1, $2, $3, $4, 'withdrawal', $5)`,
//       [
//         wallet.rows[0].wallet_id, 
//         req.user.entity_id, 
//         req.user.org_id, 
//         amount, 
//         `Expense: ${description || expense_category}`
//       ]
//     );

//     // Update wallet balance
//     await db.query(
//       `UPDATE wallets 
//        SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP 
//        WHERE wallet_id = $2`,
//       [amount, wallet.rows[0].wallet_id]
//     );

//     res.status(201).json({
//       message: 'Expense recorded successfully',
//       expense: expense.rows[0]
//     });
//   } catch (error) {
//     console.error('Create expense error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };
const createExpense = async (req, res) => {
    try {
      const { goal_id, amount, expense_category, description, expense_date } = req.body;
  
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount required' });
      }
  
      if (!expense_category) {
        return res.status(400).json({ error: 'Expense category required' });
      }
  
      // Get user's wallet
      const wallet = await db.query(
        'SELECT * FROM wallets WHERE entity_id = $1',
        [req.user.entity_id]
      );
  
      if (wallet.rows.length === 0) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
  
      const walletId = wallet.rows[0].wallet_id;
      let remainingAmount = amount;
      let goalDeduction = 0;
      let walletDeduction = 0;
  
      // If expense is for a specific goal, deduct from goal savings first
      if (goal_id) {
        const goalResult = await db.query(
          'SELECT goal_id, goal_name, amount_saved FROM savings_goals WHERE goal_id = $1 AND entity_id = $2',
          [goal_id, req.user.entity_id]
        );
  
        if (goalResult.rows.length === 0) {
          return res.status(404).json({ error: 'Goal not found' });
        }
  
        const goal = goalResult.rows[0];
        goalDeduction = Math.min(goal.amount_saved, amount);
        remainingAmount = amount - goalDeduction;
  
        // Deduct from goal savings if available
        if (goalDeduction > 0) {
          await db.query(
            'UPDATE savings_goals SET amount_saved = amount_saved - $1, updated_at = CURRENT_TIMESTAMP WHERE goal_id = $2',
            [goalDeduction, goal_id]
          );
        }
      }
  
      // Deduct remaining amount from wallet balance if needed
      if (remainingAmount > 0) {
        if (wallet.rows[0].balance < remainingAmount) {
          return res.status(400).json({ 
            error: `Insufficient funds. Need ${remainingAmount} but only ${wallet.rows[0].balance} available in wallet` 
          });
        }
        walletDeduction = remainingAmount;
      }
  
      // Create expense record
      const expense = await db.query(
        `INSERT INTO expenses (entity_id, org_id, goal_id, amount, expense_category, description, expense_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          req.user.entity_id, 
          req.user.org_id, 
          goal_id, 
          amount, 
          expense_category, 
          description, 
          expense_date || new Date().toISOString().split('T')[0]
        ]
      );
  
      // Create withdrawal transaction for wallet deduction (if any)
      if (walletDeduction > 0) {
        await db.query(
          `INSERT INTO deposits (wallet_id, entity_id, org_id, amount, transaction_type, description) 
           VALUES ($1, $2, $3, $4, 'withdrawal', $5)`,
          [
            walletId, 
            req.user.entity_id, 
            req.user.org_id, 
            walletDeduction, 
            `Expense: ${description || expense_category}${goal_id ? ` (from wallet)` : ''}`
          ]
        );
      }
  
      // Add goal deduction description if applicable
      let responseMessage = 'Expense recorded successfully';
      if (goal_id) {
        if (goalDeduction > 0 && walletDeduction > 0) {
          responseMessage = `Expense recorded: ${goalDeduction} deducted from goal, ${walletDeduction} deducted from wallet`;
        } else if (goalDeduction > 0) {
          responseMessage = `Expense recorded: ${goalDeduction} deducted from goal savings`;
        }
      }
  
      res.status(201).json({
        message: responseMessage,
        expense: expense.rows[0],
        deduction_breakdown: {
          from_goal: goalDeduction,
          from_wallet: walletDeduction,
          total: amount
        }
      });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };


const getExpenses = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT e.*, sg.goal_name 
       FROM expenses e
       LEFT JOIN savings_goals sg ON e.goal_id = sg.goal_id
       WHERE e.entity_id = $1 
       ORDER BY e.expense_date DESC, e.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.entity_id, parseInt(limit), parseInt(offset)]
    );

    const totalResult = await db.query(
      'SELECT COUNT(*) FROM expenses WHERE entity_id = $1',
      [req.user.entity_id]
    );

    res.json({
      expenses: result.rows,
      total: parseInt(totalResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const startDate = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

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
      [req.user.entity_id, startDate, endDate]
    );

    res.json({
      summary: result.rows,
      period: { start_date: startDate, end_date: endDate }
    });
  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseSummary
};

