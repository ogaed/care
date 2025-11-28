const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { entity_name, user_name, primary_email, primary_telephone, password, org_id = 1 } = req.body;

    // Check if user exists
    const existingUser = await db.query(
      'SELECT user_name FROM entitys WHERE user_name = $1 OR primary_email = $2',
      [user_name, primary_email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const firstPassword = password.substring(0, 6); // Store first 6 chars for reference

    // Create user
    const result = await db.query(
      `INSERT INTO entitys (org_id, entity_name, user_name, primary_email, primary_telephone, 
       entity_password, first_password, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'user') 
       RETURNING entity_id, user_name, primary_email, role`,
      [org_id, entity_name, user_name, primary_email, primary_telephone, hashedPassword, firstPassword]
    );

    const token = jwt.sign(
      { userId: result.rows[0].entity_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { user_name, password } = req.body;

    const result = await db.query(
      `SELECT entity_id, user_name, entity_password, role, primary_email, primary_telephone 
       FROM entitys WHERE user_name = $1 OR primary_email = $1`,
      [user_name]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.entity_password);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.entity_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        entity_id: user.entity_id,
        user_name: user.user_name,
        role: user.role,
        primary_email: user.primary_email,
        primary_telephone: user.primary_telephone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT entity_id, user_name, primary_email, primary_telephone, role, created_at 
       FROM entitys WHERE entity_id = $1`,
      [req.user.entity_id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;