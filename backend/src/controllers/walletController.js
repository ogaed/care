const Wallet = require('../models/Wallet');
const Deposit = require('../models/Deposit');

const getWalletBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findByUserId(req.user.entity_id);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ wallet });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const makeDeposit = async (req, res) => {
  try {
    const { amount, description = 'Savings deposit' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = await Wallet.findByUserId(req.user.entity_id);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Create deposit transaction
    const deposit = await Deposit.create({
      wallet_id: wallet.wallet_id,
      entity_id: req.user.entity_id,
      org_id: req.user.org_id,
      amount,
      transaction_type: 'deposit',
      description
    });

    // Update wallet balance
    await Wallet.updateBalance(wallet.wallet_id, amount, true);

    res.status(201).json({
      message: 'Deposit successful',
      transaction: deposit
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const transactions = await Deposit.findByUserId(
      req.user.entity_id, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getWalletBalance,
  makeDeposit,
  getTransactions
};

