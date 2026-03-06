# Deployment Guide

This guide will walk you through deploying the Mkanak ERP system with the frontend on Vercel and the backend on Railway.

## Prerequisites

- GitHub account
- [Vercel](https://vercel.com) account
- [Railway](https://railway.app) account
- Your code pushed to a GitHub repository

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Select the **backend** service

### 1.2 Configure Railway

1. Go to **Settings** → **Service Settings**
2. Set **Root Directory** to: `backend`
3. Railway will auto-detect it's a Node.js project

### 1.3 Add Environment Variables

Go to **Variables** tab and add:

```
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

Note: You'll update `FRONTEND_URL` after deploying the frontend.

### 1.4 Deploy

Railway will automatically build and deploy your backend. Wait for the deployment to complete.

### 1.5 Get Your Backend URL

Copy your Railway backend URL. It will look like:
```
https://your-backend.railway.app
```

You'll need this for the frontend configuration.

## Step 2: Deploy Frontend to Vercel

### 2.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project settings:

### 2.2 Configure Build Settings

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 2.3 Add Environment Variables

Add the following environment variable:

```
VITE_API_URL=https://your-backend.railway.app
```

Replace with your actual Railway backend URL from Step 1.5.

### 2.4 Deploy

Click **"Deploy"** and wait for Vercel to build and deploy your frontend.

### 2.5 Get Your Frontend URL

After deployment, copy your Vercel frontend URL. It will look like:
```
https://your-app.vercel.app
```

## Step 3: Update Backend CORS Configuration

Go back to Railway and update the `FRONTEND_URL` environment variable with your actual Vercel URL:

```
FRONTEND_URL=https://your-app.vercel.app
```

Railway will automatically redeploy with the new configuration.

## Step 4: Test Your Deployment

1. Visit your Vercel frontend URL
2. Try logging in with the default credentials:
   - Username: `admin`
   - Password: `admin123`
3. Test various features to ensure everything works

## Continuous Deployment

Both Vercel and Railway support automatic deployments:

- **Push to main branch** → Both services automatically redeploy
- **Frontend changes** → Only Vercel redeploys
- **Backend changes** → Only Railway redeploys

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
2. Make sure Railway redeployed after updating the variable
3. Check the backend logs in Railway

### API Connection Issues

If the frontend can't connect to the backend:
1. Verify `VITE_API_URL` in Vercel matches your Railway URL
2. Make sure Railway backend is running (check logs)
3. Try accessing `https://your-backend.railway.app/api/health` directly

### Build Failures

**Frontend Build Fails:**
- Check Node version (should be 18+)
- Verify all dependencies are in package.json
- Check Vercel build logs

**Backend Build Fails:**
- Check Railway build logs
- Verify package.json has all dependencies
- Ensure server.js is in the backend folder

## Database Persistence

⚠️ **Important**: Railway's ephemeral file system means the SQLite database will be reset on each deployment. For production, consider:

1. **Railway Volume**: Mount a persistent volume for the database
2. **PostgreSQL**: Migrate to Railway's PostgreSQL addon
3. **External Database**: Use a managed database service

### Adding a Railway Volume (Recommended for SQLite)

1. Go to your Railway backend service
2. Click **"Variables"** → **"Volumes"**
3. Add a new volume:
   - **Mount Path**: `/app/data`
4. Update `backend/server.js` to save database to `/app/data/mkanak.db`

## Monitoring

### Railway Monitoring
- View logs: Railway dashboard → Your service → Logs
- View metrics: Railway dashboard → Your service → Metrics

### Vercel Monitoring
- View deployments: Vercel dashboard → Your project → Deployments
- View analytics: Vercel dashboard → Your project → Analytics

## Custom Domains

### Vercel (Frontend)
1. Go to your project settings
2. Click **"Domains"**
3. Add your custom domain
4. Update DNS records as instructed

### Railway (Backend)
1. Go to your service settings
2. Click **"Networking"** → **"Domains"**
3. Add your custom domain
4. Update DNS records as instructed

After adding custom domains, remember to update the environment variables:
- Update `VITE_API_URL` in Vercel with your custom backend domain
- Update `FRONTEND_URL` in Railway with your custom frontend domain

## Security Recommendations

1. **Change Default Credentials**: Update the default admin password
2. **Use HTTPS**: Both Vercel and Railway provide HTTPS by default
3. **Environment Variables**: Never commit `.env` files to git
4. **API Rate Limiting**: Consider adding rate limiting to your backend
5. **Database Backup**: Regularly backup your database
6. **Authentication**: Implement proper JWT or session-based authentication

## Support

For issues specific to:
- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs)
- **Railway**: Check [Railway Documentation](https://docs.railway.app)
- **This Project**: Open an issue on GitHub
