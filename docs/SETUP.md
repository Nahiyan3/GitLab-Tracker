# Setup & Installation Guide

Simple guide to get GitLab Analytics running.

---

## Prerequisites

- Node.js v20+
- npm v9+
- PostgreSQL database (Neon DB recommended)
- GitLab Personal Access Token

---

## Quick Setup

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repository-url>
cd gitlab-final

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Create `server/.env`:**
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
GITLAB_API_TOKEN=your_gitlab_token
GITLAB_API_URL=https://gitlab.com/api/v4
SONARCLOUD_TOKEN=your_token_optional
SONARCLOUD_ORG=your_org_optional
GEMINI_API_KEY=your_key_optional
PORT=5000
CLIENT_URL=http://localhost:8080
```

> **Important:** Replace placeholder values with actual tokens. Features will not be accessible without valid credentials:
> - `GITLAB_API_TOKEN` - Required for all GitLab features
> - `SONARCLOUD_TOKEN` - Required for code quality metrics
> - `GEMINI_API_KEY` - Required for AI insights

**Create `client/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Application

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

### 4. Access

Open browser: **http://localhost:8080**

---

## First Use

1. Navigate to "All Projects"
2. Click "Sync from GitLab"
3. Select projects to track
4. Click "Refresh" to collect metrics

---

## Common Issues

**Port in use:**
```bash
# Change PORT in server/.env
PORT=5001
```

**Database connection failed:**
- Check DATABASE_URL format
- Verify database is accessible
- Ensure `?sslmode=require` is included

**GitLab API not working:**
- Verify token has scopes: `api`, `read_api`, `read_repository`
- Check token hasn't expired

**Frontend can't reach backend:**
- Verify backend is running on port 5000
- Check VITE_API_URL in client/.env

---

## Database Commands

```bash
cd server
npm run db:check     # Check database status
npm run db:verify    # Verify integrity
npm run db:fix       # Fix issues
```

