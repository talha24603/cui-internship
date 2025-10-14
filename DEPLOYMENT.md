# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Environment Variables**: Set up your database and email configuration

## Deployment Steps

### 1. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect it's a Next.js project

### 2. Configure Environment Variables
In your Vercel project settings, add these environment variables:

```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# Email Configuration
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password
EMAIL_FROM=your_from_email

# JWT Secrets
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EMAIL_SECRET=your_email_token_secret

# App URL
APP_URL=https://your-project.vercel.app
```

### 3. Deploy
1. Click "Deploy" in Vercel dashboard
2. Wait for deployment to complete
3. Your app will be available at `https://your-project.vercel.app`

### 4. Verify Cron Jobs
1. Go to Functions tab in Vercel dashboard
2. You should see your cron endpoints listed
3. Check the logs to ensure they're working

## Cron Job Monitoring

### Viewing Logs
1. Go to your Vercel project dashboard
2. Click on "Functions" tab
3. Click on a cron function to view logs
4. Check execution times and results

### Testing Cron Jobs
You can manually trigger cron jobs for testing:

```bash
# Test token cleanup
curl -X GET https://your-project.vercel.app/api/cron/cleanup-tokens

# Test weekly reminders  
curl -X GET https://your-project.vercel.app/api/cron/weekly-reminders
```

## Troubleshooting

### Common Issues

1. **Cron Jobs Not Running**
   - Check if `vercel.json` is in the root directory
   - Verify the cron schedule syntax
   - Check Vercel function logs

2. **Database Connection Issues**
   - Verify `DATABASE_URL` environment variable
   - Check if your database allows connections from Vercel
   - Ensure database is accessible from the internet

3. **Email Not Sending**
   - Verify email environment variables
   - Check SMTP credentials
   - Review email service provider settings

### Vercel Limits

- **Hobby Plan**: 10-second function timeout
- **Pro Plan**: 60-second function timeout
- **Cron Jobs**: Available on Pro plan and above

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Email configuration verified
- [ ] Cron jobs scheduled and tested
- [ ] API endpoints working
- [ ] Swagger documentation accessible at `/api/docs`
- [ ] OpenAPI spec available at `/api/openapi`
