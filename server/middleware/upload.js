const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'movement_attachments');
const TMP_DIR = path.join(__dirname, '..', 'tmp');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Storage for image attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const cleanName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${cleanName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files (JPG, PNG, GIF, WEBP, BMP) are allowed.'), false);
};

// Image upload (for movement attachments)
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// CSV upload (for bulk operations)
const csvUpload = multer({ dest: TMP_DIR, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { upload, csvUpload };
