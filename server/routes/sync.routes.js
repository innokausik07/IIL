const express = require('express');
const router = express.Router();
const { syncFromGoogleSheet } = require('../controllers/sync.controller');

// No auth — Google Apps Script calls this endpoint directly
// Access-Control headers already set in app.js
router.post('/', syncFromGoogleSheet);

module.exports = router;
