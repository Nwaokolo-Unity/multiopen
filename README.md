# MultiOpen

> One link. Every app. No auto-redirects.

## Deploy to Vercel in 5 minutes

### Step 1 — Push to GitHub
1. Create a new repo at github.com/new named `multiopen`
2. Open VS Code terminal and run:
```bash
cd web
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Nwaokolo-Unity/multiopen.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to vercel.com and click "Add New Project"
2. Import your `multiopen` GitHub repo
3. Set **Root Directory** to `web`
4. Add all environment variables from `.env` file
5. Click Deploy

### Step 3 — Set up database
After first deploy, run in Vercel terminal or locally:
```bash
npx prisma db push
npx prisma db seed
```

### Step 4 — Update BASE URL
Once Vercel gives you a URL (e.g. multiopen-xyz.vercel.app):
- Go to Vercel → Settings → Environment Variables
- Update `NEXT_PUBLIC_BASE_URL` and `NEXTAUTH_URL` to your real URL
- Redeploy

## Local Development
```bash
cd web
npm install
npx prisma db push
npx prisma db seed
npm run dev
```
Visit http://localhost:3000
Login: unity@zeroup.org / password123

## Tech Stack
- Next.js 14 (App Router)
- PostgreSQL on Neon
- Redis on Upstash
- Emails via Resend
- Deployed on Vercel
