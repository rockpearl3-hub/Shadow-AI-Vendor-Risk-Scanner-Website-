# Shadow AI & Vendor Risk Scanner

A Phase 1 MVP dashboard for IT/security teams to track third-party vendors and AI tools, and assess their risk levels automatically.

## Features

- 🔐 JWT Authentication (signup/login)
- 📋 Vendor/AI Tool Management (add, edit, delete, CSV import)
- 🎯 Automated Risk Scoring Engine (0–100 scale → Low/Medium/High)
- 🕵️ Shadow Tool Detection (unapproved tools flagged automatically)
- 📊 Dashboard with charts (Recharts)
- 📁 CSV Export of vendor list + risk scores
- 🚨 Alerts for High Risk & Shadow vendors
- 🌙 Dark / Light theme toggle

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express |
| Database | SQLite via Prisma ORM |
| Auth | JWT + bcrypt |

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd shadow-ai-scanner
npm run install:all
```

### 2. Configure Environment
The backend `.env` file is pre-configured for local development. For production, update:
```
# backend/.env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

### 3. Run Locally
```bash
npm run dev
```
This starts:
- **Backend API**: http://localhost:4000
- **Frontend**: http://localhost:5173

The SQLite database and tables are **automatically created** on first run — no manual setup needed.

### 4. First Use
1. Open http://localhost:5173
2. Click **Sign Up** to create your admin account
3. Start adding vendors!

## CSV Import Format

To bulk import vendors, prepare a CSV with these columns:
```
name,category,dataSensitivity,hasCompliance,hasBreachHistory,approvedByIT
OpenAI GPT-4,AI Tool,High,Yes,No,Yes
Salesforce,SaaS Vendor,Medium,Yes,No,Yes
Unknown Tool,AI Tool,High,No,Yes,No
```

## Project Structure

```
shadow-ai-scanner/
├── backend/
│   ├── prisma/schema.prisma    # Database schema
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # JWT auth middleware
│   │   ├── routes/             # Express routers
│   │   └── services/           # Risk engine + CSV helpers
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Dashboard, Vendors, Reports, Alerts
│   │   ├── context/            # Auth context
│   │   └── services/           # API client
│   └── package.json
└── package.json                # Root — runs both with concurrently
```

## Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import to Vercel
3. Set `VITE_API_URL` env var to your backend URL

### Backend → Railway / Render
1. Push `backend/` to GitHub
2. Set env vars: `JWT_SECRET`, `DATABASE_URL`, `PORT`
3. Railway/Render auto-detects Node.js and runs `npm start`

## License
MIT
