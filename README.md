<<<<<<< HEAD
# 🤖 Automation Workflow & Bot Execution System
> SquareYards Internship Assignment — Task 1  
> Built with React.js (Frontend) + Node.js (Backend) + Playwright (Bot Engine)
---
## 🏗️ System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React.js)                   │
│  ┌──────────┐  ┌─────────────┐  ┌───────────────────────┐  │
│  │ URL Input│  │  Bot Config │  │  Live Status Dashboard │  │
│  │ + Login  │  │  + Actions  │  │  + Logs + Screenshots  │  │
│  └──────────┘  └─────────────┘  └───────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP REST API
┌─────────────────────────▼───────────────────────────────────┐
│                     BACKEND (Node.js + Express)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  /run-bot    │  │  /job-status │  │   /logs/:jobId   │  │
│  │  API Route   │  │  API Route   │  │   API Route      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                  │                                  │
│  ┌──────▼──────────────────▼──────────────────────────────┐ │
│  │              Job Queue (BullMQ / In-Memory)             │ │
│  └──────────────────────────┬───────────────────────────── ┘ │
└─────────────────────────────┼───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    BOT ENGINE (Playwright)                    │
│  Step 1: Open Browser (Headless)                            │
│  Step 2: Navigate to URL                                    │
│  Step 3: Fill login form                                    │
│  Step 4: Execute user-defined actions                       │
│  Step 5: Take screenshots                                   │
│  Step 6: Save logs                                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    DATABASE + STORAGE                        │
│  SQLite (jobs, logs, status)  |  /screenshots folder        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀Setup & Run Instructions

### Prerequisites
- Node.js v18+ installed
- npm installed

### 1. Clone / Download the Project
```bash
git clone <your-repo-url>
cd automation-bot-system
```

### 2. Setup Backend
```bash
cd backend
npm install
npx playwright install chromium
node server.js
```
Backend runs on: `http://localhost:4000/api/health`

### 3. Setup Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm start
```
Frontend runs on: `http://localhost:5173/`

## 📁 Project Structure

```
automation-bot-system/
├── frontend/               # React.js UI
│   ├── src/
│   │   ├── App.js          # Main App
│   │   ├── components/
│   │   │   ├── BotForm.js      # Input form
│   │   │   ├── StatusPanel.js  # Live status display
│   │   │   └── LogViewer.js    # Log display
│   │   └── styles/
│   │       └── App.css
│   └── package.json
├── backend/                # Node.js + Express
│   ├── server.js           # Main server + API routes
│   ├── botEngine.js        # Playwright automation logic
│   ├── screenshots/        # Auto-created, stores bot screenshots
│   └── package.jso
└── README.md               # This file
```

---

## 🔑 Environment Variables

Create a `.env` file in `/backend/`:
```
PORT=4000
SCREENSHOT_DIR=./screenshots


