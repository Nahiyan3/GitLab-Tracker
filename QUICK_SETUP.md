# 🚀 Quick Setup Guide for New Users

## Your Database is Now Fixed! ✅

All database issues have been resolved:
- ✅ 24 tables created
- ✅ All foreign keys working
- ✅ No orphaned records
- ✅ Missing `milestone_health_metrics` table added

## For Your Friend (New Setup)

### Step 1: Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd gitlab-final

# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

### Step 2: Setup Environment Variables

Create `server/.env` file:
```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# GitLab API
GITLAB_API_TOKEN=your_gitlab_personal_access_token
GITLAB_API_URL=https://gitlab.com/api/v4

# SonarCloud (Optional)
SONARCLOUD_TOKEN=your_sonarcloud_token
SONARCLOUD_ORG=your_org_name

# Gemini AI (Optional)
GEMINI_API_KEY=your_gemini_api_key

# Server Config
PORT=5000
CLIENT_URL=http://localhost:5173
```

Create `client/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start the Application

**Terminal 1 - Start Server:**
```bash
cd server
npm run dev
```

You should see:
```
✅ Database pool created successfully
✅ Database connected successfully
✅ Database tables initialized from schema.sql
✅ Issue metrics tables created/verified
✅ MR metrics tables created/verified
✅ Commit metrics tables created/verified
✅ DORA metrics tables created/verified
✅ Database integrity fixes applied
🚀 Server is running on http://localhost:5000
```

**Terminal 2 - Start Client:**
```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Verify Everything Works

1. Open http://localhost:5173
2. You should see the dashboard
3. Click "All Projects" → "Sync from GitLab"
4. Projects should load from GitLab

## 🐛 Troubleshooting

### Issue: Server won't start
**Check:**
```bash
cd server
node check-db.js
```

If you see missing tables, run:
```bash
node fix-db.js
```

### Issue: "DATABASE_URL not defined"
- Make sure `server/.env` exists
- Check that DATABASE_URL is spelled correctly
- Verify the connection string format

### Issue: "Cannot connect to database"
- Check your Neon database is active (not paused)
- Verify connection string includes `?sslmode=require`
- Test connection:
```bash
cd server
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### Issue: "GitLab API error"
- Verify GITLAB_API_TOKEN in `.env`
- Check token has `read_api` scope
- Test token: https://gitlab.com/api/v4/projects (with token header)

### Issue: Frontend can't connect to backend
- Check `client/.env` has correct `VITE_API_URL`
- Verify server is running on port 5000
- Check CORS settings in `server/src/index.ts`

## 📋 Verification Checklist

Before reporting issues, verify:

- [ ] Node.js v18+ installed (`node -v`)
- [ ] npm installed (`npm -v`)
- [ ] Both `.env` files created (server and client)
- [ ] Database connection string is correct
- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can access http://localhost:5000/api (should return JSON)

## 🔧 Maintenance Scripts

Located in `server/`:

```bash
# Check database health
node check-db.js

# Detailed database analysis
node check-db-detailed.js

# Fix database issues
node fix-db.js
```

## 📚 More Information

See `DATABASE_SETUP_GUIDE.md` for:
- Complete table list
- Migration system explanation
- Troubleshooting details
- Security best practices

## 🆘 Still Having Issues?

1. Run `node check-db.js` and share output
2. Check server console for error messages
3. Share relevant error logs
4. Verify all environment variables are set

## 🎉 Success!

Once everything is running:
1. Sync projects from GitLab
2. Track projects you want to monitor
3. View metrics and insights
4. Set up DORA metrics tracking

Enjoy your GitLab Analytics Dashboard! 🚀
