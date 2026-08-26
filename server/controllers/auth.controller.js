const db = require('../config/db');
const jwt = require('jsonwebtoken');

// POST /api/auth/login - Authenticate against `users` table
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username/Email and password are required.' });
  }

  try {
    const searchVal = username.trim();

    // Query the `users` table matching by full_name, email, or emp_id
    const [rows] = await db.execute(
      `SELECT id, full_name, email, password, emp_id, utype, owner, mobile, profile_img, status 
       FROM users 
       WHERE full_name = ? OR email = ? OR emp_id = ? 
       LIMIT 1`,
      [searchVal, searchVal, searchVal]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials. User not found.' });
    }

    const user = rows[0];

    // Check if user account is active
    if (user.status !== undefined && user.status !== null && String(user.status) !== '1') {
      return res.status(401).json({ status: 'error', message: 'Account is deactivated. Please contact Administrator.' });
    }

    // Compare password
    let passwordValid = false;
    if (String(user.password).trim() === String(password).trim()) {
      passwordValid = true;
    }

    if (!passwordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid password.' });
    }

    // Fetch allowed actions (if table exists)
    let allowedActions = [];
    try {
      const [actions] = await db.execute(
        "SELECT actabid FROM access_action_tab WHERE userid = ? AND status = '1'",
        [user.full_name || user.email]
      );
      allowedActions = actions.map(a => parseInt(a.actabid));
    } catch (e) {
      // access_action_tab is optional
    }

    const displayName = user.full_name || user.email || user.emp_id || 'User';

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        userid: displayName,
        full_name: user.full_name,
        email: user.email,
        emp_id: user.emp_id,
        utype: user.utype || '9',
        owner: user.owner,
        profile_img: user.profile_img || null
      },
      process.env.JWT_SECRET || 'innovatiview_secret_key',
      { expiresIn: '12h' }
    );

    return res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        userid: displayName,
        full_name: user.full_name,
        email: user.email,
        emp_id: user.emp_id,
        utype: user.utype || '9',
        owner: user.owner,
        profile_img: user.profile_img || null,
        allowedActions
      }
    });
  } catch (err) {
    console.error('Login error:', err.code, err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(500).json({ status: 'error', message: 'Cannot connect to database.' });
    }
    return res.status(500).json({ status: 'error', message: 'Server error during login: ' + err.message });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    let latestUser = {};
    if (req.user && req.user.id) {
      const [dbUser] = await db.execute(
        'SELECT id, full_name, email, emp_id, utype, owner, profile_img, status FROM users WHERE id = ? LIMIT 1',
        [req.user.id]
      );
      if (dbUser && dbUser.length > 0) {
        latestUser = dbUser[0];
      }
    }

    let allowedActions = [];
    try {
      const [actions] = await db.execute(
        "SELECT actabid FROM access_action_tab WHERE userid = ? AND status = '1'",
        [latestUser.full_name || req.user.userid || req.user.full_name]
      );
      allowedActions = actions.map(a => parseInt(a.actabid));
    } catch (e) {}

    return res.json({
      status: 'success',
      user: {
        ...req.user,
        ...latestUser,
        userid: latestUser.full_name || req.user.userid,
        profile_img: latestUser.profile_img || req.user.profile_img || null,
        allowedActions
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

// POST /api/auth/signup - Insert into `users` table
const signup = async (req, res) => {
  const { username, password, name, email, mobile } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE full_name = ? OR email = ? LIMIT 1',
      [username.trim(), email || username.trim()]
    );
    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'User already exists with this name or email.' });
    }

    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password, mobile, utype, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name || username.trim(), email || '', password, mobile || '', '9', '1']
    );

    res.json({ status: 'success', message: 'Signup successful! You can now log in.', id: result.insertId });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error: ' + error.message });
  }
};

module.exports = { login, me, signup };
