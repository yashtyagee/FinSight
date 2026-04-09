const fs = require('fs');
const ocrService = require('../services/ocr.service');
const extractionService = require('../services/extraction.service');
const fraudService = require('../services/fraud.detection.service');
const InvoiceModel = require('../models/invoice.model');
const { categorizeGST } = require('../services/gst.categorization.service');

// Initialize database tables on start
InvoiceModel.initDB();

// Company's own GSTIN (buyer) — can be set via env or config
const COMPANY_GSTIN = process.env.COMPANY_GSTIN || null;

const uploadInvoice = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Keep the file for viewing later
    const filePath = `uploads/${req.file.filename}`;

    let structuredData;
    if (req.file.mimetype === 'application/pdf') {
      console.log('Processing PDF via Gemini Vision...');
      structuredData = await extractionService.extractFromPDF(req.file.path);
    } else {
      const rawText = await ocrService.processDocument(req.file);
      structuredData = await extractionService.extractStructuredData(rawText);
    }

    // GST Categorization
    const gstData = categorizeGST(structuredData, COMPANY_GSTIN);
    
    // Merge GST fields into structured data
    const enrichedData = {
      ...structuredData,
      taxable_value:    gstData.taxable_value,
      cgst_amount:      gstData.cgst_amount,
      sgst_amount:      gstData.sgst_amount,
      igst_amount:      gstData.igst_amount,
      gst_type:         gstData.gst_type,
      transaction_type: gstData.transaction_type,
      buyer_gstin:      gstData.buyer_gstin || structuredData.buyer_gstin,
    };

    // Fraud & Compliance check
    const fraudData = await fraudService.runFraudRules(enrichedData);

    const isDuplicate = await InvoiceModel.findDuplicate(enrichedData);
    if (isDuplicate) {
      return res.status(409).json({
        success: true,
        message: 'Exact duplicate invoice detected based on vendor, invoice number, and amount.',
        data: enrichedData,
        gst: gstData,
        saved: false,
        anomalies: fraudData
      });
    }

    // Save to Database
    const savedInvoice = await InvoiceModel.createInvoice(enrichedData, fraudData, filePath);

    let finalMessage = 'Invoice processed and saved successfully';
    if (fraudData.isAnomaly) {
      finalMessage = 'ALERT: Invoice saved but flagged for anomalies.';
    }

    res.status(200).json({
      success: true,
      data: {
        ...savedInvoice,
        file_url: savedInvoice.file_path ? `http://localhost:5001/${savedInvoice.file_path}` : null,
      },
      gst: gstData,
      message: finalMessage,
      anomalies: fraudData
    });
  } catch (error) {
    next(error);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const invoices = await InvoiceModel.getAllInvoices();
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadInvoice, getInvoices };
