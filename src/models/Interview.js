// src/models/Interview.js
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student',     required: true },
    job:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job',         required: true },
    company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company',     required: true },
    scheduled_at: { type: Date, required: true },
    location:     { type: String },
    mode:         { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
    notes:        { type: String },
    result:       { type: String, enum: ['pending', 'pass', 'fail'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);


// ─────────────────────────────────────────────────────────────────────────────
// Activity Log  (admin feed)
// ─────────────────────────────────────────────────────────────────────────────
const activitySchema = new mongoose.Schema(
  {
    type:    { type: String, required: true }, // e.g. 'student_registered', 'job_posted'
    message: { type: String, required: true },
    meta:    { type: String },                 // JSON string for extra detail
  },
  { timestamps: true }
);

const Activity = mongoose.model('Activity', activitySchema);

module.exports.Activity = Activity;
