const db = require('../config/database');

const createGoal = async (req, res) => {
  try {
    const { goal_name, goal_amount, goal_type = 'health', target_date } = req.body;

    if (!goal_name || !goal_amount || goal_amount <= 0) {
      return res.status(400).json({ error: 'Goal name and valid amount required' });
    }

    const result = await db.query(
      `INSERT INTO savings_goals (entity_id, org_id, goal_name, goal_amount, goal_type, target_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING goal_id, goal_name, goal_amount, amount_saved, goal_type, target_date, created_at`,
      [req.user.entity_id, req.user.org_id, goal_name, goal_amount, goal_type, target_date]
    );

    res.status(201).json({
      message: 'Savings goal created successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getGoals = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT goal_id, goal_name, goal_amount, amount_saved, goal_type, target_date, 
              is_active, created_at, updated_at 
       FROM savings_goals 
       WHERE entity_id = $1 
       ORDER BY created_at DESC`,
      [req.user.entity_id]
    );

    res.json({ goals: result.rows });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addToGoal = async (req, res) => {
  try {
    const { goal_id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    // Check if goal exists and belongs to user
    const goalCheck = await db.query(
      'SELECT goal_id, goal_amount, amount_saved FROM savings_goals WHERE goal_id = $1 AND entity_id = $2',
      [goal_id, req.user.entity_id]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalCheck.rows[0];
    const newAmountSaved = parseFloat(goal.amount_saved) + parseFloat(amount);

    // Update goal progress
    const result = await db.query(
      `UPDATE savings_goals 
       SET amount_saved = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE goal_id = $2 
       RETURNING goal_id, goal_name, goal_amount, amount_saved, goal_type`,
      [newAmountSaved, goal_id]
    );

    // Also update wallet
    const walletResult = await db.query(
      'SELECT wallet_id FROM wallets WHERE entity_id = $1',
      [req.user.entity_id]
    );

    if (walletResult.rows.length > 0) {
      const walletId = walletResult.rows[0].wallet_id;
      
      await db.query(
        `INSERT INTO deposits (wallet_id, entity_id, org_id, amount, transaction_type, description) 
         VALUES ($1, $2, $3, $4, 'deposit', $5)`,
        [walletId, req.user.entity_id, req.user.org_id, amount, `Savings for goal: ${result.rows[0].goal_name}`]
      );
    }

    res.json({
      message: 'Savings added to goal successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getGoalProgress = async (req, res) => {
  try {
    const { goal_id } = req.params;

    const result = await db.query(
      `SELECT goal_id, goal_name, goal_amount, amount_saved, goal_type, target_date,
              (amount_saved / goal_amount * 100) as progress_percentage
       FROM savings_goals 
       WHERE goal_id = $1 AND entity_id = $2`,
      [goal_id, req.user.entity_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ goal: result.rows[0] });
  } catch (error) {
    console.error('Get goal progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createGoal,
  getGoals,
  addToGoal,
  getGoalProgress
};
