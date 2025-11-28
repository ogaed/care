const express = require('express');
const { createExpense, getExpenses, getExpenseSummary } = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createExpense);
router.get('/', authenticateToken, getExpenses);
router.get('/summary', authenticateToken, getExpenseSummary);

module.exports = router;