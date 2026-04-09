// src/routes/auth.js
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const Student  = require('../models/Student');
const Company  = require('../models/Company');
const { Activity } = require('../models/Interview');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/student
// Upsert student by email (demo / passwordless flow used by the frontend).
// Returns { studentId }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/student', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    let student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      student = await Student.create({ name: name || 'Student', email: email.toLowerCase() });
      await Activity.create({
        type: 'student_registered',
        message: `New student registered: ${student.name}`,
        meta: JSON.stringify({ studentId: student._id }),
      });
    }
    return res.json({ studentId: student._id, name: student.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/company
// Upsert company by email. Returns { companyId }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/company', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    let company = await Company.findOne({ email: email.toLowerCase() });
    if (!company) {
      company = await Company.create({ name: name || 'Company', email: email.toLowerCase() });
      await Activity.create({
        type: 'company_registered',
        message: `New company joined: ${company.name}`,
        meta: JSON.stringify({ companyId: company._id }),
      });
    }
    return res.json({ companyId: company._id, name: company.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register  – full registration with hashed password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { role, name, email, password } = req.body;
    if (!role || !email || !password)
      return res.status(400).json({ error: 'role, email and password are required.' });

    const hash = await bcrypt.hash(password, 10);
    const Model = role === 'company' ? Company : Student;

    const exists = await Model.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const doc = await Model.create({ name, email: email.toLowerCase(), password: hash });
    return res.status(201).json({ id: doc._id, name: doc.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login  – email + password login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { role, email, password } = req.body;
    const Model = role === 'company' ? Company : Student;

    const doc = await Model.findOne({ email: email.toLowerCase() });
    if (!doc || !doc.password)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, doc.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    return res.json({ id: doc._id, name: doc.name, role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
