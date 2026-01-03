# DORA Metrics Dashboard

## Overview
A comprehensive dashboard for tracking and analyzing DORA (DevOps Research and Assessment) metrics with trend analysis capabilities.

## Features

### 📊 All 4 DORA Metrics
1. **Deployment Frequency** - How often you deploy to production
2. **Lead Time for Changes** - Time from commit to production
3. **Change Failure Rate** - Percentage of deployments causing failures
4. **Time to Restore Service** - Time to recover from incidents

### 📈 Flexible Time Granularity
- **Weekly** - Last 12 weeks of data
- **Monthly** - Last 12 months of data  
- **Yearly** - Last 12 years of data (or all available years)

### 🎯 Performance Ratings
Each metric is rated based on DORA standards:
- **Elite** - Top 5% performers
- **High** - High performers
- **Medium** - Medium performers
- **Low** - Low performers

### 📉 Trend Analysis
- Current vs previous period comparison
- Percentage change indicators
- Trend direction (up/down/stable)
- Visual trend indicators with color coding

### 📊 Visualizations
- **Area Charts** - Deployment frequency over time
- **Line Charts** - Lead time, failure rate, and restore time trends
- **Pie Charts** - Success vs failure distribution
- **Summary Cards** - Key metrics at a glance

## How to Access

1. Navigate to any project detail page
2. Click the **"DORA Dashboard"** button in the header
3. Select your preferred time granularity (Weekly/Monthly/Yearly)
4. View trends and metrics

## API Endpoints

### Get DORA Trends
```
GET /projects/:id/dora/trends?granularity=monthly&periods=12
```

**Query Parameters:**
- `granularity` - 'weekly', 'monthly', or 'yearly' (default: 'monthly')
- `periods` - Number of periods to retrieve, max 12 (default: 12)

**Response:**
```json
{
  "success": true,
  "data": {
    "granularity": "monthly",
    "data": [
      {
        "period": "2024-01",
        "deployment_frequency": 5,
        "avg_lead_time_hours": 120.5,
        "failure_rate_percent": 15.2,
        "avg_restore_time_hours": 8.3,
        "total_deployments": 5,
        "total_changes": 12,
        "failed_deployments": 1,
        "total_incidents": 2
      }
    ],
    "summary": {
      "deployment_frequency": {
        "current": 21,
        "avg": 18.5,
        "trend": "up",
        "change_percent": 15.5
      },
      "lead_time": {
        "current": 34.8,
        "avg": 79.2,
        "trend": "up",
        "change_percent": -55.6
      },
      "failure_rate": {
        "current": 4.6,
        "avg": 14.1,
        "trend": "up",
        "change_percent": -67.4
      },
      "restore_time": {
        "current": 2.3,
        "avg": 10.8,
        "trend": "up",
        "change_percent": -78.7
      }
    }
  }
}
```

## Performance Rating Thresholds

### Deployment Frequency
- **Elite**: ≥30 per period
- **High**: 7-29 per period
- **Medium**: 1-6 per period
- **Low**: <1 per period

### Lead Time for Changes
- **Elite**: ≤24 hours
- **High**: ≤168 hours (1 week)
- **Medium**: ≤720 hours (1 month)
- **Low**: >720 hours

### Change Failure Rate
- **Elite**: ≤5%
- **High**: 5-10%
- **Medium**: 10-15%
- **Low**: >15%

### Time to Restore Service
- **Elite**: ≤1 hour
- **High**: 1-24 hours
- **Medium**: 1-7 days (≤168 hours)
- **Low**: >7 days

## Files Created

### Backend
- `server/src/services/doraMetrics/doraTrendsService.ts` - Trend calculation service
- `server/src/controllers/doraMetricsController.ts` - Updated with trends endpoint
- `server/src/routes/doraMetricsRoutes.ts` - Added trends route

### Frontend
- `client/src/pages/DORADashboard.tsx` - Main dashboard component
- Updated `client/src/App.tsx` - Added dashboard route
- Updated `client/src/pages/ProjectDetail.tsx` - Added dashboard link

## Usage Tips

1. **Start with Monthly view** - Best balance of detail and overview
2. **Use Weekly for recent changes** - Spot issues quickly
3. **Use Yearly for long-term trends** - Strategic planning
4. **Watch the trend indicators** - Green up arrows are good for deployment frequency, but watch for red down arrows in failure rate
5. **Compare current vs average** - Understand if you're improving
6. **Check performance ratings** - Aim for Elite across all metrics

## Next Steps

After viewing the dashboard, you can:
1. Click on individual metric tabs for detailed charts
2. Review the performance summary at the bottom
3. Use insights to identify areas for improvement
4. Share metrics with your team
5. Set goals based on DORA standards

## Notes

- Data is calculated from the actual DORA metrics tables
- Trends show percentage change from previous period
- All charts are interactive (hover for details)
- Performance ratings follow official DORA research standards
