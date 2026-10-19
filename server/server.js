
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const assignmentRoutes = require('./routes/assignments');

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'CourseMate API',
    status: 'running',
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/assignments', assignmentRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error('API error:', err.message);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request is too large.',
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Invalid JSON request body.',
    });
  }

  res.status(err.status || 500).json({
    message:
      err.status && err.status < 500
        ? err.message
        : 'An unexpected server error occurred.',
  });
});

async function startServer() {
  if (!MONGODB_URI) {
    console.error('Startup failed: MONGODB_URI is missing from server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully!');

    app.listen(PORT, () => {
      console.log(`CourseMate API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

startServer();
