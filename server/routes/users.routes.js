const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserRights,
  updateUserRights,
  getUserTypeRights,
  saveUserTypeRights,
  getSmartPresets
} = require('../controllers/users.controller');

// GET /api/users/ping
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'users route is working' });
});

// User-Type Rights Management Endpoints
router.get('/roles/smart-presets', getSmartPresets);
router.get('/usertypes/rights/:utypeId', getUserTypeRights);
router.post('/usertypes/rights/:utypeId', saveUserTypeRights);

// GET /api/users - List all users
router.get('/', getUsers);

// POST /api/users/create - Create new user
router.post('/create', createUser);

// GET /api/users/:id/rights - Get module/submodule rights for a user
router.get('/:id/rights', getUserRights);

// POST /api/users/:id/rights - Save module/submodule rights for a user
router.post('/:id/rights', updateUserRights);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Toggle/Deactivate status
router.delete('/:id', deleteUser);

module.exports = router;

