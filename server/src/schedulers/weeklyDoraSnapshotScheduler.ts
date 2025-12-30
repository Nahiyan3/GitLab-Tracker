// Weekly DORA Snapshot Scheduler
// Automatically captures DORA metrics snapshots every Sunday at midnight

import cron from 'node-cron';
import { captureLastWeekSnapshots } from '../services/doraMetrics/weeklyDoraSnapshotService';

/**
 * Initialize the weekly DORA snapshot scheduler
 * Runs every Sunday at 00:01 (1 minute after midnight)
 */
export const initWeeklyDoraSnapshotScheduler = () => {
  // Cron expression: '0 1 0 * * 0' means:
  // - 0 seconds
  // - 1 minute
  // - 0 hour (midnight)
  // - Every day of month
  // - Every month
  // - 0 = Sunday
  
  cron.schedule('0 1 0 * * 0', async () => {
    console.log('🗓️  Weekly DORA snapshot scheduler triggered (Sunday 00:01)');
    
    try {
      await captureLastWeekSnapshots();
      console.log('✅ Weekly DORA snapshots captured successfully');
    } catch (error) {
      console.error('❌ Failed to capture weekly DORA snapshots:', error);
    }
  }, {
    timezone: 'Asia/Dhaka' // Adjust to your timezone
  });

  console.log('⏰ Weekly DORA snapshot scheduler initialized (runs every Sunday at 00:01)');
};
