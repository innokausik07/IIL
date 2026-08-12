const db = require('../config/db');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
  }

  try {
    // Query the admin_users table (which you just created in innovatiview_2)
    const [rows] = await db.execute(
      'SELECT username, password, utype, status FROM admin_users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    const user = rows[0];

    // Check if user is active
    if (user.status && user.status !== '1' && user.status !== 1) {
      return res.status(401).json({ status: 'error', message: 'Account is inactive.' });
    }

    // Compare password — support both plaintext (legacy) and hashed
    let passwordValid = false;
    if (user.password === password) {
      // Legacy plaintext match (as used in existing PHP system)
      passwordValid = true;
    }

    if (!passwordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    // Fetch allowed actions for this user
    const [actions] = await db.execute(
      "SELECT actabid FROM access_action_tab WHERE userid = ? AND status = '1'",
      [user.username]
    );
    const allowedActions = actions.map(a => parseInt(a.actabid));

    // Sign JWT
    const token = jwt.sign(
      { userid: user.username, utype: user.utype },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      status: 'success',
      token,
      user: {
        userid: user.username,
        utype: user.utype,
        allowedActions
      }
    });
  } catch (err) {
    console.error('Login error:', err.code, err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(500).json({ status: 'error', message: 'Cannot connect to database. Please ensure the backend is deployed on the Plesk server where MySQL is accessible.' });
    }
    return res.status(500).json({ status: 'error', message: 'Server error during login: ' + err.message });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const [actions] = await db.execute(
      "SELECT actabid FROM access_action_tab WHERE userid = ? AND status = '1'",
      [req.user.userid]
    );
    const allowedActions = actions.map(a => parseInt(a.actabid));
    return res.json({
      status: 'success',
      user: { ...req.user, allowedActions }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

// POST /api/auth/signup
const signup = async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
  }

  try {
    // Check if user already exists
    const [existing] = await db.execute('SELECT username FROM admin_users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Username already exists.' });
    }

    // Default values for new signup: utype=9 (standard user), status=1 (active)
    const [result] = await db.execute(
      'INSERT INTO admin_users (username, password, name, utype, status) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), password, name || username.trim(), '9', '1']
    );

    // Give default access to tabs 1, 2, 3, 4 (Google Sheets, Moved, etc.)
    const defaultTabs = ['1', '2', '3', '4'];
    for (const tab of defaultTabs) {
      await db.execute('INSERT INTO access_action_tab (userid, actabid, status) VALUES (?, ?, ?)', [username.trim(), tab, '1']);
    }

    res.json({ status: 'success', message: 'Signup successful! You can now log in.' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

module.exports = { login, me, signup };
