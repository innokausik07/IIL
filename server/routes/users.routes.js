const express = require('express');
const router = express.Router();
const { createUser } = require('../controllers/users.controller');

// GET /api/users/ping  — use this to verify the route is reachable on live server
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'users route is working' });
});

// POST /api/users/create
router.post('/create', createUser);

module.exports = router;
