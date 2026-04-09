// seed.js  – Run once to populate demo data
// Usage: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Student  = require('./src/models/Student');
const Company  = require('./src/models/Company');
const Job      = require('./src/models/Job');
const Application = require('./src/models/Application');
const { Activity } = require('./src/models/Interview');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Student.deleteMany({}),
    Company.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Activity.deleteMany({}),
  ]);
  console.log('🗑️   Cleared existing data');

  // ── Companies ─────────────────────────────────────────────────────────────
  const [amazon, microsoft, infosys] = await Company.insertMany([
    { name: 'Amazon',    email: 'recruit@amazon.com',    industry: 'E-Commerce / Cloud' },
    { name: 'Microsoft', email: 'recruit@microsoft.com', industry: 'Software / Cloud' },
    { name: 'Infosys',   email: 'recruit@infosys.com',   industry: 'IT Services' },
  ]);
  console.log('🏢  Companies created');

  // ── Jobs ─────────────────────────────────────────────────────────────────
  const [j1, j2, j3, j4] = await Job.insertMany([
    {
      company: amazon._id, title: 'SDE - I', department: 'Engineering',
      required_skills: 'Java, DSA, System Design', min_cgpa: '6.5',
      work_type: 'Full Time', location: 'Bangalore', status: 'active',
      description: 'Build scalable backend services for Amazon retail.',
    },
    {
      company: microsoft._id, title: 'Software Engineer', department: 'Azure',
      required_skills: 'C#, .NET, Azure, DSA', min_cgpa: '7.0',
      work_type: 'Full Time', location: 'Hyderabad', status: 'active',
      description: 'Join the Azure cloud team building next-gen infrastructure.',
    },
    {
      company: infosys._id, title: 'Systems Engineer', department: 'Delivery',
      required_skills: 'Java, SQL, Communication', min_cgpa: '6.0',
      work_type: 'Full Time', location: 'Pune', status: 'active',
      description: 'Work on enterprise client delivery projects.',
    },
    {
      company: amazon._id, title: 'Data Science Intern', department: 'AI/ML',
      required_skills: 'Python, ML, Pandas, NumPy', min_cgpa: '7.0',
      work_type: 'Internship', location: 'Remote', status: 'active',
      description: 'Work on ML models for product recommendations.',
    },
  ]);
  console.log('💼  Jobs created');

  // ── Students ──────────────────────────────────────────────────────────────
  const [s1, s2] = await Student.insertMany([
    {
      name: 'Rahul Sharma', email: 'rahul@example.com',
      fullName: 'Rahul Sharma', phone: '9876543210', city: 'Jaipur',
      college: 'MNIT Jaipur', degree: 'B.Tech', branch: 'Computer Science',
      gradYear: '2025', cgpa: '8.2',
      primarySkills: 'Java, Python, DSA',
      secondarySkills: 'HTML, CSS, JavaScript',
      tools: 'Git, VS Code, IntelliJ',
      projectTitle: 'Smart Placement Portal',
      projectDesc: 'AI-powered placement management system.',
      projectTech: 'React, Node.js, MongoDB',
      interestedRole: 'Backend Developer',
      workType: 'Full Time',
      bio: 'Passionate B.Tech student focused on backend development.',
    },
    {
      name: 'Priya Patel', email: 'priya@example.com',
      fullName: 'Priya Patel', phone: '9123456780', city: 'Ahmedabad',
      college: 'DAIICT', degree: 'B.Tech', branch: 'Information Technology',
      gradYear: '2025', cgpa: '7.8',
      primarySkills: 'Python, ML, Data Analysis',
      secondarySkills: 'SQL, Tableau',
      tools: 'Jupyter, Git, Pandas',
      projectTitle: 'Sentiment Analysis Dashboard',
      projectDesc: 'NLP-based sentiment analysis of social media data.',
      projectTech: 'Python, Flask, NLTK',
      interestedRole: 'AI / Data Science',
      workType: 'Internship',
      bio: 'Data science enthusiast with strong ML fundamentals.',
    },
  ]);
  console.log('🎓  Students created');

  // ── Applications ──────────────────────────────────────────────────────────
  await Application.insertMany([
    { student: s1._id, job: j1._id, status: 'shortlisted' },
    { student: s1._id, job: j3._id, status: 'applied' },
    { student: s2._id, job: j4._id, status: 'interview' },
    { student: s2._id, job: j2._id, status: 'applied' },
  ]);
  console.log('📋  Applications created');

  // ── Activity logs ─────────────────────────────────────────────────────────
  await Activity.insertMany([
    { type: 'student_registered',  message: 'Rahul Sharma registered as student' },
    { type: 'student_registered',  message: 'Priya Patel registered as student' },
    { type: 'company_registered',  message: 'Amazon joined as a partner company' },
    { type: 'job_posted',          message: 'Amazon posted: SDE - I' },
    { type: 'application_submitted', message: 'Rahul applied to SDE - I at Amazon' },
  ]);
  console.log('📰  Activity logs created');

  console.log('\n✅  Seed complete!\n');
  console.log('Demo credentials (passwordless login via email):');
  console.log('  Student  → rahul@example.com  | priya@example.com');
  console.log('  Company  → recruit@amazon.com | recruit@microsoft.com');
  console.log('  Admin    → any email with role=admin\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
