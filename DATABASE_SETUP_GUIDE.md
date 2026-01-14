# Database Setup and Troubleshooting Guide

## ✅ Issues Fixed

Your database had the following issues that have been **FIXED**:

1. **Missing Table**: `milestone_health_metrics` was missing (now created)
2. **Foreign Key Constraints**: Added UNIQUE constraint to `projects.id` for proper foreign key relationships
3. **Data Integrity**: Verified no orphaned records exist

## 📊 Current Database Status

- **Total Tables**: 24 ✅
- **All Required Tables**: Present ✅
- **Foreign Keys**: Working correctly ✅
- **Data Integrity**: Verified ✅

## 🗄️ Complete Table List

### Core Tables
- ✅ `projects` - All projects (tracked and untracked)
- ✅ `tracked_project_snapshots` - Historical data for tracked projects
- ✅ `project_insights` - AI-generated insights

### Metrics Tables
- ✅ `issue_health_metrics` + `issue_metrics_history`
- ✅ `mr_health_metrics` + `mr_metrics_history`
- ✅ `commit_health_metrics` + `commit_metrics_history`
- ✅ `milestone_health_metrics` + `milestone_metrics`
- ✅ `sonarqube_maintainability_metrics` + `sonarqube_maintainability_history`
- ✅ `sonarqube_reliability_metrics` + `sonarqube_reliability_history`
- ✅ `sonarqube_security_metrics` + `sonarqube_security_history`

### DORA Metrics Tables
- ✅ `deployment_frequency`
- ✅ `lead_time_changes`
- ✅ `change_failure_rate`
- ✅ `time_to_restore_service`
- ✅ `weekly_dora_snapshots`

### Other Tables
- ✅ `members`
- ✅ `tracked_projects`

## 🔧 For New Setup (Fresh Database)

If someone needs to set up a fresh database, follow these steps:

### 1. Create Neon Database
```bash
# Go to https://neon.tech and create a new database
# Copy the connection string
```

### 2. Configure Environment
Create `.env` file in `server/` directory:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
GITLAB_API_TOKEN=your_gitlab_token
GITLAB_API_URL=https://gitlab.com/api/v4
SONARCLOUD_TOKEN=your_sonarcloud_token
SONARCLOUD_ORG=your_org
GEMINI_API_KEY=your_gemini_key
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
cd server
npm install
```

### 4. Initialize Database
```bash
# Start the server - it will automatically create all tables
npm run dev
```

The server will:
- ✅ Connect to database
- ✅ Run `schema.sql` to create base tables
- ✅ Run all migrations (001-020)
- ✅ Create indexes and constraints

### 5. Verify Database
```bash
# Run the check script
node check-db.js
```

Expected output:
```
📊 Existing Tables (24):
✅ All required tables exist!
```

## 🐛 Troubleshooting Common Issues

### Issue 1: "Table does not exist"
**Solution**: Run the server once to initialize tables
```bash
cd server
npm run dev
```

### Issue 2: "Foreign key constraint fails"
**Cause**: Missing UNIQUE constraint on `projects.id`

**Solution**: Run the fix script
```bash
node fix-db.js
```

### Issue 3: "Database connection failed"
**Check**:
1. DATABASE_URL is correct in `.env`
2. Neon database is active (not paused)
3. SSL is configured: `?sslmode=require`

### Issue 4: "Missing tables after initialization"
**Solution**: Check server logs for migration errors
```bash
# Look for warnings like:
# ⚠️ Issue metrics migration warning: ...
```

Then manually run failed migrations:
```bash
cd server/src/db/migrations
# Check which migration failed and run it manually
```

### Issue 5: "Row insert fails"
**Check for orphaned records**:
```bash
node check-db-detailed.js
```

Look for foreign key violations in the output.

## 🔄 Migration System

The application uses a sequential migration system:

1. **schema.sql** - Creates base tables
2. **001-020 migrations** - Add features incrementally

All migrations are idempotent (safe to run multiple times).

### Migration Files
```
migrations/
├── 004_create_issue_metrics.sql
├── 006_create_mr_metrics.sql
├── 009_create_commit_metrics.sql
├── 011_create_sonarqube_maintainability_metrics.sql
├── 013_create_sonarqube_reliability_metrics.sql
├── 014_create_sonarqube_security_metrics.sql
├── 017_create_milestone_metrics.sql
├── 019_create_dora_metrics_tables.sql
├── 020_create_weekly_dora_snapshots_table.sql
└── fix-database-issues.sql (new)
```

## 📝 Database Schema Overview

### Projects Table Structure
```sql
projects
├── uuid (PRIMARY KEY)  ← Main identifier
├── id (UNIQUE)         ← GitLab project ID
├── name
├── tracked (boolean)
├── sonar_project_key
└── ... other fields
```

### Foreign Key Pattern
Most tables use `project_id INTEGER` referencing `projects.id`:
- ✅ Faster lookups
- ✅ Matches GitLab API responses
- ✅ Easier to debug

Some tables use `project_uuid UUID` referencing `projects.uuid`:
- `project_insights`
- `tracked_project_snapshots`
- `members`

## ✨ Maintenance Scripts

### Check Database Health
```bash
cd server
node check-db.js
```

### Detailed Analysis
```bash
node check-db-detailed.js
```

### Fix Database Issues
```bash
node fix-db.js
```

### Clear and Repopulate DORA Metrics
```bash
cd src/db
node clear-and-repopulate-dora.ts
```

## 🎯 Best Practices

1. **Always backup before migrations**
   ```bash
   # Neon provides automatic backups
   # Or use pg_dump for manual backup
   ```

2. **Test migrations on dev first**
   - Use a separate Neon database for development

3. **Monitor migration logs**
   - Check for ⚠️ warnings during server startup

4. **Verify after changes**
   ```bash
   node check-db.js
   ```

5. **Keep migrations idempotent**
   - Use `CREATE TABLE IF NOT EXISTS`
   - Use `DO $$ BEGIN ... IF NOT EXISTS ... END $$`

## 📞 Getting Help

If you encounter issues:

1. Run `node check-db.js` and share output
2. Check server logs for migration errors
3. Verify DATABASE_URL is correct
4. Ensure Neon database is not paused
5. Try running `node fix-db.js`

## 🔐 Security Notes

- ✅ Never commit `.env` files
- ✅ Use read-only connection strings for analytics
- ✅ Rotate tokens regularly
- ✅ Enable SSL for all database connections
- ✅ Use environment-specific databases (dev/staging/prod)
