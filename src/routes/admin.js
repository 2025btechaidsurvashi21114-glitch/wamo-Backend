// src/routes/admin.js
const router      = require('express').Router();
const Student     = require('../models/Student');
const Company     = require('../models/Company');
const Job         = require('../models/Job');
const Application = require('../models/Application');
const Interview   = require('../models/Interview');
const { Activity } = require('../models/Interview');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard-summary
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard-summary', async (req, res) => {
  try {
    const [
      totalStudents,
      partnerCompanies,
      activeDrives,
      applications,
    ] = await Promise.all([
      Student.countDocuments(),
      Company.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Application.find().lean(),
    ]);

    const selected     = applications.filter(a => a.status === 'selected').length;
    const total        = applications.length;
    const placementRate = total > 0 ? Math.round((selected / totalStudents) * 100) : 0;

    // Student readiness: avg profile completion
    const students = await Student.find({}, 'profileCompletion').lean();
    const avgReadiness = students.length
      ? Math.round(students.reduce((s, st) => s + (st.profileCompletion || 0), 0) / students.length)
      : 0;

    const offers          = applications.filter(a => ['offer','selected'].includes(a.status)).length;
    const offerAcceptance = offers > 0 ? Math.round((selected / offers) * 100) : 0;

    return res.json({
      totalStudents,
      partnerCompanies,
      placementRate,
      activeDrives,
      studentReadinessIndex: avgReadiness,
      offerAcceptanceRate:   offerAcceptance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics
// ─────────────────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    // Live placement metrics – selected applications grouped by month
    const applications = await Application.find({ status: 'selected' })
      .populate('job', 'title')
      .lean();

    const monthMap = {};
    applications.forEach(a => {
      const d     = new Date(a.createdAt);
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    const livePlacementMetrics = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, placed_count]) => ({ month, placed_count }));

    // Company engagement – applications per company
    const allApps = await Application.find()
      .populate({ path: 'job', populate: { path: 'company', select: 'name' } })
      .lean();

    const compMap = {};
    allApps.forEach(a => {
      const name = a.job?.company?.name || 'Unknown';
      compMap[name] = (compMap[name] || 0) + 1;
    });
    const companyEngagement = Object.entries(compMap)
      .map(([company_name, applications_count]) => ({ company_name, applications_count }))
      .sort((a, b) => b.applications_count - a.applications_count)
      .slice(0, 6);

    // Branch-wise placements
    const selected = await Application.find({ status: 'selected' })
      .populate('student', 'branch')
      .lean();

    const branchMap = {};
    selected.forEach(a => {
      const branch = a.student?.branch || 'Unknown';
      branchMap[branch] = (branchMap[branch] || 0) + 1;
    });
    const branchWisePlacement = Object.entries(branchMap)
      .map(([branch, placed_count]) => ({ branch, placed_count }))
      .sort((a, b) => b.placed_count - a.placed_count);

    return res.json({ livePlacementMetrics, companyEngagement, branchWisePlacement });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/recent-activity
// ─────────────────────────────────────────────────────────────────────────────
router.get('/recent-activity', async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      activities: activities.map(a => ({
        ...a,
        created_at: a.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/students
// ─────────────────────────────────────────────────────────────────────────────
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find({}, '-password').sort({ createdAt: -1 }).lean();
    return res.json({ students });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/companies
// ─────────────────────────────────────────────────────────────────────────────
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find({}, '-password').sort({ createdAt: -1 }).lean();
    return res.json({ companies });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/placements  – all selected applications
// ─────────────────────────────────────────────────────────────────────────────
router.get('/placements', async (req, res) => {
  try {
    const apps = await Application.find({ status: { $in: ['offer','selected'] } })
      .populate('student', 'name branch')
      .populate({ path: 'job', populate: { path: 'company', select: 'name' } })
      .sort({ updatedAt: -1 })
      .lean();

    const placements = apps.map(a => ({
      _id:          a._id,
      status:       a.status,
      student_name: a.student?.name,
      branch:       a.student?.branch,
      company_name: a.job?.company?.name,
      job_title:    a.job?.title,
    }));

    return res.json({ placements });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/jobs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ jobs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/applications/:id/status  – admin can override any status
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['applied','shortlisted','assessment','interview','offer','selected','rejected'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status, updated_by: 'admin' },
      { new: true }
    );
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    return res.json({ application: app });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
