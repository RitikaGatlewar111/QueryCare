const cors = require('cors');
const express = require('express');
const documentRoutes = require('./routes/documentRoutes');
const retrievalRoutes = require('./routes/retrievalRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const viteDevelopmentOrigin = /^http:\/\/(localhost|127\.0\.0\.1):517\d+$/;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || viteDevelopmentOrigin.test(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
}));
app.use(express.json({ limit: '10kb' }));

app.get('/', (request, response) => {
  response.json({
    message: 'Welcome to the QueryCare API',
    status: 'running',
  });
});

app.use('/api/documents', documentRoutes);
app.use('/api/retrieval', retrievalRoutes);
app.use('/api/chat', chatRoutes);

module.exports = app;
