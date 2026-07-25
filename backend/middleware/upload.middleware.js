const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { sendError } = require('../utils/response');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types and their safe extensions
const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use crypto for stronger uniqueness, strip any path-traversal sequences
    const randomSuffix = crypto.randomBytes(16).toString('hex');
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || '.bin';
    cb(null, `note-${Date.now()}-${randomSuffix}${ext}`);
  },
});

// File filter — accept PDF only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10 MB default
  },
});

/**
 * Multer error handler — wraps multer errors into standard JSON responses
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File too large. Maximum size is 10MB.', 400);
    }
    return sendError(res, `Upload error: ${err.message}`, 400);
  }
  if (err) {
    return sendError(res, err.message, 400);
  }
  next();
};

module.exports = { upload, handleUploadError };
