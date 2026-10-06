const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { User, Loan, Document, Repayment } = require('./models');
const authRoutes = require('./routes/authRoutes');
const loanRoutes = require('./routes/loanRoutes');
const documentRoutes = require('./routes/documentRoutes');
const repaymentRoutes = require('./routes/repaymentRoutes');
const auditRoutes = require('./routes/auditRoutes');
const { publicServerError } = require('./utils/publicError');

const app = express();

app.use(helmet());

const parseCorsOrigins = () => {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

app.use(
  cors({
    origin: parseCorsOrigins(),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB if not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB().catch((err) => {
    console.error('DB Connection initialization failed:', err.message);
  });
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'fail',
    message: 'Too many authentication attempts. Please try again later.',
  },
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/audit-logs', auditRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FPO Loan System Backend API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    modelsLoaded: {
      User: !!User,
      Loan: !!Loan,
      Document: !!Document,
      Repayment: !!Repayment,
    },
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: statusCode >= 500 ? publicServerError(err, 'Server error') : err.message,
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
