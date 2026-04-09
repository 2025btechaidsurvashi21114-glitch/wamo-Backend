// src/models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },
    industry: { type: String },
    website:  { type: String },
    logoUrl:  { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
