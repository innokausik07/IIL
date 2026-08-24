const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/users.controller');

// GET /api/users/ping
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'users route is working' });
});

// GET /api/users - List all users
router.get('/', getUsers);

// POST /api/users/create - Create new user
router.post('/create', createUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Toggle/Deactivate status
router.delete('/:id', deleteUser);

module.exports = router;
