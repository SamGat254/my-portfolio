/**
 * Authentication Routes — JWT + bcrypt
 */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1', [email.toLowerCase()]
    );
    const admin = result.rows[0];
    if (!admin)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login event
    await pool.query(
      'INSERT INTO audit_log (admin_id, action, ip) VALUES ($1, $2, $3)',
      [admin.id, 'login', req.ip]
    );

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', require('../middleware/auth'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    const admin = result.rows[0];

    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    if (newPassword.length < 12)
      return res.status(400).json({ error: 'Password must be at least 12 characters' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, admin.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/setup (first run only — creates the admin account)
router.post('/setup', async (req, res) => {
  try {
    const count = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(count.rows[0].count) > 0)
      return res.status(403).json({ error: 'Admin already exists' });

    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 12)
      return res.status(400).json({ error: 'Invalid setup data' });

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      'INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3)',
      [name, email.toLowerCase(), hash]
    );
    res.json({ message: 'Admin account created successfully. Please login.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
