# Mkanak ERP Backend

Express.js API server for the Mkanak ERP & POS System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `FRONTEND_URL` in `.env` with your Vercel frontend URL.

## Running Locally

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Deployment on Railway

1. Push your code to GitHub
2. Create a new project on Railway
3. Connect your GitHub repository
4. Add the following environment variables:
   - `FRONTEND_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - `NODE_ENV`: `production`
5. Railway will automatically detect the Node.js project and deploy

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/products` - Get all products
- `GET /api/branches` - Get all branches
- `GET /api/sales` - Get all sales
- `GET /api/inventory` - Get inventory
- `GET /api/transfers` - Get transfers
- And many more...

## Database

The application uses SQLite (better-sqlite3) for data storage. The database file `mkanak.db` will be created automatically on first run.
