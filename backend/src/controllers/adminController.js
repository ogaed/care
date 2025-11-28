const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Expense = require('../models/Expense');
const Wallet = require('../models/Wallet');

const getDashboardStats = async (req, res) => {
  try {
    const db = require('../config/database');
    
    // Get total users
    const usersResult = await db.query(
      'SELECT COUNT(*) as total_users FROM entitys WHERE org_id = $1 AND role = $2',
      [req.user.org_id, 'user']
    );

    // Get total deposits
    const depositsResult = await db.query(
      'SELECT COUNT(*) as total_deposits, COALESCE(SUM(amount), 0) as total_deposit_amount FROM deposits WHERE org_id = $1 AND transaction_type = $2',
      [req.user.org_id, 'deposit']
    );

    // Get total expenses
    const expensesResult = await db.query(
      'SELECT COUNT(*) as total_expenses, COALESCE(SUM(amount), 0) as total_expense_amount FROM expenses WHERE org_id = $1',
      [req.user.org_id]
    );

    // Get recent activity
    const recentDeposits = await Deposit.getAllDeposits(req.user.org_id, 5, 0);
    const recentExpenses = await Expense.getAllExpenses(req.user.org_id, 5, 0);

    res.json({
      stats: {
        total_users: parseInt(usersResult.rows[0].total_users),
        total_deposits: parseInt(depositsResult.rows[0].total_deposits),
        total_deposit_amount: parseFloat(depositsResult.rows[0].total_deposit_amount),
        total_expenses: parseInt(expensesResult.rows[0].total_expenses),
        total_expense_amount: parseFloat(expensesResult.rows[0].total_expense_amount)
      },
      recent_activity: {
        deposits: recentDeposits.deposits,
        expenses: recentExpenses.expenses
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers(req.user.org_id);
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllDeposits = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const deposits = await Deposit.getAllDeposits(
      req.user.org_id, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json(deposits);
  } catch (error) {
    console.error('Get all deposits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const expenses = await Expense.getAllExpenses(
      req.user.org_id, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json(expenses);
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const db = require('../config/database');
    
    // Get user basic info
    const userResult = await db.query(
      'SELECT entity_id, entity_name, user_name, primary_email, primary_telephone, role, created_at FROM entitys WHERE entity_id = $1 AND org_id = $2',
      [user_id, req.user.org_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user wallet
    const walletResult = await db.query(
      'SELECT * FROM wallets WHERE entity_id = $1',
      [user_id]
    );

    // Get user goals
    const goalsResult = await db.query(
      'SELECT * FROM savings_goals WHERE entity_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    // Get recent transactions
    const transactionsResult = await db.query(
      `SELECT * FROM deposits 
       WHERE entity_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [user_id]
    );

    res.json({
      user: userResult.rows[0],
      wallet: walletResult.rows[0] || null,
      goals: goalsResult.rows,
      recent_transactions: transactionsResult.rows
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

  
};

// Add these functions to your adminController.js

const getReports = async (req, res) => {
    try {
      const db = require('../config/database');
      
      // Get additional stats for reports
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // New users today
      const newUsersToday = await db.query(
        'SELECT COUNT(*) as count FROM entitys WHERE org_id = $1 AND role = $2 AND DATE(created_at) = $3',
        [req.user.org_id, 'user', today]
      );
  
      // New users this week
      const newUsersWeek = await db.query(
        'SELECT COUNT(*) as count FROM entitys WHERE org_id = $1 AND role = $2 AND created_at >= $3',
        [req.user.org_id, 'user', weekAgo]
      );
  
      // Active goals
      const activeGoals = await db.query(
        `SELECT COUNT(*) as count FROM savings_goals 
         WHERE org_id = $1 AND is_active = $2`,
        [req.user.org_id, 'active']
      );
  
      // Completed goals
      const completedGoals = await db.query(
        `SELECT COUNT(*) as count FROM savings_goals 
         WHERE org_id = $1 AND is_active = $2`,
        [req.user.org_id, 'completed']
      );
  
      res.json({
        new_users_today: parseInt(newUsersToday.rows[0].count),
        new_users_week: parseInt(newUsersWeek.rows[0].count),
        active_goals: parseInt(activeGoals.rows[0].count),
        completed_goals: parseInt(completedGoals.rows[0].count),
        total_goal_savings: 0 // You can calculate this from your goals data
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  const updateUserStatus = async (req, res) => {
    try {
      const { user_id } = req.params;
      const { action } = req.body;
      
      const db = require('../config/database');
      
      let status;
      switch (action) {
        case 'suspend':
          status = 'suspended';
          break;
        case 'activate':
          status = 'active';
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
  
      await db.query(
        'UPDATE entitys SET status = $1 WHERE entity_id = $2 AND org_id = $3',
        [status, user_id, req.user.org_id]
      );
  
      res.json({ message: `User ${action}ed successfully` });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
 
module.exports = {
    getDashboardStats,
    getAllUsers,
    getAllDeposits,
    getAllExpenses,
    getUserDetails,
    getReports,
    updateUserStatus
  };
