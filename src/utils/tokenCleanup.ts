import { cleanupExpiredTokens } from './authhelper';

// Manual cleanup function for cron job usage
export async function runTokenCleanup() {
  try {
    const result = await cleanupExpiredTokens();
    console.log(`Cleaned up ${result.count} expired tokens`);
    return result;
  } catch (error) {
    console.error('Token cleanup failed:', error);
    throw error;
  }
}
