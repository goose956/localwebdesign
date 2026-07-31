# OpenTwentyFour — Web Design Company Website

A full-stack website for a web design company with a powerful admin panel. Positioning: a web design company first (not an "AI agency" — deliberately, for Google Business Profile category purposes), with a 24/7 AI chat/voice assistant as the core differentiator woven into every site.

## Features

**Public Website**
- 🏠 Home page with animated hero, services, process steps, and client reviews
- 🖼️ Portfolio page with category filtering
- 💰 Pricing page with 3 tiers (Starter £799 / Professional £1,499 / Enterprise £2,999+)
- 📬 Contact form that saves directly to the admin inbox

**Admin Panel** (`/admin`)
- 📊 Dashboard with live stats
- 📩 Contact Messages inbox (read, reply, archive, delete)
- 🖼️ Portfolio Manager (add/edit/delete projects with images)
- ⭐ Reviews Manager (toggle visibility, add new reviews)
- 🎨 Theme Builder — **6 built-in colour themes + create custom themes**
  - Midnight Purple (default)
  - Ocean Depths
  - Emerald Forest
  - Sunset Blaze
  - Rose Gold
  - Silver Chrome

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS          |
| Backend  | Node.js + Express                       |
| Database | SQLite (via better-sqlite3)             |
| Auth     | JWT (JSON Web Tokens)                   |
| Deploy   | Railway                                 |

---

## Local Development

### Prerequisites
- Node.js 18+

### 1. Setup

```bash
# Install all dependencies
npm run setup

# Copy environment file
cp server/.env.example server/.env
```

### 2. Edit `server/.env`

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-here        # CHANGE THIS!
ADMIN_PASSWORD=YourSecurePassword123   # CHANGE THIS!
CLIENT_URL=http://localhost:5173
```

### 3. Run

```bash
# Run both frontend and backend together
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Admin Panel: http://localhost:5173/admin

**Default admin login:** `admin` / `Admin@123456` (change this in `.env`)

---

## Deploying to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/design-website.git
git push -u origin main
```

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repo
3. Railway will auto-detect the `railway.json` build config

### 3. Set Environment Variables in Railway

In the Railway dashboard → your service → Variables, add:

| Variable       | Value                          |
|----------------|--------------------------------|
| `NODE_ENV`     | `production`                   |
| `JWT_SECRET`   | (generate a long random string)|
| `ADMIN_PASSWORD` | (your secure admin password) |
| `PORT`         | `5000` (or leave blank for Railway auto)|
| `OPENAI_API_KEY` | your OpenAI key (powers the chat widget) |
| `SITE_SYNC_KEY` | a long random string — shared with Site Builder's Settings so it can sync chat data and publish to the Portfolio page |

### 4. Deploy

Railway will automatically:
1. `cd client && npm install && npm run build` (build React app)
2. `cd ../server && npm install` (install server deps)
3. `node server/server.js` (start server which serves the built React app)

### 5. Persistent Storage (Important!)

SQLite data and uploaded portfolio thumbnails are stored under `server/data/`. On Railway, this **will be lost on redeploy** unless you add a persistent volume:

1. In Railway: Service → Volumes → Add Volume
2. Mount path: `/app/server/data`
3. This preserves your database and uploaded images across deployments

**Important:** the mount path must be `/app/server/data`, not `/app/server`. Mounting a volume overlays that directory with the volume's (initially empty) contents — mounting it directly at `server/` would hide your actual application code (`server.js`, `node_modules`, etc.) and the app would fail to start with `Cannot find module '/app/server/server.js'`. `data/` is a dedicated, code-free subdirectory specifically so this is safe.

---

## Admin Panel Guide

### Themes
1. Go to `/admin/themes`
2. Click **Activate** on any preset theme to apply it instantly site-wide
3. Click **+ New Custom Theme** to create your own colour scheme
4. Use the colour pickers to customise every colour variable
5. Click **Save Changes** — the theme updates live on the public site

### Portfolio
1. Go to `/admin/portfolio`
2. Fill in the project details — use any public image URL (e.g., from Cloudinary or Unsplash)
3. Set **Featured** to pin a project to the top
4. Use **Sort Order** (lower = higher up) to control order

### Reviews
1. Go to `/admin/reviews`
2. Add client testimonials with name, company, star rating, and review text
3. Toggle **Visible** to show/hide reviews on the homepage

### Contact Messages
1. Go to `/admin/messages`
2. Click any message to read it (auto-marks as Read)
3. Use **Reply via Email** to open your email client
4. Update status: Unread → Read → Replied → Archived

---

## Customisation

### Company Name
The brand is `OpenTwentyFour`. Search and replace it (and the `O24` logo mark) throughout the codebase if it ever needs to change again.

### Pricing
Edit `client/src/pages/Pricing.jsx` — the `plans` array at the top.

### Contact Info
Edit `client/src/pages/Contact.jsx` — the `contactInfo` array.

### Services
Edit `client/src/components/Services.jsx` — the `services` array.
