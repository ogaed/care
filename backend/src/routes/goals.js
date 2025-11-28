const express = require('express');
const { createGoal, getGoals, addToGoal, getGoalProgress } = require('../controllers/goalController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createGoal);
router.get('/', authenticateToken, getGoals);
router.post('/:goal_id/save', authenticateToken, addToGoal);
router.get('/:goal_id/progress', authenticateToken, getGoalProgress);

module.exports = router;
