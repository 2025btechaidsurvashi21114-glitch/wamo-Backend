// src/models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    // ── Auth ──────────────────────────────────────────────────────────────
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null }, // hashed; null = social / demo login

    // ── Basic Info ────────────────────────────────────────────────────────
    fullName: { type: String, trim: true },
    dob:      { type: String },
    age:      { type: Number },
    gender:   { type: String },
    phone:    { type: String },
    city:     { type: String },
    photoUrl: { type: String },       // path or URL to uploaded photo

    // ── Education ─────────────────────────────────────────────────────────
    college:  { type: String },
    degree:   { type: String },
    branch:   { type: String },
    gradYear: { type: String },
    cgpa:     { type: String },

    // ── Skills ────────────────────────────────────────────────────────────
    primarySkills:   { type: String },
    secondarySkills: { type: String },
    tools:           { type: String },

    // ── Project ───────────────────────────────────────────────────────────
    projectTitle: { type: String },
    projectDesc:  { type: String },
    projectTech:  { type: String },
    projectLink:  { type: String },

    // ── Experience ────────────────────────────────────────────────────────
    internship: { type: String },
    workExp:    { type: String },

    // ── Career Preferences ────────────────────────────────────────────────
    interestedRole: { type: String },
    workType:       { type: String },

    // ── Links ─────────────────────────────────────────────────────────────
    linkedin:  { type: String },
    github:    { type: String },
    portfolio: { type: String },

    // ── Resume ────────────────────────────────────────────────────────────
    resumeUrl:  { type: String },
    resumeName: { type: String },
    resumeSize: { type: Number },

    // ── Bio ───────────────────────────────────────────────────────────────
    bio: { type: String },

    // ── Profile completion (computed on save) ─────────────────────────────
    profileCompletion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compute profile completion % before save
studentSchema.pre('save', function (next) {
  const fields = [
    'fullName', 'email', 'phone', 'college', 'degree',
    'branch', 'cgpa', 'primarySkills', 'projectTitle', 'bio',
    'interestedRole', 'workType',
  ];
  const filled = fields.filter(k => this[k] && String(this[k]).trim()).length;
  this.profileCompletion = Math.round((filled / fields.length) * 100);
  next();
});

module.exports = mongoose.model('Student', studentSchema);
