const express = require('express');
const router = express.Router();
const { login, me, signup } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

router.post('/login', login);
router.post('/signup', signup);
router.get('/me', auth, me);

module.exports = router;
