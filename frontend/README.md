# Mkanak ERP Frontend

React + Vite frontend for the Mkanak ERP & POS System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `VITE_API_URL` in `.env` with your backend URL:
   - For local development: `http://localhost:3001`
   - For production: Your Railway backend URL (e.g., `https://your-backend.railway.app`)

## Running Locally

```bash
npm run dev
```

The app will start on `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Deployment on Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables:
   - `VITE_API_URL`: Your Railway backend URL
5. Deploy!

## Environment Variables

- `VITE_API_URL`: The URL of your backend API (Railway deployment)

## Features

- Point of Sale (POS)
- Inventory Management
- Multi-branch Management
- Sales & Returns
- Customer Relationship Management (CRM)
- Reports & Analytics
- Real-time Notifications
- Inter-branch Messaging
