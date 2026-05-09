import { useState, useEffect, useRef } from "react";

const API = "http://localhost:4000";

// --- small helper functions ---

function getStatusColor(status) {
  if (status === "running") return "#f59e0b";
  if (status === "done") return "#22c55e";
  if (status === "error") return "#ef4444";
  return "#6b7280";
}

function getLogColor(type) {
  if (type === "success") return "#22c55e";
  if (type === "error") return "#f87171";
  if (type === "step") return "#60a5fa";
  return "#9ca3af"; // info / default
}

function getStatusMessage(status) {
  if (status === "running") return "⏳ Bot is running, please wait...";
  if (status === "done") return "✅ Done! Bot finished successfully.";
  if (status === "error") return "❌ Something went wrong.";
  return "";
}

// --- main component ---

export default function App() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [logs, setLogs] = useState([]);
  const [screenshot, setScreenshot] = useState(null);

  const logsBottomRef = useRef(null);

  // auto-scroll logs to bottom whenever logs update
  useEffect(() => {
    logsBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // kick off the bot
  async function handleRunBot() {
    if (!url.trim()) {
      alert("Please enter a URL first!");
      return;
    }

    setStatus("running");
    setLogs([]);
    setScreenshot(null);

    try {
      const res = await fetch(`${API}/api/run-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!data.jobId) {
        addErrorLog(data.error || "Failed to start the bot.");
        setStatus("error");
        return;
      }

      // start polling for updates
      startPolling(data.jobId);

    } catch (err) {
      addErrorLog("Couldn't connect to backend on port 4000. Is it running?");
      setStatus("error");
    }
  }

  function addErrorLog(message) {
    setLogs([{ type: "error", message, time: new Date().toISOString() }]);
  }

  // poll the job status every 1.5s
  function startPolling(jobId) {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/job/${jobId}`);
        const job = await res.json();

        setLogs(job.logs || []);

        // show only the last screenshot
        if (job.screenshots?.length > 0) {
          const lastScreenshot = job.screenshots[job.screenshots.length - 1];
          setScreenshot(lastScreenshot.file);
        }

        if (job.status === "completed") {
          setStatus("done");
          clearInterval(timer);
        } else if (job.status === "failed") {
          setStatus("error");
          clearInterval(timer);
        }

      } catch (err) {
        // network error mid-poll — just stop
        clearInterval(timer);
      }
    }, 1500);
  }

  function handleReset() {
    setUrl("");
    setStatus("idle");
    setLogs([]);
    setScreenshot(null);
  }

  const isRunning = status === "running";

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>
          <span style={{ fontSize: "1.6rem" }}>⚡</span>
          <div>
            <h1 style={styles.appName}>AutoBot</h1>
            <p style={styles.appSubtitle}>SquareYards Automation — Internship Project 2026</p>
          </div>
        </div>

        {/* little status badge */}
        <div style={{
          ...styles.badge,
          background: isRunning ? "#fef3c722" : "#dcfce722",
          color: isRunning ? "#f59e0b" : "#22c55e",
          border: `1px solid ${isRunning ? "#f59e0b55" : "#22c55e55"}`,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isRunning ? "#f59e0b" : "#22c55e",
            display: "inline-block",
          }} />
          {isRunning ? "Bot Running" : "System Online"}
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={styles.main}>

        {/* URL input card */}
        <div style={styles.card}>
          <label style={styles.label}>Enter Target URL</label>

          <div style={styles.inputRow}>
            <input
              style={styles.input}
              type="text"
              placeholder="https://example.com/login"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isRunning && handleRunBot()}
              disabled={isRunning}
            />

            {isRunning ? (
              <button style={{ ...styles.btn, ...styles.btnDisabled }} disabled>
                Running...
              </button>
            ) : (
              <button
                style={styles.btn}
                onClick={status === "idle" ? handleRunBot : handleReset}
              >
                {status === "idle" ? "▶ Run Bot" : "↺ Reset"}
              </button>
            )}
          </div>

          {/* status message below input */}
          {status !== "idle" && (
            <p style={{ ...styles.statusMsg, color: getStatusColor(status) }}>
              {getStatusMessage(status)}
            </p>
          )}
        </div>

        {/* Logs + Screenshot (side by side if screenshot exists) */}
        {logs.length > 0 && (
          <div style={screenshot ? styles.twoCol : {}}>

            {/* Logs panel */}
            <div style={{ ...styles.card, flex: 1 }}>
              <label style={styles.label}>Execution Logs ({logs.length} entries)</label>
              <div style={styles.logBox}>
                {logs.map((log, i) => (
                  <div key={i} style={styles.logLine}>
                    <span style={styles.logTime}>
                      {new Date(log.time).toLocaleTimeString()}
                    </span>
                    <span style={{ ...styles.logType, color: getLogColor(log.type) }}>
                      [{log.type?.toUpperCase()}]
                    </span>
                    <span style={styles.logText}>{log.message}</span>
                  </div>
                ))}
                {/* dummy div to scroll to */}
                <div ref={logsBottomRef} />
              </div>
            </div>

            {/* Screenshot panel */}
            {screenshot && (
              <div style={{ ...styles.card, flex: 1 }}>
                <label style={styles.label}>📸 Screenshot</label>

                <div style={styles.screenshotWrapper}>
                  <img
                    src={`${API}/screenshots/${screenshot}`}
                    alt="Bot screenshot"
                    style={styles.screenshotImg}
                  />
                  <div style={styles.screenshotOverlay}>
                    <a
                      href={`${API}/screenshots/${screenshot}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.openBtn}
                    >
                      ↗ Open Full Image
                    </a>
                  </div>
                </div>

                <p style={styles.filename}>📁 {screenshot}</p>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        SquareYards Automation &amp; AI Tools Internship — 2026
      </footer>

    </div>
  );
}

// ── Styles ──
// Keeping everything in one place so it's easy to find and change.

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0d1117",
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.2rem 2rem",
    borderBottom: "1px solid #21262d",
  },

  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  appName: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#38bdf8",
    letterSpacing: "-0.5px",
  },

  appSubtitle: {
    margin: 0,
    fontSize: "0.7rem",
    color: "#6e7681",
    marginTop: "2px",
  },

  badge: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "4px 14px",
    borderRadius: "99px",
    fontSize: "0.78rem",
    fontWeight: 600,
  },

  main: {
    flex: 1,
    padding: "1.5rem 2rem",
  },

  card: {
    backgroundColor: "#161b22",
    border: "1px solid #21262d",
    borderRadius: "10px",
    padding: "1.4rem 1.6rem",
    marginBottom: "1.2rem",
  },

  label: {
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#6e7681",
    letterSpacing: "1.4px",
    textTransform: "uppercase",
    marginBottom: "0.8rem",
  },

  inputRow: {
    display: "flex",
    gap: "10px",
  },

  input: {
    flex: 1,
    padding: "10px 14px",
    backgroundColor: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "8px",
    color: "#e6edf3",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    outline: "none",
  },

  btn: {
    padding: "10px 22px",
    backgroundColor: "#238636",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.88rem",
    border: "1px solid #2ea043",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },

  btnDisabled: {
    backgroundColor: "#21262d",
    borderColor: "#30363d",
    color: "#8b949e",
    cursor: "not-allowed",
  },

  statusMsg: {
    marginTop: "10px",
    fontSize: "0.82rem",
    fontWeight: 600,
  },

  twoCol: {
    display: "flex",
    gap: "1.2rem",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },

  logBox: {
    backgroundColor: "#010409",
    borderRadius: "6px",
    padding: "0.8rem 1rem",
    maxHeight: "380px",
    overflowY: "auto",
    fontSize: "0.77rem",
    lineHeight: "1.8",
  },

  logLine: {
    display: "flex",
    gap: "8px",
    marginBottom: "1px",
  },

  logTime: {
    color: "#3d444d",
    minWidth: "75px",
    flexShrink: 0,
  },

  logType: {
    minWidth: "80px",
    fontWeight: 700,
    flexShrink: 0,
  },

  logText: {
    color: "#cdd9e5",
  },

  screenshotWrapper: {
    position: "relative",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #21262d",
  },

  screenshotImg: {
    width: "100%",
    display: "block",
  },

  screenshotOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "1rem",
    background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
    display: "flex",
    justifyContent: "flex-end",
  },

  openBtn: {
    backgroundColor: "#238636",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.8rem",
    fontWeight: 700,
    fontFamily: "inherit",
  },

  filename: {
    fontSize: "0.72rem",
    color: "#6e7681",
    marginTop: "0.6rem",
  },

  footer: {
    textAlign: "center",
    color: "#3d444d",
    fontSize: "0.72rem",
    padding: "1.5rem",
    borderTop: "1px solid #21262d",
  },
};