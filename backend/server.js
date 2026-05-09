

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { runBot } = require('./botEngine');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-netlify-url.netlify.app'
  ],
  methods: ['GET', 'POST', 'DELETE']
}));

app.use(express.json());
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

const jobs = new Map();

app.post('/api/run-bot', async (req, res) => {
  const { url, username, password } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format. Include http:// or https://' });
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

  // Respond immediately
  res.json({ jobId, message: 'Bot job created and queued', status: 'pending' });

  // Run bot in background
  (async () => {
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    jobs.set(jobId, job);

    try {
      const result = await runBot(
        { url, username: username || '', password: password || '', jobId },
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
})
app.get('/api/job/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const { password, ...safeJob } = job;
  res.json(safeJob);
});
app.get('/api/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values())
    .map(({ password, ...j }) => j)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(allJobs);
});

app.delete('/api/jobs', (req, res) => {
  jobs.clear();
  res.json({ message: 'All jobs cleared' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    jobCount: jobs.size,
    timestamp: new Date().toISOString()
  });
});
app.listen(PORT, () => {
  console.log(`
   🤖 Automation Bot Backend Running    
  Port: ${PORT}                           
   Health: http://localhost:${PORT}/api/health 
  `);
});

module.exports = app;