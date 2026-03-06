# Mkanak ERP & POS System

A complete ERP and Point of Sale system with multi-branch support, inventory management, and comprehensive business analytics.

## Project Structure

```
/
├── frontend/          # React + Vite frontend application
│   ├── src/          # Source code
│   ├── dist/         # Build output (generated)
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── backend/          # Express.js API server
│   ├── server.js     # Main server file
│   ├── package.json
│   └── README.md
│
└── README.md         # This file
```

## Quick Start

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start the server:
```bash
npm start
```

Server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Deployment

### Backend Deployment (Railway)

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repository
4. Set the **Root Directory** to `backend`
5. Add environment variables:
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `NODE_ENV`: `production`
6. Railway will auto-detect Node.js and deploy

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your Railway backend URL
5. Deploy!

## Features

✅ **Multi-Branch Management**
- Create and manage multiple branches
- Branch-specific inventory tracking
- Inter-branch transfers and requests

✅ **Point of Sale (POS)**
- Fast and intuitive interface
- Barcode scanning support
- Multiple payment methods
- Customer management

✅ **Inventory Management**
- Real-time stock tracking
- Low stock alerts
- Multi-branch inventory
- Product categorization

✅ **Sales & Returns**
- Complete sales history
- Invoice management
- Return processing
- Customer tracking

✅ **CRM**
- Customer profiles
- Phone number tracking
- Customer classification
- Loyalty points

✅ **Reports & Analytics**
- Sales reports
- Revenue tracking
- Top products analysis
- Branch performance
- Category-wise sales

✅ **Communication**
- Real-time notifications
- Inter-branch messaging
- Transfer alerts

## Tech Stack

### Frontend
- React 19
- Vite
- TypeScript
- TailwindCSS
- Zustand (State Management)
- React Router
- Recharts (Analytics)
- Lucide React (Icons)

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- CORS enabled

## Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

## API Documentation

See `backend/README.md` for API endpoint documentation.

## License

ISC
