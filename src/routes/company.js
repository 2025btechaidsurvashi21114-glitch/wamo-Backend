// src/routes/company.js
const router      = require('express').Router();
const Company     = require('../models/Company');
const Job         = require('../models/Job');
const Application = require('../models/Application');
const Interview   = require('../models/Interview');
const Student     = require('../models/Student');
const { Activity } = require('../models/Interview');

// ── Helper ────────────────────────────────────────────────────────────────────
const getCompanyId = (req) => req.headers['x-company-id'] || null;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/company/dashboard-summary
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard-summary', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });

    const jobs = await Job.find({ company: cid }).lean();
    const jobIds = jobs.map(j => j._id);

    const [applications, interviews] = await Promise.all([
      Application.find({ job: { $in: jobIds } }).lean(),
      Interview.find({ company: cid, scheduled_at: { $gte: new Date() } }).lean(),
    ]);

    const activeOpenings    = jobs.filter(j => j.status === 'active').length;
    const totalApplications = applications.length;
    const scheduledInterviews = interviews.length;
    const offersExtended    = applications.filter(a => ['offer','selected'].includes(a.status)).length;

    return res.json({ activeOpenings, totalApplications, scheduledInterviews, offersExtended });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/company/jobs
// POST /api/company/jobs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/jobs', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });
    const jobs = await Job.find({ company: cid }).sort({ createdAt: -1 }).lean();
    return res.json({ jobs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/jobs', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });

    const { title, department, min_cgpa, required_skills, description, work_type, location, salary, deadline } = req.body;
    if (!title) return res.status(400).json({ error: 'Job title is required.' });

    const company = await Company.findById(cid);
    if (!company) return res.status(404).json({ error: 'Company not found.' });

    const job = await Job.create({
      company: cid, title, department, min_cgpa,
      required_skills, description, work_type, location, salary, deadline,
    });

    await Activity.create({
      type:    'job_posted',
      message: `${company.name} posted a new job: ${title}`,
      meta:    JSON.stringify({ jobId: job._id }),
    });

    return res.status(201).json({ jobId: job._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/company/jobs/:id  – close a job
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/jobs/:id', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company: cid },
      { status: 'closed' },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    return res.json({ message: 'Job closed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/company/applications  – all applicants for company's jobs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/applications', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });

    const jobs   = await Job.find({ company: cid }, '_id').lean();
    const jobIds = jobs.map(j => j._id);

    const apps = await Application.find({ job: { $in: jobIds } })
      .populate('student', 'name email branch cgpa primarySkills resumeUrl')
      .populate('job',     'title')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ applications: apps });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/company/applications/:id/status
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const cid    = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });
    const { status } = req.body;
    const valid  = ['applied','shortlisted','assessment','interview','offer','selected','rejected'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status, updated_by: 'company' },
      { new: true }
    );
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    await Activity.create({
      type:    'application_status_changed',
      message: `Application status updated to ${status}`,
      meta:    JSON.stringify({ applicationId: app._id, status }),
    });

    return res.json({ application: app });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/company/candidates  – alias for talent (frontend uses this)
router.get('/candidates', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });
    const students = await Student.find({}, 'name email branch cgpa primarySkills resumeUrl').lean();
    const candidates = students.map(s => ({
      _id: s._id, name: s.name, branch: s.branch,
      cgpa: s.cgpa, skills: s.primarySkills, resume_url: s.resumeUrl,
    }));
    return res.json({ candidates });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/company/talent  – all students (talent pool)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/talent', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });

    const students = await Student.find({}, 'name email branch cgpa primarySkills resumeUrl').lean();
    const candidates = students.map(s => ({
      _id:        s._id,
      name:       s.name,
      branch:     s.branch,
      cgpa:       s.cgpa,
      skills:     s.primarySkills,
      resume_url: s.resumeUrl,
    }));
    return res.json({ candidates });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/company/interviews  – schedule an interview
// ─────────────────────────────────────────────────────────────────────────────
router.post('/interviews', async (req, res) => {
  try {
    const cid = getCompanyId(req);
    if (!cid) return res.status(401).json({ error: 'Company ID required.' });

    const { applicationId, scheduled_at, location, mode, notes } = req.body;
    const app = await Application.findById(applicationId).populate('job');
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const interview = await Interview.create({
      application: app._id,
      student:     app.student,
      job:         app.job._id,
      company:     cid,
      scheduled_at,
      location,
      mode:        mode || 'online',
      notes,
    });

    // Update application status to 'interview'
    app.status     = 'interview';
    app.updated_by = 'company';
    await app.save();

    await Activity.create({
      type:    'interview_scheduled',
      message: `Interview scheduled for ${app.job.title}`,
      meta:    JSON.stringify({ interviewId: interview._id }),
    });

    return res.status(201).json({ interviewId: interview._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
