# StudyForge Deployment Guide

## 🚀 Quick Deployment to Vercel + Render

### Prerequisites
- GitHub account
- Vercel account (free)
- Render account (free)
- Your code pushed to GitHub

---

## 📱 **Part 1: Deploy Frontend to Vercel**

### Step 1: Push to GitHub (if not already)
```bash
cd /Users/ameerhamza/Documents/LPCPS_TECHX/StudyForge
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your GitHub repository: `StudyForge`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `bun install && bun run build`
   - **Output Directory**: `dist`
   
5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
   (We'll get the backend URL in Part 2)

6. Click **Deploy**

**Result:** Frontend will be live at `https://studyforge-xyz.vercel.app`

---

## 🖥️ **Part 2: Deploy Backend to Render**

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect to your GitHub repo: `StudyForge`
3. Configure:
   - **Name**: `studyforge-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node (Bun will be installed via build command)
   - **Build Command**: `curl -fsSL https://bun.sh/install | bash && bun install`
   - **Start Command**: `bun run src/index.js`
   - **Instance Type**: Free

### Step 3: Add Environment Variables
Click **"Environment"** and add:
```
DATABASE_URL=<your-neon-database-url>
GROQ_API_KEY=<your-groq-api-key>
AI_PROVIDER=groq
GROQ_MODEL=groq/compound
JWT_SECRET=your-random-secret-key-change-this
TEACHER_ACCESS_CODE=TEACH2024
CLIENT_URL=https://your-vercel-app.vercel.app
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
YOUTUBE_API_KEY=<your-youtube-api-key>
PORT=3000
```

**Note:** Replace the placeholders with your actual values from `server/.env`

4. Click **"Create Web Service"**

**Result:** Backend will be live at `https://studyforge-backend.onrender.com`

---

## 🔗 **Part 3: Connect Frontend & Backend**

### Update Frontend Environment Variable on Vercel
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Update `VITE_API_URL` to: `https://studyforge-backend.onrender.com/api`
3. Redeploy frontend

### Update Backend CORS on Render
1. Go to Render dashboard → Your service → Environment
2. Update `CLIENT_URL` to: `https://your-vercel-app.vercel.app`
3. Service will auto-redeploy

---

## ✅ **Part 4: Verification**

### Test Your Deployment
1. Visit your Vercel URL
2. Try to sign up
3. Upload a PDF
4. Generate quiz
5. Check teacher dashboard

### If Something Breaks:
- Check Render logs: Dashboard → Service → Logs
- Check Vercel logs: Dashboard → Deployments → Click latest
- Verify environment variables are correct

---

## 🎯 **URLs to Share**

**Frontend (Vercel):** `https://your-app.vercel.app`  
**Backend (Render):** `https://studyforge-backend.onrender.com`

---

## ⚠️ **Important Notes**

### Render Free Tier Limitations:
- ⏰ Service spins down after 15 min of inactivity
- 🐌 First request after sleep takes ~50 seconds (cold start)
- 💡 Keep alive trick: Use a service like UptimeRobot to ping every 14 minutes

### For Hackathon Demo:
1. Visit your site 2-3 minutes before presenting
2. This "warms up" the backend
3. Demo will be fast!

---

## 🚀 **Quick Deploy Script**

Run this to prepare for deployment:
```bash
cd /Users/ameerhamza/Documents/LPCPS_TECHX/StudyForge

# Commit any changes
git add .
git commit -m "Ready for deployment"
git push origin main

# Then follow the steps above in Vercel and Render dashboards
```

---

**That's it! Your app will be live in ~10-15 minutes!** 🎉
