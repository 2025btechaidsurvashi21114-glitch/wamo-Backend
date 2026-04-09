# WAMO Backend Deployment Guide

## Quick Deployment to Render

### Step 1: Set Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click "Create a new project"
4. Click "Create a Deployment" → Choose **M0 (Free)** tier
5. Select your region (closest to you or Render deployment)
6. Click "Create Deployment"
7. Set username and password for database user
8. In "Network Access," click "Add IP Address" → **Allow from anywhere** (0.0.0.0/0)
9. Go to "Databases" → Click "Connect" → Choose "Drivers"
10. Copy the connection string that looks like:
    ```
    mongodb+srv://username:password@cluster.mongodb.net/wamo-db?retryWrites=true&w=majority
    ```
11. Replace `username`, `password`, and `wamo-db` (database name) in the URI

### Step 2: Push Code to GitHub

```bash
# Initialize git if not done
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/wamo-backend.git
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to [Render.com](https://render.com)
2. Sign up/log in with your GitHub account
3. Click **"New"** → **"Web Service"**
4. Choose your **wamo-backend** repository
5. Fill in deployment settings:
   - **Name:** `wamo-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Region:** Select closest region
   - **Plan:** Free tier (good for testing)

6. **Add Environment Variables** (under "Environment"):
   - Click **"Add Environment Variable"**
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://username:password@cluster.mongodb.net/wamo-db?retryWrites=true&w=majority`
   - Name: `NODE_ENV`
   - Value: `production`

7. Click **"Create Web Service"**
8. Wait for deployment (2-3 minutes)
9. Your API will be available at: `https://wamo-backend.onrender.com` (or similar)

### Step 4: Test Your API

```bash
# Test health endpoint
curl https://wamo-backend.onrender.com/health
```

### Step 5: Connect Your Frontend

Update your frontend API URL in the React/Expo app:
```javascript
const API_BASE_URL = 'https://wamo-backend.onrender.com';
```

### Important Notes

⚠️ **Render Free Tier Limitations:**
- Spins down after 15 minutes of inactivity (cold starts)
- Limited to 0.5 GB RAM
- For production, upgrade to Starter plan ($7/month)

⚠️ **File Uploads:**
- The `/uploads` folder is temporary on Render
- Files are deleted when the service redeploys
- **Solution:** Use cloud storage (AWS S3, Cloudinary, Firebase Storage)

## Troubleshooting

### Error: Connection refused
- Check MongoDB URI is correct
- Ensure IP whitelist includes Render's IPs (use 0.0.0.0/0)

### Error: Cannot find module
- Ensure all dependencies are in `package.json`
- Run `npm install` locally first

### Cold start takes 30+ seconds
- Normal for free tier
- Upgrade plan or use paid tier to avoid

## Next Steps

1. Set up cloud storage for file uploads
2. Add authentication with JWT secrets
3. Set up email notifications (SendGrid, etc.)
4. Monitor logs in Render dashboard
