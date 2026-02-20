# WorkFlow – Zach's Personal Work Manager

## 🚀 Deploy to Phone in 5 Steps

### Step 1 – Set up locally

Make sure you have Node.js installed. Then:

```bash
git clone https://github.com/modikwezach-tech/workflow-app.git
cd workflow-app
npm install
```

### Step 2 – Add your API key

Create a file called `.env` in the project folder:

```
VITE_ANTHROPIC_API_KEY=sk-ant-your-new-key-here
```

> ⚠️ Never share this file or commit it to GitHub — it's already in .gitignore

### Step 3 – Push to GitHub

```bash
git init
git add .
git commit -m "Initial WorkFlow app"
git branch -M main
git remote add origin https://github.com/modikwezach-tech/workflow-app.git
git push -u origin main
```

### Step 4 – Deploy on Vercel (free)

1. Go to **vercel.com** and sign up with your GitHub account
2. Click **"New Project"** → import `workflow-app`
3. In **Environment Variables**, add:
   - Name: `VITE_ANTHROPIC_API_KEY`
   - Value: your API key
4. Click **Deploy** — done in ~60 seconds!

You'll get a URL like: `https://workflow-app-zach.vercel.app`

### Step 5 – Install on Huawei phone

1. Open **Chrome** on your Huawei
2. Go to your Vercel URL
3. Tap the **3-dot menu (⋮)** top right
4. Tap **"Add to Home screen"**
5. Tap **Add** — it's now on your home screen like a real app! 📱

---

## Features
- ✅ Task management with priorities & due dates
- 📅 Calendar view with task due dates
- ⏱ Time tracker with daily log
- 📊 Analytics with AI coaching
- 📧 AI email analyzer → auto-creates tasks

