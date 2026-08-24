const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createUser } = require('../controllers/users.controller');

// Setup multer for profile image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure uploads folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST /api/users/create
router.post('/create', upload.single('profileImg'), createUser);

module.exports = router;
