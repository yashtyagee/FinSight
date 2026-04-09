const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
// Routes will be imported here
const invoiceRoutes = require('./routes/invoices.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const advisorRoutes = require('./routes/advisor.routes');
const vendorRoutes = require('./routes/vendor.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded invoices as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Setup Routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/vendors', vendorRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;

