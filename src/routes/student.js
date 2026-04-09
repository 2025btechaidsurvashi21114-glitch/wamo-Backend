// src/routes/student.js
const router      = require('express').Router();
const Student     = require('../models/Student');
const Application = require('../models/Application');
const Interview   = require('../models/Interview');
const Job         = require('../models/Job');
const Document    = require('../models/Document');
const { Activity } = require('../models/Interview');
const { resumeUpload, photoUpload, documentUpload } = require('../middleware/upload');
const path        = require('path');

// ── Helper: resolve student from header ──────────────────────────────────────
const getStudentId = (req) => req.headers['x-student-id'] || null;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/dashboard-summary
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard-summary', async (req, res) => {
  try {
    const sid = getStudentId(req);
    if (!sid) return res.status(401).json({ error: 'Student ID required.' });

    const student = await Student.findById(sid).lean();
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const [
      applications,
      interviews,
      totalJobs,
    ] = await Promise.all([
      Application.find({ student: sid }).lean(),
      Interview.find({ student: sid, scheduled_at: { $gte: new Date() } }).lean(),
      Job.countDocuments({ status: 'active' }),
    ]);

    const statusCounts = {};
    applications.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    const activeApps = applications.filter(a =>
      !['rejected', 'selected'].includes(a.status)
    ).length;

    return res.json({
      profileCompletion:    student.profileCompletion || 0,
      totalOpportunities:   totalJobs,
      activeApplications:   activeApps,
      upcomingInterviews:   interviews.length,
      selectionStatus:      statusCounts.selected || 0,
      applicationStatusCounts: statusCounts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/applications
// ─────────────────────────────────────────────────────────────────────────────
router.get('/applications', async (req, res) => {
  try {
    const sid   = getStudentId(req);
    const limit = parseInt(req.query.limit) || 20;
    if (!sid) return res.status(401).json({ error: 'Student ID required.' });

    const apps = await Application.find({ student: sid })
      .populate({ path: 'job', populate: { path: 'company', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const result = apps.map(a => ({
      _id:          a._id,
      status:       a.status,
      created_at:   a.createdAt,
      title:        a.job?.title,
      company_name: a.job?.company?.name,
    }));

    return res.json({ applications: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/interviews
// ─────────────────────────────────────────────────────────────────────────────
router.get('/interviews', async (req, res) => {
  try {
    const sid = getStudentId(req);
    if (!sid) return res.status(401).json({ error: 'Student ID required.' });

    const interviews = await Interview.find({
      student:      sid,
      scheduled_at: { $gte: new Date() },
    })
      .populate('job',     'title')
      .populate('company', 'name')
      .sort({ scheduled_at: 1 })
      .lean();

    const result = interviews.map(i => ({
      _id:          i._id,
      scheduled_at: i.scheduled_at,
      location:     i.location,
      mode:         i.mode,
      title:        i.job?.title,
      company_name: i.company?.name,
    }));

    return res.json({ interviews: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/recommendations  – active jobs student hasn't applied to
// ─────────────────────────────────────────────────────────────────────────────
router.get('/recommendations', async (req, res) => {
  try {
    const sid   = getStudentId(req);
    const limit = parseInt(req.query.limit) || 5;
    if (!sid) return res.status(401).json({ error: 'Student ID required.' });

    const applied = await Application.find({ student: sid }, 'job').lean();
    const appliedJobIds = applied.map(a => a.job);

    const jobs = await Job.find({
      status: 'active',
      _id:    { $nin: appliedJobIds },
    })
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const result = jobs.map(j => ({
      _id:          j._id,
      title:        j.title,
      company_name: j.company?.name,
      department:   j.department,
      min_cgpa:     j.min_cgpa,
      required_skills: j.required_skills,
      work_type:    j.work_type,
    }));

    return res.json({ recommendations: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/student/apply/:jobId
// ─────────────────────────────────────────────────────────────────────────────
router.post('/apply/:jobId', async (req, res) => {
  try {
    const sid   = getStudentId(req);
    const jobId = req.params.jobId;
    if (!sid) return res.status(401).json({ error: 'Student ID required.' });

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active')
      return res.status(404).json({ error: 'Job not found or closed.' });

    const existing = await Application.findOne({ student: sid, job: jobId });
    if (existing) return res.status(409).json({ error: 'Already applied.' });

    const app = await Application.create({ student: sid, job: jobId });

    await Activity.create({
      type:    'application_submitted',
      message: `Student applied to job: ${job.title}`,
      meta:    JSON.stringify({ applicationId: app._id }),
    });

    return res.status(201).json({ applicationId: app._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/student/profile
// PUT  /api/student/profile  (with optional file uploads)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const sid = getStudentId(req);
    if (!sid) return res.status(401).json({ error: 'Student ID required.' });
    const student = await Student.findById(sid, '-password').lean();
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    return res.json({ profile: student });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// Multi-file upload: resume (PDF) + photo (image)
const profileUpload = require('multer')({
  storage: require('multer').diskStorage({
    destination: (_req, file, cb) => {
      const dir = file.fieldname === 'resume'
        ? path.join(__dirname, '../../uploads/resumes')
        : path.join(__dirname, '../../uploads/photos');
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext    = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${file.fieldname}-${unique}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo',  maxCount: 1 },
]);

router.put('/profile', (req, res, next) => {
  profileUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const sid = getStudentId(req);
      if (!sid) return res.status(401).json({ error: 'Student ID required.' });

      const update = { ...req.body };

      if (req.files?.resume?.[0]) {
        update.resumeUrl  = `/uploads/resumes/${req.files.resume[0].filename}`;
        update.resumeName = req.files.resume[0].originalname;
        update.resumeSize = req.files.resume[0].size;
      }
      if (req.files?.photo?.[0]) {
        update.photoUrl = `/uploads/photos/${req.files.photo[0].filename}`;
      }

      const student = await Student.findByIdAndUpdate(sid, update, { new: true, runValidators: true });
      if (!student) return res.status(404).json({ error: 'Student not found.' });
      // re-save to trigger profileCompletion hook
      await student.save();
      return res.json({ message: 'Profile updated.', profileCompletion: student.profileCompletion });
    } catch (err2) {
      console.error(err2);
      return res.status(500).json({ error: 'Server error.' });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/student/documents
// POST /api/student/documents
// ─────────────────────────────────────────────────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const sid = getStudentId(req);
    if (!sid) return res.status(401).json({ error: 'Student ID required.' });
    const docs = await Document.find({ student: sid }).sort({ createdAt: -1 }).lean();
    return res.json({ documents: docs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/documents', (req, res, next) => {
  documentUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const sid = getStudentId(req);
      if (!sid) return res.status(401).json({ error: 'Student ID required.' });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

      const doc = await Document.create({
        student:  sid,
        name:     req.body.name || req.file.originalname,
        type:     req.body.type || 'other',
        url:      `/uploads/documents/${req.file.filename}`,
        size:     req.file.size,
        mimeType: req.file.mimetype,
      });
      return res.status(201).json({ document: doc });
    } catch (err2) {
      console.error(err2);
      return res.status(500).json({ error: 'Server error.' });
    }
  });
});

module.exports = router;
