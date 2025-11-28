const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT w.balance, w.total_saved, w.currency, w.updated_at 
       FROM wallets w 
       WHERE w.entity_id = $1`,
      [req.user.entity_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ wallet: result.rows[0] });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make deposit
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount, description = 'Savings deposit' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    // Get wallet ID
    const walletResult = await db.query(
      'SELECT wallet_id FROM wallets WHERE entity_id = $1',
      [req.user.entity_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const walletId = walletResult.rows[0].wallet_id;

    // Create deposit transaction
    const depositResult = await db.query(
      `INSERT INTO deposits (wallet_id, entity_id, org_id, amount, transaction_type, description) 
       VALUES ($1, $2, $3, $4, 'deposit', $5) 
       RETURNING deposit_id, amount, created_at`,
      [walletId, req.user.entity_id, req.user.org_id, amount, description]
    );

    res.status(201).json({
      message: 'Deposit successful',
      transaction: depositResult.rows[0]
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT deposit_id, amount, transaction_type, description, created_at 
       FROM deposits 
       WHERE entity_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.entity_id, limit, offset]
    );

    const totalResult = await db.query(
      'SELECT COUNT(*) FROM deposits WHERE entity_id = $1',
      [req.user.entity_id]
    );

    res.json({
      transactions: result.rows,
      total: parseInt(totalResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;