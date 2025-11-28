// Update your admin.js routes
const express = require('express');
const { 
  getDashboardStats, 
  getAllUsers, 
  getAllDeposits, 
  getAllExpenses, 
  getUserDetails,
  getReports,
  updateUserStatus
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/deposits', getAllDeposits);
router.get('/expenses', getAllExpenses);
router.get('/reports', getReports);
router.get('/users/:user_id', getUserDetails);
router.patch('/users/:user_id', updateUserStatus);

module.exports = router;