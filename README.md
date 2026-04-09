# WAMO Backend
### Node.js · Express · MongoDB (Mongoose)

Full backend API for the **WAMO – Where Ambition Meets Opportunity** placement platform.

---

## 📁 Project Structure

```
wamo-backend/
├── src/
│   ├── server.js              ← Entry point (Express app)
│   ├── config/
│   │   └── db.js              ← MongoDB connection
│   ├── models/
│   │   ├── Student.js         ← Student schema
│   │   ├── Company.js         ← Company schema
│   │   ├── Job.js             ← Job posting schema
│   │   ├── Application.js     ← Application + status tracking
│   │   ├── Interview.js       ← Interview + Activity log schemas
│   │   └── Document.js        ← Student document vault
│   ├── middleware/
│   │   └── upload.js          ← Multer file upload (resume/photo/docs)
│   └── routes/
│       ├── auth.js            ← /api/auth/*
│       ├── student.js         ← /api/student/*
│       ├── company.js         ← /api/company/*
│       ├── admin.js           ← /api/admin/*
│       └── jobs.js            ← /api/jobs (public)
├── uploads/
│   ├── resumes/               ← PDF resumes
│   ├── photos/                ← Profile photos
│   └── documents/             ← Vault documents
├── seed.js                    ← Demo data seeder
├── .env                       ← Environment variables
└── package.json
```

---

## ⚡ Quick Start

### 1 · Prerequisites
- **Node.js** v18+ 
- **MongoDB** running locally (`mongod`) OR a MongoDB Atlas URI

### 2 · Install dependencies
```bash
cd wamo-backend
npm install
```

### 3 · Configure environment
Edit `.env`:
```env
# Local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/wamo

# OR MongoDB Atlas
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/wamo

PORT=3001
JWT_SECRET=change_me_to_something_long_and_random
CORS_ORIGIN=http://localhost:3000
```

### 4 · (Optional) Seed demo data
```bash
node seed.js
```

### 5 · Start the server
```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

Server runs at **http://localhost:3001**

---

## 🗺️ API Reference

### Auth  `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/student` | Upsert student by email → `{ studentId }` |
| POST | `/company` | Upsert company by email → `{ companyId }` |
| POST | `/register` | Full registration with password |
| POST | `/login` | Email + password login |

---

### Student  `/api/student`
> Header: `X-Student-Id: <studentId>`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard-summary` | Stats: profile %, opportunities, applications |
| GET | `/applications` | Student's application list |
| GET | `/interviews` | Upcoming interviews |
| GET | `/recommendations` | Jobs not yet applied to |
| POST | `/apply/:jobId` | Apply to a job |
| GET | `/profile` | Get full profile |
| PUT | `/profile` | Update profile (multipart: `resume` PDF + `photo` image) |
| GET | `/documents` | List vault documents |
| POST | `/documents` | Upload a document (multipart: `file`) |

---

### Company  `/api/company`
> Header: `X-Company-Id: <companyId>`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard-summary` | Openings, applications, interviews, offers |
| GET | `/jobs` | Company's job listings |
| POST | `/jobs` | Post a new job |
| DELETE | `/jobs/:id` | Close a job |
| GET | `/applications` | All applicants across company's jobs |
| PATCH | `/applications/:id/status` | Update applicant status |
| GET | `/talent` | Browse all student profiles |
| POST | `/interviews` | Schedule an interview |

---

### Admin  `/api/admin`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard-summary` | Platform-wide KPIs |
| GET | `/analytics` | Chart data (placements, company engagement, branch stats) |
| GET | `/recent-activity` | Activity feed |
| GET | `/students` | All students |
| GET | `/companies` | All companies |
| GET | `/placements` | All offer/selected applications |
| GET | `/jobs` | All jobs |
| PATCH | `/applications/:id/status` | Override any application status |

---

### Jobs (Public)  `/api/jobs`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List active jobs (query: `skill`, `cgpa`, `limit`, `page`) |
| GET | `/:id` | Single job detail |

---

## 🗄️ MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `students` | Student profiles + profile completion % |
| `companies` | Recruiter/company accounts |
| `jobs` | Job postings with eligibility criteria |
| `applications` | Student ↔ Job with ATS status pipeline |
| `interviews` | Scheduled interviews with result tracking |
| `activities` | Admin activity feed |
| `documents` | Student document vault entries |

### Application Status Pipeline
```
applied → shortlisted → assessment → interview → offer → selected
                                                        ↘ rejected (any stage)
```

---

## 📂 File Uploads

Uploaded files are stored in `uploads/` and served statically:
- `GET /uploads/resumes/<filename>` – resume PDF
- `GET /uploads/photos/<filename>` – profile photo
- `GET /uploads/documents/<filename>` – vault documents

**Limits:**
- Resume: PDF only, 5 MB max
- Photo: images only, 2 MB max
- Documents: PDF/images, 10 MB max

---

## 🔌 Connecting to the Frontend

The frontend (`script.js`) already points to `http://localhost:3001`.  
Ensure both are running:

```bash
# Terminal 1 – backend
cd wamo-backend && npm run dev

# Terminal 2 – frontend (any static server)
cd wamo-frontend && npx serve .
# or just open index.html in a browser
```

---

## 🌐 MongoDB Atlas (Cloud)

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Add your IP to the allowlist
3. Copy the connection string into `.env`:
```env
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.abc12.mongodb.net/wamo?retryWrites=true&w=majority
```

---

## 🔒 Production Checklist

- [ ] Change `JWT_SECRET` to a long random string
- [ ] Set `CORS_ORIGIN` to your actual frontend domain
- [ ] Use MongoDB Atlas or a secured MongoDB instance
- [ ] Add rate limiting (`express-rate-limit`)
- [ ] Add proper JWT middleware to protect admin routes
- [ ] Use HTTPS (SSL certificate)
- [ ] Store uploads in S3 / Cloudinary instead of local disk
