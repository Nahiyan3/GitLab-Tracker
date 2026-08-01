# User Guide - GitLab Project Analytics

This guide will walk you through using the GitLab Project Analytics application, from initial setup to viewing insights.

## Table of Contents
- [Getting Started](#getting-started)
- [Part 1: Project Syncing and Tracking](#part-1-project-syncing-and-tracking)
  - [Step 1: Syncing Projects from GitLab](#step-1-syncing-projects-from-gitlab)
  - [Step 2: Tracking Projects](#step-2-tracking-projects)
  - [Step 3: Viewing Tracked Projects](#step-3-viewing-tracked-projects)
  - [Step 4: Exploring Project Details](#step-4-exploring-project-details)
- [Part 2: AI-Powered Insights](#part-2-ai-powered-insights)
  - [Step 5: Fill Out User Survey](#step-5-fill-out-user-survey)
  - [Step 6: Generate and View AI Insights](#step-6-generate-and-view-ai-insights)
  - [Step 7: Project Insights Overview](#step-7-project-insights-overview-all-projects)
  - [Step 8: Dashboard Overview](#step-8-dashboard-overview)
- [Part 3: Health Metrics](#part-3-health-metrics)
  - [Step 9: Refreshing and Viewing Health Metrics](#step-9-refreshing-and-viewing-health-metrics)
- [Part 4: DORA Metrics](#part-4-dora-metrics)
  - [Step 10: Viewing DORA Metrics](#step-10-viewing-dora-metrics)
- [Additional Features](#additional-features)

---

## Getting Started

Before you begin, ensure that:
1. The application is running (both client and server)
2. Your GitLab credentials are configured
3. Database is properly set up

Once the application is running, open your browser and navigate to the application URL (typically `http://localhost:8080`).

---

## Part 1: Project Syncing and Tracking

This section covers how to fetch projects from GitLab and set up tracking for monitoring.

---

## Step 1: Syncing Projects from GitLab

### First Time Setup

1. **Navigate to All Projects Page**
   - From the sidebar, click on **"All Projects"**
   - You'll see an empty page (if this is your first time) or a list of previously synced projects

2. **Click "Sync from GitLab" Button**
   - Look for the **"Sync from GitLab"** button at the top of the page
   - Click this button to fetch projects from your GitLab instance

3. **What Happens Next:**
   - **First sync:** The application will fetch **all projects** from your GitLab account and display them on the page
   - All fetched projects are automatically **stored in the database**
   - A success message will appear confirming the sync

4. **Subsequent Syncs:**
   - When you click **"Sync from GitLab"** again in the future:
     - The application will check for **new projects** added to your GitLab
     - Only **new projects** will be added to the database
     - Existing projects will remain unchanged

5. **Individual Syncs:**
   - Each project has an individual sync button 
   - Sometimes members aren't fetched correctly due to high api calls, This can help in that case

### What You'll See on All Projects Page

Each project card displays:
- **Project Name**
- **Group**
- **Last Activity Date**
- **Visibility** (Public/Private/Internal)
- **Action Buttons:**
  - **"Track"** button - To start tracking this project
- **Number of Members** - Clicking on which will show the member list 

---

## Step 2: Tracking Projects

### How to Track a Project

1. **From the All Projects Page:**
   - Browse through the list of synced projects
   - Find the project you want to track
   - Click the **"Track"** button on the project card

2. **What Happens:**
   - The project is marked as "tracked" in the database
   - The **"Track"** button may change to **"Untrack"** or become disabled
   - A success notification appears

3. **Track Multiple Projects:**
   - You can track as many projects as you need
   - Simply click **"Track"** on each project card you want to monitor

---

## Step 3: Viewing Tracked Projects

1. **Navigate to Tracked Projects Page:**
   - From the sidebar, click on **"Tracked Projects"**
   - Initially, you'll see your tracked projects but **without live data**

2. **Fetch Project Data from GitLab:**
   - **Important:** You must click **"Refresh All"** button at the top to fetch fresh data from GitLab
   - This creates new snapshots for all tracked projects
   - Alternatively, use the **individual sync button** (refresh icon) for each project to update them one by one

3. **What You'll See in the Table:**
   The tracked projects are displayed in a comprehensive table showing:
   
   - **Project Name** - Name and group path
   - **SonarQube Metrics** (if configured):
     - Security High issues
     - Security Blocker issues
     - Reliability High issues
     - Reliability Blocker issues
     - Maintainability High issues
     - Maintainability Blocker issues
   - **Open Issues** - Number of currently open issues (highlighted in red if > 20)
   - **Open MRs** - Number of open merge requests
   - **Open Milestones** - Number of active milestones
   - **Last Updated** - Time since last activity

4. **Available Actions for Each Project:**
   
   - **AI Button** (Sparkles icon ✨) - Generate AI-powered insights for the project
   - **"View"** button - Opens detailed project metrics page
   - **DORA Metrics button** (Chart icon 📊) - Opens DORA metrics input page
   - **Refresh button** (Circular arrow 🔄) - Syncs individual project data from GitLab
   - **External Link** (Arrow icon ↗️) - Opens project in GitLab in a new tab(Not implemented)

---

## Step 4: Exploring Project Details

1. **Open Project Details:**
   - From either **All Projects** or **Tracked Projects** page
   - Click the **"View"** button on any project card

2. **Navigate Between Tabs:**
   The project details page has multiple tabs at the top. Switch between them to see different information.

### Overview Tab

**What You'll See:**
- **Project Overview:**
  - Full project description
  - Creation and last activity dates
  - Repository statistics

- **Metrics Dashboard:**
  - **Commit Metrics** - Latest commits, frequency, contributors
  - **Issue Metrics** - Open/closed issues, resolution time
  - **Merge Request Metrics** - Open/merged MRs, review time
  - **Milestone Metrics** - Active milestones, progress

- **Code Quality Metrics (if SonarQube is configured):**
  - **Maintainability** - Code smells, technical debt
  - **Reliability** - Bugs, bug rating
  - **Security** - Vulnerabilities, security hotspots

**Refresh Data:**
- Each metric card may have a **"Refresh"** button
- Click to fetch the latest data from GitLab

### Metrics Tab

Click on the **"Metrics"** tab to see quality and performance trends.

**What You'll See:**
- **Quality Score Trends Chart** - Historical progression of AI insight scores (detailed explanation in Step 8)
- **Health Score Trends** - Historical view of project health metrics
- **Score Breakdown** - Visual breakdown of different quality categories

---

## Part 2: AI-Powered Insights

This section explains how to use AI to analyze your projects and get actionable recommendations.

---

## Step 5: Fill Out User Survey

**Important:** Before generating AI insights, you must complete the user survey for your project.

1. **Navigate to All Projects Page:**
   - From the sidebar, click on **"All Projects"**

2. **Click the "User Survey" Button:**
   - At the top-right of the page, you'll see a **"User Survey"** button
   - Click it to open the survey form in a new tab

3. **Complete the Survey:**
   - The survey asks about various aspects of your project:
     - **Code Review Practices** - How thorough are code reviews?
     - **Technical Debt** - Current state of technical debt
     - **Test Quality** - Test coverage and quality
     - **Documentation** - Documentation completeness
     - **Deployment Process** - Deployment frequency and reliability
     - **Dependencies** - Dependency management practices
     - **Team Morale & Velocity** - Team productivity and satisfaction
   
4. **Submit the Survey:**
   - Fill out all sections honestly and accurately
   - Submit the form
   - **Note:** You need to complete this survey **once per project** before generating AI insights

---

## Step 6: Generate and View AI Insights

After completing the user survey, you can generate AI-powered insights for your projects.

### Accessing AI Insights

1. **Navigate to Tracked Projects Page:**
   - From the sidebar, click on **"Tracked Projects"**
   - Ensure you've clicked **"Refresh All"** to have the latest project data

2. **Click the AI Button (✨ Sparkles Icon):**
   - Find the project you want to analyze
   - Click the **AI button** (sparkles icon) in the Actions column
   - This will take you to the Project Insights page

### First Time - Generate Insights

If insights haven't been generated yet for this project:

1. **You'll see:**
   - A message: **"No Insights Generated Yet"**
   - Instructions to click the "Generate Insights" button

2. **Click "Generate Insights" Button:**
   - At the top-right of the page
   - The AI will analyze:
     - Your survey responses (70% weight)
     - GitLab metrics (issues, MRs, commits)
     - SonarCloud code quality data (30% weight)
   - This process may take 10-30 seconds

3. **Wait for Generation:**
   - A loading spinner will appear
   - The insights are being generated and saved to the database

### Viewing Generated Insights

Once insights are generated (or if they already exist), you'll see:

#### 1. **Summary Score Cards**

Four key metrics at the top:

- **User Score** (0-5.0)
  - Based on your survey responses
  - Reflects subjective project health
  
- **API Score** (0-5.0)
  - Calculated from GitLab + SonarCloud metrics
  - Objective technical measurements
  
- **Combined Score** (0-5.0)
  - Weighted average: 70% User Score + 30% API Score
  - Overall project health indicator
  
- **Status Interpretation**
  - Text description of project health
  - Examples: "Excellent Performance", "Needs Attention", "Critical Issues"

#### 2. **Section Scores Table**

Detailed breakdown of 7-8 key areas:

| Section | What It Shows |
|---------|---------------|
| **Code Review** | Review thoroughness, participation, quality |
| **Technical Debt** | Accumulated debt, refactoring needs |
| **Test Quality** | Test coverage, test reliability |
| **Documentation** | Documentation completeness, quality |
| **Deployment** | Deployment frequency, reliability |
| **Dependencies** | Dependency management, update frequency |
| **Team Morale** | Team productivity, satisfaction, velocity |

**Each section displays:**
- **Section Name**
- **Score** (0-5.0 with color coding):
  - 🟢 Green (4.0-5.0) - Excellent
  - 🔵 Blue (3.0-3.99) - Good
  - 🟡 Yellow (2.0-2.99) - Needs Attention
  - 🔴 Red (0-1.99) - Critical
- **Analysis** - Brief explanation of the score
- **Recommendations** - Actionable steps to improve
- **Expand/Collapse** - Click to see all recommendations

#### 3. **Areas Needing Improvement**

Sections with low scores show:
- **Current Issues** - What's wrong
- **Detailed Recommendations** - How to fix it
- Click the expand button (▼) to see all recommendations

#### 4. **Detailed Calculations**

At the bottom:
- Shows the math behind each score
- Explains how User Score and API Score are calculated
- Transparency into the scoring algorithm

### Re-generating Insights

- Click **"Generate Insights"** again anytime to refresh the analysis
- Useful after:
  - Making improvements to your project
  - Filling out a new survey with updated information
  - Significant changes in GitLab metrics

---

## Step 7: Project Insights Overview (All Projects)

After generating insights for multiple projects, you can view them all in one place.

1. **Navigate to Project Insights Page:**
   - From the sidebar, click on **"Project Insights"**
   - This shows all projects that have AI insights generated

2. **What You'll See:**
   - A list of **all projects with generated insights**
   - Each project displays:
   
     **Quality Metrics Grid:**
     - Code Review score
     - Technical Debt score
     - Test Quality score
     - Documentation score
     - Deployment score
     - Dependencies score
     - Team Morale score
     - API Score
     - **Combined Score** (highlighted)
   
     **Spider Chart (Radar Visualization):**
     - Visual representation of all 9 metrics
     - Shows project strengths and weaknesses at a glance
     - Color-coded from red (poor) to green (excellent)
     - Helps identify patterns across all quality dimensions

3. **Actions Available:**
   - **"View Details"** button - Opens the full project details page
   - **"Refresh"** button - Reloads all project insights from database

4. **Understanding the Spider Chart:**
   - Each axis represents one quality metric
   - The filled area shows the project's performance
   - **Larger/fuller shape** = Better overall quality
   - **Indentations** = Areas needing improvement
   - **Uniform shape** = Balanced project health
   - **Uneven shape** = Some areas need more attention

---

## Step 8: Dashboard Overview

The Dashboard provides a high-level view of all your projects and their quality metrics.

1. **Navigate to Dashboard:**
   - From the sidebar, click on **"Dashboard"** (Home)

2. **Key Metrics Cards:**
   
   At the top, you'll see four summary cards:
   
   - **Total Projects** 
     - Total number of projects synced from GitLab
     - Shows across all groups
   
   - **Tracked Projects**
     - Number of projects you're actively monitoring
   
   - **Average Quality**
     - Average combined score across all tracked projects
     - Scale: 0-5.0
   
   - **Needs Attention**
     - Number of projects with combined score < 3.0
     - These are projects requiring immediate action

3. **Quality Score Distribution Chart (Bar Chart):**
   
   Shows how many projects fall into each quality range:
   - **0-2 (Critical)** - Red - Projects in critical condition
   - **2-3 (Warning)** - Yellow - Projects needing attention
   - **3-4 (Good)** - Blue - Projects performing well
   - **4-5 (Excellent)** - Green - Projects in excellent health
   
   **Use this to:**
   - Understand overall portfolio health
   - Identify if most projects are healthy or struggling
   - Track improvement trends over time

4. **Tracking Status Chart (Pie Chart):**
   
   Visual breakdown of:
   - **Tracked projects** (colored)
   - **Untracked projects** (grey)
   
   **Use this to:**
   - See what percentage of projects you're monitoring
   - Identify if you need to track more projects

5. **Projects Needing Attention Section:**
   
   Bottom section shows **projects with combined score < 3.0**:
   
   For each project, you'll see:
   - **Project Name** and group path
   - **Combined Quality Score** (large, red number)
   - **Spider Chart** showing all metrics visually
   - **"View Details"** button to investigate further
   
   **If no projects need attention:**
   - You'll see a congratulations message 🎉
   
   **What to do:**
   - Prioritize these projects for improvement
   - Click "View Details" to see specific recommendations
   - Focus on the lowest-scoring metrics in the spider chart

6. **Quality Score Trends (Individual Project View):**
   
   From the Dashboard or Tracked Projects page, click **"View"** on any project, then navigate to the **"Metrics"** tab to see detailed quality score trends.
   
   **Quality Score Trends Chart (Line Chart):**
   
   This chart shows the historical progression of your AI insight scores over time for a specific project.
   
   **9 Lines Displayed:**
   - **7 Section Scores:**
     - Code Review (blue)
     - Technical Debt (green)
     - Test Quality (yellow)
     - Documentation (red)
     - Deployment (purple)
     - Dependencies (orange)
     - Team Morale (light blue)
   
   - **API Score** (thick green line) - GitLab + SonarCloud metrics
   - **Combined Score** (thick blue line) - Overall project health
   
   **How to Use This Chart:**
   - **Track improvement over time** - See if scores are going up or down
   - **Identify trends** - Which areas are improving? Which are declining?
   - **Measure impact of changes** - Did your improvements work?
   - **Compare metrics** - Are all areas balanced or is one lagging?
   - **Spot patterns** - Do scores improve after certain actions?
   
   **If you see "No insights history available":**
   - You need to generate AI insights first (see Step 6 in Part 2)
   - Each time you generate insights, a new data point is added to the chart
   - The more often you generate insights, the more detailed the trend visualization
   - Recommended: Generate insights weekly or after major changes to track progress

---

## Part 3: Health Metrics

Health metrics provide objective measurements of project quality based on GitLab and SonarQube data. Each metric is calculated on a 0-5 scale.

---

## Step 9: Refreshing and Viewing Health Metrics

### Refreshing Project Data

After clicking the **"View"** button on any project from the Tracked Projects page:

1. **Locate the "Refresh Data" Button:**
   - At the top-right of the Project Details page
   - Next to "AI Project Insights" and "DORA Dashboard" buttons

2. **Click "Refresh Data":**
   - Button will show "Refreshing..." with a spinning icon
   - This fetches fresh data from:
     - **GitLab API** - Issues, Merge Requests, Commits, Milestones
     - **SonarQube/SonarCloud** - Code quality metrics (if configured)

3. **What Gets Refreshed and Updated:**
   
   The system calls 7 refresh endpoints in parallel to fetch the latest data:
   
   **GitLab Metrics (4 endpoints):**
   - **Issue Metrics** - Fetches and calculates issue health (0-5 scale)
   - **Merge Request Metrics** - Fetches and calculates MR health (0-5 scale)
   - **Commit Metrics** - Fetches and calculates commit health (0-5 scale)
   - **Milestone Metrics** - Fetches active milestone data
   
   **SonarQube Metrics (3 endpoints, if configured):**
   - **Maintainability** - Fetches and calculates maintainability health (0-5 scale)
   - **Reliability** - Fetches and calculates reliability health (0-5 scale)
   - **Security** - Fetches and calculates security health (0-5 scale)

4. **Where Updated Data Appears:**
   
   All refreshed metrics are displayed in **individual metric cards** in the **Overview tab**:
   
   - **Issue Metrics Card** 
     - Open/closed issues counts
     - Critical Metrics: Velocity (30d), avg cycle time, reopen rate, bug ratio (all with alert levels)
     - Additional: Stale issues, critical open, MR link rate, closure rate
   
   - **MR Metrics Card**
     - Open/merged MRs counts
     - Critical Metrics: Merge velocity (30d), avg merge time, avg review comments, revert rate (all with alert levels)
     - Additional: Stale MRs count, avg reviewers, closure rate
   
   - **Commit Metrics Card** (Last 7 days)
     - Total commits and contributors
     - Avg commit size (lines changed)
     - Lines added/deleted with ratio
     - Commits per week
     - Bus factor (risk indicator)
   
   - **Milestone Metrics Card**
     - Total active milestones (non-expired)
     - Max/min/avg issues per milestone
     - Milestone names with highest/lowest issue counts
   
   - **SonarQube Maintainability Card**
     - Priority issues (High + Blocker) with status badge
     - Maintainability rating (A-E) and technical debt ratio
     - Code smells: Total and new
     - Complexity: Cyclomatic and cognitive
     - Code duplication: Total % and new code %
   
   - **SonarQube Reliability Card**
     - Priority bugs (Critical + Blocker) with status badge
     - Reliability rating (A-E)
     - Total bugs and new bugs
     - Fix time estimate for remediation
   
   - **SonarQube Security Card**
     - Total vulnerabilities with status badge
     - Security rating (A-E)
     - Security hotspots: Total count, % reviewed, review rating
     - New vulnerabilities in new code
     - Fix time estimate for remediation

5. **After Refresh:**
   - Success notification appears: "All metrics refreshed successfully"
   - All metric cards in Overview tab update with latest data
   - Health score history gets a new data point (if on Metrics tab)
   - Each card shows the health score (0-5) and detailed metrics

### Viewing Health Score Trends

1. **Navigate to Metrics Tab:**
   - From the Project Details page
   - Click on the **"Metrics"** tab at the top

2. **Health Score Trends Chart:**
   
   This chart displays **6 health metrics over time**, each calculated on a **0-5 scale**.
   
   **The 6 Health Metrics:**
   
   | Metric | What It Measures | Calculation Factors |
   |--------|------------------|---------------------|
   | **Issue Health** (Blue) | How well issues are managed | Open vs closed issues, resolution time, issue age, overdue issues |
   | **MR Health** (Green) | Merge request efficiency | Open vs merged MRs, review time, approval rate, merge frequency |
   | **Commit Health** (Yellow) | Commit activity quality | Commit frequency, number of contributors, commit patterns |
   | **Reliability** (Purple) | Code reliability | SonarQube bugs, bug severity, reliability rating |
   | **Maintainability** (Pink) | Code maintainability | SonarQube code smells, technical debt, maintainability rating |
   | **Security** (Red) | Code security | SonarQube vulnerabilities, security hotspots, security rating |

3. **Understanding the Scale (0-5):**
   
   - **0-1** (Critical) - Severe problems requiring immediate attention
   - **1-2** (Poor) - Significant issues affecting project health
   - **2-3** (Fair) - Room for improvement, needs attention
   - **3-4** (Good) - Healthy state with minor areas to improve
   - **4-5** (Excellent) - Outstanding performance, best practices followed

4. **How to Use the Health Trends Chart:**
   
   - **Monitor trends over time** - Are metrics improving or declining?
   - **Identify problem areas** - Which metrics are consistently low?
   - **Measure impact of actions** - Did your fixes improve the scores?
   - **Compare metrics** - Are all areas balanced or is one lagging behind?
   - **Spot patterns** - Do scores drop during certain periods?
   - **Set goals** - Aim to bring all metrics above 3.0 (Fair threshold)

5. **If You See "No health score history available":**
   - Click **"Refresh Data"** button to create the first data point
   - Each time you refresh, a new snapshot is added to the chart
   - Recommended: Refresh weekly or after significant changes
   - More frequent refreshes = more detailed trend visualization

6. **Best Practices:**
   
   - **Regular Refreshes** - Refresh data at least weekly to track progress
   - **After Changes** - Refresh after fixing bugs, merging MRs, or resolving issues
   - **Track Improvements** - Use the chart to verify that your improvements work
   - **Balance Metrics** - Don't focus on just one metric; aim for balanced health
   - **Set Baselines** - Use initial scores as a baseline to measure progress

---

## Part 4: DORA Metrics

DORA (DevOps Research and Assessment) metrics help measure software delivery performance and team effectiveness.

---

## Step 10: Input and View DORA Metrics

### Accessing DORA Metrics Input

1. **From Tracked Projects page:**
   - Each project row has a **bar chart icon button** (📊)
   - Click this button to open the **DORA Metrics Input** page for that project

2. **Input Four Types of DORA Metrics:**

   **A. Deployment Frequency**
   - Tracks how often you deploy to production
   - Fields to fill:
     - **Deployment ID** - Unique identifier for this deployment
     - **Version** - Version number deployed (e.g., v1.2.3)
     - **Environment** - Deployment target (e.g., production, staging)
     - **Deployment Timestamp** - When the deployment occurred
   - Click **Add Deployment** to save

   **B. Lead Time for Changes**
   - Measures time from code commit to production deployment
   - Fields to fill:
     - **Change ID** - Identifier for the change (e.g., merge request ID)
     - **Merged At** - When the code was merged
     - **Deployed At** - When it reached production
   - The system automatically calculates the lead time duration
   - Click **Add Lead Time** to save

   **C. Change Failure Rate**
   - Tracks percentage of deployments that cause failures
   - Fields to fill:
     - **Deployment ID** - Reference to the deployment
     - **Deployment Timestamp** - When it was deployed
     - **Has Incident?** - Check if this deployment caused an incident
     - **Remediation Type** - How it was fixed (rollback, hotfix, patch)
   - Click **Add Failure Data** to save

   **D. Time to Restore Service**
   - Measures how quickly you recover from incidents
   - Fields to fill:
     - **Incident ID** - Unique identifier for the incident
     - **Started At** - When the incident began
     - **Resolved At** - When service was restored
     - **Description** - Brief description of the incident
   - The system automatically calculates restoration time
   - Click **Add Restore Time** to save

### Viewing DORA Dashboard

1. **Access the Dashboard:**
   - Click **View** button for any project in Tracked Projects
   - On the project detail page, click the **DORA Dashboard** button

2. **Dashboard Controls:**
   - **Granularity Selector** - Choose time period:
     - Weekly - View metrics per week
     - Monthly - View metrics per month
     - Yearly - View metrics per year
   - **Period Navigation** - Use ← → arrows to navigate between time periods

3. **Summary Cards (Top Section):**
   Each metric shows:
   - **Current Value** - Latest period's measurement
   - **Trend Indicator** - Arrow showing if metric is improving/declining
   - **Percentage Change** - Compared to previous period
   - **Performance Rating** - Elite/High/Medium/Low based on DORA benchmarks

   Four cards display:
   - **Deployment Frequency** - Deployments per period (higher is better)
   - **Lead Time for Changes** - Average hours from commit to production (lower is better)
   - **Change Failure Rate** - Percentage of failed deployments (lower is better)
   - **Time to Restore Service** - Average hours to recover (lower is better)

4. **Detailed Trend Charts:**

   **Deployment Frequency Chart (Area Chart)**
   - Shows deployment count trend over time
   - Displays: Current count, Average, Total deployments across all periods

   **Lead Time Chart (Line Chart)**
   - Shows average lead time trend in hours
   - Displays: Current avg, Overall avg, Total number of changes tracked

   **Change Failure Rate Charts**
   - Line chart showing failure rate percentage trend over time
   - Pie chart showing current period's success vs. failure breakdown
   - Displays: Total deployments and number of failures

   **Time to Restore Service Chart (Line Chart)**
   - Shows average restoration time trend in hours
   - Displays: Current avg, Overall avg, Total incidents resolved

5. **Performance Summary Section:**
   - Overview of all four DORA metrics
   - Color-coded performance ratings for each metric
   - Quick assessment of overall software delivery performance

---

## Additional Features

### Dashboard Overview
- **Navigate to:** Dashboard (Home)
- **What You'll See:**
  - Quick overview of all tracked projects
  - Summary metrics
  - Health score trends
  - Recent activity

### Alerts
- **Navigate to:** Alerts page
- **What You'll See:**
  - System notifications
  - Critical issues requiring attention
  - Anomalies detected in metrics

### Tracking Management
- **Navigate to:** Tracking Management
- **What You'll See:**
  - Configure which projects to track
  - Set up tracking rules
  - Manage tracking schedules

---

