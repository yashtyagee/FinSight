const db = require('../config/database');

const initDB = async () => {
  const createTable = `
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      vendor VARCHAR(255) NOT NULL,
      invoice_number VARCHAR(100),
      amount NUMERIC(15, 2) NOT NULL,
      tax NUMERIC(15, 2) DEFAULT 0,
      category VARCHAR(100),
      date DATE,
      gstin VARCHAR(50),
      email VARCHAR(255),
      is_anomaly BOOLEAN DEFAULT FALSE,
      anomaly_reasons TEXT,
      file_path TEXT,
      taxable_value NUMERIC(15, 2) DEFAULT 0,
      cgst_amount NUMERIC(15, 2) DEFAULT 0,
      sgst_amount NUMERIC(15, 2) DEFAULT 0,
      igst_amount NUMERIC(15, 2) DEFAULT 0,
      gst_type VARCHAR(20),
      transaction_type VARCHAR(10),
      buyer_gstin VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // For existing databases — add missing columns safely
  const addColumns = [
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS file_path TEXT',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS taxable_value NUMERIC(15,2) DEFAULT 0',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(15,2) DEFAULT 0',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(15,2) DEFAULT 0',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(15,2) DEFAULT 0',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst_type VARCHAR(20)',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(10)',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_gstin VARCHAR(50)',
  ];

  try {
    await db.query(createTable);
    for (const q of addColumns) {
      await db.query(q);
    }
    console.log('Invoices table checked/created with all GST columns.');
  } catch (err) {
    console.error('Error initializing db', err);
  }
};

const createInvoice = async (invoiceData, fraudData = { isAnomaly: false, reasons: '' }, filePath = null) => {
  const queryText = `
    INSERT INTO invoices (
      vendor, invoice_number, amount, tax, category, date, gstin, email,
      is_anomaly, anomaly_reasons, file_path,
      taxable_value, cgst_amount, sgst_amount, igst_amount,
      gst_type, transaction_type, buyer_gstin
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING *;
  `;
  const values = [
    invoiceData.vendor,
    invoiceData.invoice_number,
    invoiceData.amount         || 0,
    invoiceData.tax            || 0,
    invoiceData.category       || 'Uncategorized',
    invoiceData.date           || new Date().toISOString().split('T')[0],
    invoiceData.gstin          || null,
    invoiceData.email          || null,
    fraudData.isAnomaly,
    fraudData.reasons,
    filePath                   || null,
    invoiceData.taxable_value  || (invoiceData.amount - invoiceData.tax) || 0,
    invoiceData.cgst_amount    || 0,
    invoiceData.sgst_amount    || 0,
    invoiceData.igst_amount    || 0,
    invoiceData.gst_type       || null,
    invoiceData.transaction_type || null,
    invoiceData.buyer_gstin    || null,
  ];

  const { rows } = await db.query(queryText, values);
  return rows[0];
};

const getAllInvoices = async () => {
  const queryText = `SELECT *, 
    CASE WHEN file_path IS NOT NULL 
      THEN 'http://localhost:5001/' || file_path 
      ELSE NULL 
    END AS file_url
    FROM invoices ORDER BY created_at DESC;`;
  const { rows } = await db.query(queryText);
  return rows;
};

// Check for duplicates (same vendor, number, and amount)
const findDuplicate = async (invoiceData) => {
  const queryText = `
    SELECT * FROM invoices 
    WHERE vendor = $1 AND invoice_number = $2 AND amount = $3
  `;
  const values = [invoiceData.vendor, invoiceData.invoice_number, invoiceData.amount];
  const { rows } = await db.query(queryText, values);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = {
  initDB,
  createInvoice,
  getAllInvoices,
  findDuplicate
};
