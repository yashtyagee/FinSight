const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/upload');
const invoiceController = require('../controllers/invoiceController');
const InvoiceModel = require('../models/invoice.model');
const { generateXLSX, generateCSV, generateJSON } = require('../services/export.service');

// POST /api/invoices/upload
router.post('/upload', uploadMiddleware.single('invoice'), invoiceController.uploadInvoice);

// GET /api/invoices
router.get('/', invoiceController.getInvoices);

// GET /api/invoices/export?format=xlsx|csv|json
router.get('/export', async (req, res, next) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const invoices = await InvoiceModel.getAllInvoices();
    const date = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      const buffer = generateXLSX(invoices);
      res.setHeader('Content-Disposition', `attachment; filename=FinSight_GST_Filing_${date}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    if (format === 'csv') {
      const csv = generateCSV(invoices);
      res.setHeader('Content-Disposition', `attachment; filename=FinSight_GST_Filing_${date}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    // Default: JSON
    const json = generateJSON(invoices);
    res.setHeader('Content-Disposition', `attachment; filename=FinSight_GST_Filing_${date}.json`);
    res.setHeader('Content-Type', 'application/json');
    return res.json(json);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

