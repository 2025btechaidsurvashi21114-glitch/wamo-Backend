// src/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    job:     { type: mongoose.Schema.Types.ObjectId, ref: 'Job',     required: true },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'assessment', 'interview', 'offer', 'selected', 'rejected'],
      default: 'applied',
    },
    notes:      { type: String },
    updated_by: { type: String }, // 'company' | 'admin'
  },
  { timestamps: true }
);

// Unique: one student can apply to a job only once
applicationSchema.index({ student: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
