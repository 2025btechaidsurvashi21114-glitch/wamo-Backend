// src/models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    company:         { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title:           { type: String, required: true, trim: true },
    department:      { type: String },
    description:     { type: String },
    required_skills: { type: String },
    min_cgpa:        { type: String },
    work_type:       { type: String }, // Internship | Full Time | Remote
    location:        { type: String },
    salary:          { type: String },
    deadline:        { type: Date },
    status:          { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
