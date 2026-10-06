const path = require('path');
const multer = require('multer');

// Memory storage
const storage = multer.memoryStorage();

const MIME_TO_EXTS = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

// File filter (PDF, JPG, JPEG, PNG) — MIME and extension must agree
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = Object.keys(MIME_TO_EXTS);
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = MIME_TO_EXTS[file.mimetype];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExts && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

// Middleware wrapper for handling Multer errors cleanly
const handleSingleUpload = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);

    uploadSingle(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'fail',
            message: 'File size exceeds maximum allowed limit of 5 MB',
          });
        }
        if (err.code === 'INVALID_FILE_TYPE' || err.message.includes('Invalid file type')) {
          return res.status(400).json({
            status: 'fail',
            message: err.message,
          });
        }
        return res.status(400).json({
          status: 'fail',
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  };
};

module.exports = {
  upload,
  handleSingleUpload,
};
