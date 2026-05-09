# 🤖 Automation Workflow & Bot Execution System
> SquareYards Internship Assignment — Task 1  
> Built with React.js (Frontend) + Node.js (Backend) + Playwright (Bot Engine)

---

## 📚 Part A — Concept Explanation (Read this before your interview!)

### ✅ What is Automation?
Automation means making a computer do repetitive tasks **by itself**, without a human clicking buttons every time.

**Example:** Instead of manually opening a website, logging in, and copy-pasting data every morning — you write a script once, and it does it automatically every day.

---

### ✅ Manual vs Automated Process

| Manual Process | Automated Process |
|---|---|
| Human clicks each button | Script clicks buttons automatically |
| Takes hours for 100 tasks | Takes minutes for 1000 tasks |
| Prone to human error | Consistent and error-free |
| Requires human availability | Runs 24/7, even at night |

---

### ✅ API Automation vs UI Automation

**API Automation:**
- Talks directly to the server (backend)
- Faster, more reliable
- Used when the website/app has an API endpoint
- Example: Sending a POST request to `https://api.example.com/login`

**UI Automation (what we build here):**
- Controls the actual browser like a human would
- Clicks buttons, fills forms, takes screenshots
- Used when there is NO API, only a website
- Tools: Selenium, Playwright, Puppeteer

> **Interview Tip:** Always prefer API automation if available. Use UI automation only when the website doesn't expose APIs.

---

### ✅ Selenium / Playwright / Puppeteer

| Tool | Language | Best For |
|---|---|---|
| **Selenium** | Java, Python, JS | Cross-browser testing, older systems |
| **Playwright** | JS/Python/Java | Modern browsers, faster, better reliability |
| **Puppeteer** | JavaScript only | Chrome/Chromium specific automation |

**We use Playwright** because:
- Works with Chrome, Firefox, and Safari
- Has built-in waiting mechanisms
- Faster than Selenium
- Better error messages

---

### ✅ Key Terms (Must Know for Interview)

**Headless Browser:**  
A browser that runs without a visible window. Like Chrome running in the background without opening on your screen. Used in servers where there's no display.

**WebDriver:**  
A protocol/interface that lets your code control a browser. Think of it as a "remote control" for Chrome or Firefox.

**XPath:**  
A way to locate elements on a webpage using their position in the HTML tree.  
Example: `//button[@id='login-btn']` finds a button with id "login-btn"

**CSS Selector:**  
Another way to find elements: `#login-btn` or `.submit-button`

**Cookies:**  
Small pieces of data stored by the browser that keep you "logged in" to websites. In automation, we can save and reuse cookies to avoid logging in every time.

**Wait Conditions:**
- **Hard Wait:** `await page.waitForTimeout(3000)` — just wait 3 seconds (bad practice)
- **Smart Wait:** `await page.waitForSelector('#element')` — wait until element appears (good practice)
- Smart waits make automation reliable even on slow networks

---

## 🏗️ Part B — System Design

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

## 🚀 Part C — Setup & Run Instructions

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
Backend runs on: `http://localhost:4000`

### 3. Setup Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm start
```
Frontend runs on: `http://localhost:3000`

### 4. Use the App
1. Open `http://localhost:3000`
2. Enter a website URL (e.g., `https://example.com`)
3. Enter login credentials (username/password)
4. Click "Run Automation Bot"
5. Watch real-time status updates
6. View logs and screenshots after completion

---

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
│   └── package.json
├── docs/
│   └── CONCEPTS.md         # Extended interview prep notes
└── README.md               # This file
```

---

## 🔑 Environment Variables

Create a `.env` file in `/backend/`:
```
PORT=4000
SCREENSHOT_DIR=./screenshots
```

---

## 🧠 Interview Prep Summary

| Question | Short Answer |
|---|---|
| What is Playwright? | A Node.js library to automate browsers |
| What is headless mode? | Browser runs without UI (no visible window) |
| Why use smart waits? | Pages load at different speeds; smart waits prevent crashes |
| API vs UI automation? | API is faster; UI is for when there's no API |
| What is XPath? | A path expression to locate HTML elements |
| What are cookies in automation? | Session data that keeps the bot "logged in" |
| What is a job queue? | A list of tasks to execute one by one |
| Why save screenshots? | Proof of execution + debugging failed runs |
