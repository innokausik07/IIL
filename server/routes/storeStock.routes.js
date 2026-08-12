const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getList } = require('../controllers/storeStock.controller');

router.get('/', auth, getList);

module.exports = router;
