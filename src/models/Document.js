// src/models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    student:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    name:      { type: String, required: true },
    type:      { type: String }, // 'marksheet' | 'certificate' | 'other'
    url:       { type: String, required: true },
    size:      { type: Number },
    mimeType:  { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
