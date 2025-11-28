const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// SMS reminders placeholder
router.post('/reminders', authenticateToken, async (req, res) => {
  try {
    // This would integrate with Africa's Talking SMS API
    res.json({ message: 'SMS reminder feature - integrate with Africa\'s Talking API' });
  } catch (error) {
    console.error('SMS error:', error);
    res.status(500).json({ error: 'SMS service error' });
  }
});

module.exports = router;