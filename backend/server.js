const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB, getLastDbError } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';
  const rawUri = process.env.MONGO_URI || '';
  const maskedUri = rawUri ? rawUri.replace(/:([^@]+)@/, ':****@') : 'NOT_SET';

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: dbStatus,
    hasMongoUri: Boolean(process.env.MONGO_URI),
    mongoUriPreview: maskedUri,
    dbError: getLastDbError()
  });
});

// Reject database queries early with helpful message if DB is not connected
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database is not connected. In Render, please verify MONGO_URI in Environment tab, and in MongoDB Atlas ensure Network Access has 0.0.0.0/0 allowed.'
    });
  }
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(distPath));

  // SPA fallback for all non-API GET requests (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.resolve(distPath, 'index.html'));
    }
    next();
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const isWindows = process.platform === 'win32';
const HOST = isWindows && process.env.NODE_ENV !== 'production' ? '::' : '0.0.0.0';

const { startOverdueScheduler } = require('./services/overdueChecker');

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT} (host: ${HOST})`);
  startOverdueScheduler();
});
