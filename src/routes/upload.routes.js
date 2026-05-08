const express = require('express');
const multer = require('multer');
const { uploadImage } = require('../controllers/upload.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Store file in memory (buffer), max 5 MB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/', protect, upload.single('image'), uploadImage);

module.exports = router;
