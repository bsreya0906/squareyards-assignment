require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { runBot } = require('./botEngine');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://squareyards-frontend.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE']
}));

app.use(express.json());

// Serve screenshots folder
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// In-memory job storage
const jobs = new Map();

// Root Route
app.get('/', (req, res) => {
  res.send('🚀 SquareYards Automation Backend Running');
});

// Run Bot API
app.post('/api/run-bot', async (req, res) => {
  const { url, username, password } = req.body;

  if (!url) {
    return res.status(400).json({
      error: 'URL is required'
    });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({
      error: 'Invalid URL format. Include http:// or https://'
    });
  }

  const jobId = uuidv4();

  const job = {
    id: jobId,
    status: 'pending',
    url,
    username: username || '',
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    logs: [],
    screenshots: [],
    summary: null,
    error: null
  };

  jobs.set(jobId, job);

  // Immediate Response
  res.json({
    jobId,
    message: 'Bot job created and queued',
    status: 'pending'
  });

  // Background Bot Execution
  (async () => {
    job.status = 'running';
    job.startedAt = new Date().toISOString();

    jobs.set(jobId, job);

    try {
      const result = await runBot(
        {
          url,
          username: username || '',
          password: password || '',
          jobId
        },
        (logEntry) => {
          job.logs.push(logEntry);
          jobs.set(jobId, job);
        }
      );

      if (result.success) {
        job.status = 'completed';
        job.summary = result.summary;
      } else {
        job.status = 'failed';
        job.error = result.error;
      }

      job.logs = result.logs;
      job.screenshots = result.screenshots;
      job.completedAt = new Date().toISOString();

      jobs.set(jobId, job);

    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
      job.completedAt = new Date().toISOString();

      jobs.set(jobId, job);
    }
  })();
});

// Get Single Job
app.get('/api/job/:id', (req, res) => {
  const job = jobs.get(req.params.id);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found'
    });
  }

  const { password, ...safeJob } = job;

  res.json(safeJob);
});

// Get All Jobs
app.get('/api/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values())
    .map(({ password, ...j }) => j)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(allJobs);
});

// Clear Jobs
app.delete('/api/jobs', (req, res) => {
  jobs.clear();

  res.json({
    message: 'All jobs cleared'
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    jobCount: jobs.size,
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
🚀 SquareYards Automation Backend Running
🌐 Port: ${PORT}
✅ Health Endpoint Ready
  `);
});

module.exports = app;