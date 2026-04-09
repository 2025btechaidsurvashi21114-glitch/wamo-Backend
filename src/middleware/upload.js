// src/middleware/upload.js
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const MAX_RESUME_MB = parseInt(process.env.MAX_RESUME_SIZE_MB || '5', 10);
const MAX_PHOTO_MB  = parseInt(process.env.MAX_PHOTO_SIZE_MB  || '2', 10);

// ── Ensure upload dirs exist ──────────────────────────────────────────────────
const RESUME_DIR = path.join(__dirname, '../../uploads/resumes');
const PHOTO_DIR  = path.join(__dirname, '../../uploads/photos');
const DOCS_DIR   = path.join(__dirname, '../../uploads/documents');

[RESUME_DIR, PHOTO_DIR, DOCS_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Storage factory ───────────────────────────────────────────────────────────
const makeStorage = (dir, prefix) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const ext    = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefix}-${unique}${ext}`);
    },
  });

// ── Resume upload (PDF only) ──────────────────────────────────────────────────
const resumeUpload = multer({
  storage: makeStorage(RESUME_DIR, 'resume'),
  limits:  { fileSize: MAX_RESUME_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Resume must be a PDF file.'));
  },
});

// ── Photo upload (images only) ────────────────────────────────────────────────
const photoUpload = multer({
  storage: makeStorage(PHOTO_DIR, 'photo'),
  limits:  { fileSize: MAX_PHOTO_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Profile photo must be an image file.'));
  },
});

// ── Document upload (PDF / images) ───────────────────────────────────────────
const documentUpload = multer({
  storage: makeStorage(DOCS_DIR, 'doc'),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF and image files are accepted.'));
  },
});

module.exports = { resumeUpload, photoUpload, documentUpload };
