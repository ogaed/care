const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const walletRoutes = require('./src/routes/wallet');
const goalsRoutes = require('./src/routes/goals');
const expensesRoutes = require('./src/routes/expenses');
const adminRoutes = require('./src/routes/admin');
const smsRoutes = require('./src/routes/sms');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Debug route imports
console.log('Auth routes type:', typeof authRoutes);
console.log('Wallet routes type:', typeof walletRoutes);
console.log('Goals routes type:', typeof goalsRoutes);
console.log('Expenses routes type:', typeof expensesRoutes);
console.log('Admin routes type:', typeof adminRoutes);
console.log('SMS routes type:', typeof smsRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sms', smsRoutes);

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/wallet', walletRoutes);
// app.use('/api/goals', goalsRoutes);
// app.use('/api/expenses', expensesRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/sms', smsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MamaCare Funds API is running' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});