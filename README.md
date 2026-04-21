
<div align="center">
<img src="https://img.shields.io/badge/PomoPal-Focus%20Timer-FF6B6B?style=for-the-badge&logo=clockify&logoColor=white" alt="PomoPal"/>

**A student-focused Pomodoro timer to help you work smarter, not harder.**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://claude.ai/chat/LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen)](https://github.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://claude.ai/chat/CONTRIBUTING.md)
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)](https://pomopal.vercel.app/)

[🌐 Live App](https://pomopal.vercel.app/) · [🐛 Report a Bug](https://github.com/eclipsu/pomopal/issues) · [💡 Request a Feature](https://github.com/eclipsu/pomopal/issues)

</div>
---


---

## 📖 About

PomoPal is an open-source Pomodoro timer built with students in mind. It breaks your study sessions into focused intervals with short breaks in between — proven to boost productivity and reduce burnout.

> ⚠️ **PomoPal is currently under active development.** Some features may not be fully functional yet. We appreciate your patience!

---

## ✨ Features

* 🕐 **Customizable Timer Intervals** — set your own focus and break durations
* ⏸️ **Pause & Resume** — life happens; pick up right where you left off
* ✅ **Track Completed Pomodoros** — see how many sessions you've crushed
* 📊 **Statistics & Progress Tracking** — review your productivity over time

---

## 🚀 Getting Started

Visit the live app — no installation required:

**[→ pomopal.vercel.app](https://pomopal.vercel.app/)**

Works on desktop, tablet, and mobile browsers.

---

## 🤝 Contributing

We welcome contributions from students and developers of all skill levels! Every contribution earns you a badge on your profile that shows up in leaderboards and groups.

| Contribution Type       | Badge Earned                    |
| ----------------------- | ------------------------------- |
| Merged Pull Request     | 🧑🏻‍💻**Developer**     |
| Published a valid Issue | ⛹🏻‍♀️**Bug Catcher** |

> If your PR fixes an open issue, please reference it in your PR message (e.g. `Fixes #42`).

---

### 🖥️ Frontend Contributions

```bash
# Step 1 — Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/pomopal.git
cd pomopal

# Step 2 — Create a branch for your work
git checkout -b feature/your-feature-name
# Use prefixes: feature/, fix/, or chore/

# Step 3 — Make your changes, then commit with a clear message
git add .
git commit -m "feat: add dark mode toggle"

# Step 4 — Push and open a Pull Request
git push origin feature/your-feature-name
# Then go to GitHub and open a PR against the main branch
```

---

### ⚙️ Running the Backend Locally (Required for Frontend Testing)

To test your frontend changes, you need the backend API running on your machine. It runs via Docker so you don't need to set up a database manually.

#### Prerequisites

* [Docker](https://www.docker.com/get-started) installed and running
* [Git](https://git-scm.com/)

---

#### Step 1 — Clone the repository (if you haven't already)

```bash
git clone https://github.com/YOUR_USERNAME/pomopal.git
cd pomopal/backend
```

---

#### Step 2 — Create your `.env` file

In the `backend/` directory, create a new file called `.env`:

```bash
touch .env
```

Open it in your editor and paste the following,  **replacing all placeholder values** :

```dotenv
# ─────────────────────────────────────────
# Database
# ─────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5431
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=pomopal
DATABASE_URL='postgresql://postgres:your_database_password@localhost:5431/pomopal'

# ─────────────────────────────────────────
# JSON Web Tokens (Auth)
# ─────────────────────────────────────────
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=60s
REFRESH_JWT_SECRET=your_refresh_jwt_secret_here
REFRESH_TOKEN_EXPIRES_IN=12d

# ─────────────────────────────────────────
# Google OAuth — see Step 3 for how to get these
# ─────────────────────────────────────────
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/auth/google/callback

# ─────────────────────────────────────────
# Environment
# ─────────────────────────────────────────
NODE_ENV='development'
```

> 🔒 **Never commit your `.env` file.** It is already listed in `.gitignore`. Refer to `.env.example` in the repo as a safe template.

---

#### Step 3 — Set up Google OAuth credentials

You need your own Google OAuth credentials for auth to work locally.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown → **New Project** → name it → **Create**
3. In the sidebar go to **APIs & Services → OAuth consent screen**
   * Choose **External** → fill in app name and your email → **Save**
4. Go to **APIs & Services → Credentials**
5. Click **+ Create Credentials → OAuth 2.0 Client ID**
6. Set **Application type** to **Web application**
7. Under **Authorized redirect URIs** add:
   ```
   http://localhost:8000/auth/google/callback
   ```
8. Click **Create** — copy the **Client ID** and **Client Secret** shown into your `.env`:
   ```dotenv
   GOOGLE_OAUTH_CLIENT_ID=paste_your_client_id_hereGOOGLE_OAUTH_CLIENT_SECRET=paste_your_client_secret_here
   ```

---

#### Step 4 — Build and run with Docker

```bash
# From the backend/ directory
docker build -t pomopal-backend .
docker run --env-file .env -p 8000:8000 pomopal-backend
```

The backend will now be available at `http://localhost:8000`. Keep this terminal running while you work on the frontend.

---

#### Step 5 — Verify it's working

```bash
curl http://localhost:8000/health
# Expected: { "status": "ok" }
```

## License

PomoPal is licensed under the [MIT License](https://claude.ai/chat/LICENSE). You are free to use, modify, and distribute this project.

---

<div align="center">
Made with ❤️ by students, for students.
