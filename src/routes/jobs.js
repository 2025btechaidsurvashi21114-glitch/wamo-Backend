// src/routes/jobs.js  – public job listing (no auth needed)
const router = require('express').Router();
const Job    = require('../models/Job');

// GET /api/jobs  – list all active jobs
router.get('/', async (req, res) => {
  try {
    const { branch, cgpa, skill, limit = 20, page = 1 } = req.query;
    const filter = { status: 'active' };
    if (skill) filter.required_skills = { $regex: skill, $options: 'i' };

    const jobs = await Job.find(filter)
      .populate('company', 'name industry')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Optional CGPA filter client-side friendly
    const filtered = cgpa
      ? jobs.filter(j => !j.min_cgpa || parseFloat(j.min_cgpa) <= parseFloat(cgpa))
      : jobs;

    return res.json({ jobs: filtered, total: filtered.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company', 'name industry website').lean();
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    return res.json({ job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
