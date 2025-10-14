# Vercel Cron Jobs Setup

## Configuration

The `vercel.json` file has been created with the following cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-tokens",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/weekly-reminders",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

## Cron Schedules Explained

### Token Cleanup: `0 */6 * * *`
- **Frequency**: Every 6 hours
- **Times**: 00:00, 06:00, 12:00, 18:00 (UTC)
- **Purpose**: Clean up expired and revoked refresh tokens

### Weekly Reminders: `0 9 * * 1`
- **Frequency**: Every Monday at 9:00 AM UTC
- **Purpose**: Send weekly log reminders to students and mid-report notifications to supervisors

## How Vercel Cron Works

1. **Automatic Execution**: Vercel automatically calls your cron endpoints at the specified times
2. **Serverless**: Each cron job runs in a serverless function
3. **Timeout**: Functions have a 10-second timeout (Hobby plan) or 60-second timeout (Pro plan)
4. **Logging**: Check Vercel dashboard for execution logs and results

## Deployment

1. **Deploy to Vercel**: Push your code to trigger deployment
2. **Verify Setup**: Check the Functions tab in Vercel dashboard
3. **Monitor Logs**: View cron job execution logs in the Vercel dashboard

## Manual Testing

You can test the cron endpoints manually:

```bash
# Test token cleanup
curl -X GET https://your-domain.vercel.app/api/cron/cleanup-tokens

# Test weekly reminders
curl -X GET https://your-domain.vercel.app/api/cron/weekly-reminders
```

## Customizing Schedules

You can modify the schedules in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-tokens",
      "schedule": "0 2 * * *"  // Daily at 2 AM UTC
    },
    {
      "path": "/api/cron/weekly-reminders", 
      "schedule": "0 8 * * 2"  // Every Tuesday at 8 AM UTC
    }
  ]
}
```

## Common Cron Patterns

- `0 */6 * * *` - Every 6 hours
- `0 2 * * *` - Daily at 2 AM
- `0 9 * * 1` - Every Monday at 9 AM
- `0 0 1 * *` - First day of every month at midnight
- `0 0 * * 0` - Every Sunday at midnight

## Recommended Schedule

- **Token Cleanup**: Every 6 hours (`0 */6 * * *`)
- **Weekly Reminders**: Once per week (`0 9 * * 1`)

## Response Format

Both endpoints return JSON responses:

**Success:**
```json
{
  "success": true,
  "message": "Token cleanup completed successfully",
  "deletedCount": 5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Token cleanup failed",
  "error": "Database connection failed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```
