const jwt = require('jsonwebtoken');
const db  = require('../config/db');

const auth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, userid, emp_id, utype, iat, exp }

    // Enrich user with plant & organization info if not already in token
    try {
      const [users] = await db.execute(
        'SELECT id, emp_id, utype, plant_id, location_id, department_id, designation_id FROM users WHERE id = ? OR emp_id = ?',
        [decoded.id || decoded.userid, decoded.emp_id || decoded.userid]
      );
      if (users.length > 0) {
        req.user.plant_id = users[0].plant_id || users[0].location_id || null;
        req.user.department_id = users[0].department_id || null;
        req.user.designation_id = users[0].designation_id || null;
      }
    } catch (e) {}

    // Helper method to get accessible plant IDs based on user scope
    req.getAccessiblePlantIds = async () => {
      // Super Admin (utype 1 or 'ADMIN') has global access
      if (String(req.user.utype) === '1' || String(req.user.utype).toUpperCase() === 'ADMIN') {
        return null; // null means GLOBAL access
      }

      const userPlantId = req.user.plant_id;
      if (!userPlantId) return [];

      try {
        // Also fetch any child plants where parent_plant_id = userPlantId
        const [children] = await db.execute(
          'SELECT id FROM locations WHERE parent_plant_id = ? AND status != "D"',
          [userPlantId]
        );
        const childIds = children.map(c => c.id);
        return [userPlantId, ...childIds];
      } catch (e) {
        return [userPlantId];
      }
    };

    next();
  } catch (err) {
    return res.status(403).json({ status: 'error', message: 'Invalid or expired token.' });
  }
};

// Optional middleware to enforce role/utype
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
    }
    const userRole = String(req.user.utype);
    if (userRole === '1' || userRole.toUpperCase() === 'ADMIN' || allowedRoles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({ status: 'error', message: 'Access forbidden: Insufficient role permissions.' });
  };
};

module.exports = auth;
module.exports.auth = auth;
module.exports.requireRole = requireRole;

