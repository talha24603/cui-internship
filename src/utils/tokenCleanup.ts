import { cleanupExpiredTokens } from './authhelper';

// Run cleanup every hour
export function startTokenCleanup() {
  setInterval(async () => {
    try {
      const deleted = await cleanupExpiredTokens();
      console.log(`Cleaned up ${deleted.count} expired tokens`);
    } catch (error) {
      console.error('Token cleanup failed:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
}

// Start cleanup on server startup in production
if (process.env.NODE_ENV === 'production') {
  startTokenCleanup();
}
