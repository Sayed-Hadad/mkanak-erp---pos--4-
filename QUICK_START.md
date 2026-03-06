# 🚀 Quick Deployment Reference

## Backend on Railway

### Configuration
```
Root Directory: backend
```

### Environment Variables
```
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Your Backend URL
```
https://your-backend.railway.app
```

---

## Frontend on Vercel

### Configuration
```
Framework: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

### Environment Variables
```
VITE_API_URL=https://your-backend.railway.app
```

### Your Frontend URL
```
https://your-app.vercel.app
```

---

## Deployment Checklist

- [ ] Push code to GitHub
- [ ] Deploy backend to Railway
- [ ] Get Railway backend URL
- [ ] Deploy frontend to Vercel with `VITE_API_URL` set
- [ ] Get Vercel frontend URL
- [ ] Update Railway `FRONTEND_URL` with Vercel URL
- [ ] Test login at your Vercel URL (admin/admin123)
- [ ] Verify all features work correctly

---

## Local Development

### Terminal 1 - Backend
```bash
cd backend
npm install
npm start
```
Runs on: http://localhost:3001

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on: http://localhost:5173

---

## Default Login
- **Username**: admin
- **Password**: admin123

---

## Need Help?
- See `DEPLOYMENT.md` for detailed instructions
- See `RESTRUCTURING_SUMMARY.md` for complete changes
