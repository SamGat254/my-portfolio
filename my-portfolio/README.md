# 🎓 Samuel Gatimu Kariuki — Professional Portfolio

A full-stack portfolio website for an Electrical & Electronic Engineering student at Chuka University. Features a YouTube-style video library, project showcase, engineering blog, auto-generating CV, secure admin dashboard, and AES-256 encrypted document vault.

---

## 🗂️ Project Structure

```
/
├── index.html                    ← Complete frontend (open directly in browser)
├── README.md
│
├── backend/
│   ├── server.js                 ← Express server entry point
│   ├── .env.example              ← Environment variable template
│   ├── db/
│   │   ├── schema.sql            ← PostgreSQL schema + seed data
│   │   └── index.js              ← DB connection pool
│   ├── middleware/
│   │   └── auth.js               ← JWT verification middleware
│   └── routes/
│       ├── auth.js               ← Login, password change, setup
│       ├── videos.js             ← CRUD for videos
│       ├── projects.js           ← CRUD for projects
│       ├── blog.js               ← Blog posts + comments
│       ├── timeline.js           ← Career timeline CRUD
│       ├── cv.js                 ← Auto-generating PDF CV
│       ├── vault.js              ← AES-256 encrypted file vault
│       ├── contact.js            ← Contact form + email
│       └── analytics.js         ← Visitor statistics
│
└── vault_encrypted/              ← Encrypted vault files (auto-created, never commit)
```

---

## 🚀 Quick Start — Frontend Only

1. Open `index.html` in any browser — it works standalone with no backend needed.
2. The admin dashboard is accessible via the "Admin" button in the nav.

---

## ⚙️ Full Backend Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Install Backend Dependencies

```bash
cd backend
npm init -y
npm install express cors helmet express-rate-limit morgan bcryptjs jsonwebtoken \
  multer pg dotenv pdfkit nodemailer
npm install --save-dev nodemon
```

### 2. Create PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE sgk_portfolio;
\q
psql -U postgres -d sgk_portfolio -f db/schema.sql
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
# - DATABASE_URL
# - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - VAULT_ENCRYPTION_KEY (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 4. Create Your Admin Account

```bash
# Start server
node server.js

# In a separate terminal, run:
curl -X POST http://localhost:5000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Samuel Gatimu","email":"your@email.com","password":"YourStrongPass123!"}'
```

### 5. Start the Server

```bash
# Development
npx nodemon server.js

# Production
NODE_ENV=production node server.js
```

---

## 🔐 Security Features

| Feature | Implementation |
|--------|---------------|
| Password Hashing | bcrypt with salt rounds = 12 |
| Authentication | JWT (24h expiry) |
| Rate Limiting | 100 req/15min general, 5 req/15min for login |
| File Encryption | AES-256-CBC with random IV per file |
| Security Headers | Helmet.js (CSP, HSTS, X-Frame-Options) |
| Admin Audit Log | Every admin action is logged with IP |
| Input Validation | Server-side validation on all routes |

---

## 🌐 Deploy to Netlify (Frontend)

```bash
# Option 1: Drag & Drop
# Simply drag the index.html file to app.netlify.com/drop

# Option 2: Git Deploy
git init
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/yourusername/portfolio.git
git push -u origin main
# Then connect repo to Netlify dashboard
```

### netlify.toml (add to root if using SPA routing)
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🚀 Deploy Backend to Railway / Render

```bash
# Railway
npm install -g @railway/cli
railway login
railway new
railway add postgresql
railway up

# Render
# 1. Push backend to GitHub
# 2. Create new Web Service on render.com
# 3. Set environment variables in Render dashboard
# 4. Deploy
```

---

## 📄 Auto-Updating CV

The CV system automatically includes:
- ✅ All projects added via admin dashboard
- ✅ All certifications
- ✅ All skills
- ✅ Timeline entries

To download updated CV: `GET /api/cv/pdf`

---

## 🎥 Video Library

Upload videos via the admin dashboard. Videos can be:
- Linked to YouTube URLs
- Categorized (Engineering, Math, Electronics, etc.)
- Tagged and searchable

---

## 🔒 Document Vault

The private vault stores files with:
- AES-256-CBC encryption (each file has a unique IV)
- Files stored as `.enc` binary files on disk
- Database only stores encrypted file paths — not file contents
- Accessible ONLY with valid admin JWT token
- ⚠️ Back up your `VAULT_ENCRYPTION_KEY` — without it, files cannot be decrypted

---

## 📊 Analytics

Visit analytics tracked at `/api/analytics`:
- Page view counts
- Top pages
- Visitor countries (via IP)
- Video play counts
- Project view counts

---

## 🛠️ Tech Stack

**Frontend:** HTML5, CSS3 (custom), Vanilla JavaScript, Google Fonts (Syne + DM Sans + JetBrains Mono)

**Backend:** Node.js, Express.js, PostgreSQL, JWT, bcrypt, multer, pdfkit

**Security:** AES-256-CBC encryption, Helmet.js, rate limiting, input sanitization

**Deploy:** Netlify (frontend), Railway/Render (backend), Supabase/Neon (PostgreSQL)

---

## 📞 Contact

**Samuel Gatimu Kariuki**  
Electrical & Electronic Engineering Student  
Chuka University, Tharaka-Nithi, Kenya

---

*Built with ❤️ for engineering education in Kenya 🇰🇪*
