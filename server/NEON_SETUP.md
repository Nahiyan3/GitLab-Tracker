# Neon PostgreSQL Setup Guide

## Step 1: Create a Neon Account

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account (or sign in with GitHub)
3. Create a new project

## Step 2: Get Your Connection String

1. After creating a project, go to your project dashboard
2. Click on "Connection Details" or "Connection String"
3. Copy the connection string that looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/database?sslmode=require
   ```

## Step 3: Update Your .env File

1. Open `server/.env`
2. Replace `your_neon_connection_string_here` with your actual Neon connection string:
   ```
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/database?sslmode=require
   ```

## Step 4: Test the Connection

1. Start your server:
   ```bash
   cd server
   npm start
   ```

2. You should see:
   ```
   ✅ Database pool created successfully
   ✅ Database connected successfully at: [timestamp]
   🚀 Server is running on http://localhost:5000
   📡 API available at http://localhost:5000/api
   ```

## Step 5: Create Database Tables

Once connected, you'll need to create your tables. We'll do this next!

## Neon Features Used

- **Connection Pooling**: Efficiently manages database connections
- **SSL**: Secure connection to Neon (required)
- **Auto-scaling**: Neon automatically scales based on usage
- **Branching**: You can create database branches for development

## Troubleshooting

### Connection Error
- Check if `DATABASE_URL` is set correctly in `.env`
- Verify your Neon project is active
- Check if your IP is whitelisted (Neon free tier allows all IPs by default)

### SSL Error
- Make sure `ssl: { rejectUnauthorized: false }` is in the pool config
- Neon requires SSL connections

### Pool Errors
- Check if you have too many open connections
- Default max pool size is 20, adjust if needed
