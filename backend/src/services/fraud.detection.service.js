const { GoogleGenAI } = require('@google/genai');
const config = require('../config/env');
const db = require('../config/database');
const { callAiWithRetry, parseJsonFromAi } = require('../utils/ai.helper');

const ai = new GoogleGenAI({ apiKey: config.ai.geminiApiKey });

const runFraudRules = async (invoiceData) => {
  const anomalies = [];

  // Rule 1: Compliance - Missing critical info
  if (!invoiceData.vendor || invoiceData.vendor.toLowerCase() === 'unknown' || invoiceData.vendor.trim() === '') {
    anomalies.push('Missing or unidentifiable vendor information');
  }
  
  if (!invoiceData.amount || invoiceData.amount <= 0) {
    anomalies.push('Invalid invoice amount');
  }

  // Rule 2: Anomalies - Abnormal tax percentage (> 30% of amount)
  if (invoiceData.amount > 0 && typeof invoiceData.tax === 'number') {
    const taxPercent = (invoiceData.tax / invoiceData.amount) * 100;
    if (taxPercent > 30) {
      anomalies.push(`Inconsistent data: Tax percentage is unusually high (${taxPercent.toFixed(1)}%)`);
    }
  } else if (!invoiceData.tax && invoiceData.tax !== 0) {
      anomalies.push('Missing tax information');
  }

  // NEW RULE: GSTIN Regex Validation (India Specific)
  if (invoiceData.gstin && invoiceData.gstin.toLowerCase() !== 'null' && invoiceData.gstin !== 'Unknown') {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(invoiceData.gstin.toUpperCase())) {
      anomalies.push(`Invalid GSTIN format detected: ${invoiceData.gstin}`);
    }
  }

  // NEW RULE: Mathematical Consistency
  if (invoiceData.line_items && Array.isArray(invoiceData.line_items) && invoiceData.line_items.length > 0) {
    const calculatedSubtotal = invoiceData.line_items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
    const statedTax = parseFloat(invoiceData.tax) || 0;
    const statedTotal = parseFloat(invoiceData.amount) || 0;
    
    // Allow a small rounding margin of error (e.g. 2 rupees)
    if (Math.abs((calculatedSubtotal + statedTax) - statedTotal) > 2) {
      anomalies.push(`Mathematical Inconsistency: Line items subtotal (₹${calculatedSubtotal.toFixed(2)}) + tax (₹${statedTax.toFixed(2)}) does not match stated total (₹${statedTotal.toFixed(2)})`);
    }
  }

  // NEW RULE: Suspicious Free Email Domains for B2B
  if (invoiceData.email && invoiceData.email.toLowerCase() !== 'null' && invoiceData.amount > 10000) {
    const freeDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'];
    if (freeDomains.some(domain => invoiceData.email.toLowerCase().includes(domain))) {
      anomalies.push(`Suspicious: High-value B2B invoice (₹${invoiceData.amount}) originates from a free personal email address (${invoiceData.email})`);
    }
  }

  try {
    // Rule 3: Anomalies - Suspiciously high amount (> 3x historic average)
    const avgQuery = await db.query('SELECT AVG(amount) as avg_amount FROM invoices');
    const avgAmount = avgQuery.rows[0]?.avg_amount ? parseFloat(avgQuery.rows[0].avg_amount) : 0;
    
    // Only flag if we actually have some history to compare against and it exceeds a minimum threshold
    if (avgAmount > 0 && invoiceData.amount > 500 && invoiceData.amount > avgAmount * 3) {
      anomalies.push(`Suspiciously high amount: ₹${invoiceData.amount} (Historic average is ₹${avgAmount.toFixed(2)})`);
    }

    // Rule 4: Fraud - Duplicate Invoice
    if (invoiceData.vendor && invoiceData.invoice_number && invoiceData.invoice_number !== 'Unknown') {
        const dupQuery = await db.query(
            'SELECT id FROM invoices WHERE vendor = $1 AND invoice_number = $2',
            [invoiceData.vendor, invoiceData.invoice_number]
        );
        if (dupQuery.rows.length > 0) {
            anomalies.push('Duplicate invoice detected based on vendor and invoice number');
        }
    }
  } catch (err) {
    console.error('Fraud engine db check failed', err);
  }

  // NEW RULE: Machine Learning Outlier Pass (Gemini)
  try {
      const mlPrompt = `
      You are a Machine Learning Anomaly Detection classification algorithm. 
      Your job is to strictly analyze the following parsed invoice JSON for any signs of logical inconsistencies, unrealistic/bizarre pricing patterns, unusual descriptions, or other suspicious anomalies not easily caught by hardcoded regex rules.
      
      Invoice JSON:
      ${JSON.stringify(invoiceData, null, 2)}
      
      Return EXACTLY a JSON matching this schema:
      {
        "is_fraud_suspected": boolean,
        "reason": "String (explain exactly why it looks suspicious, or null if it looks clean)"
      }
      `;
      const response = await callAiWithRetry(ai.models, {
        model: 'gemini-2.5-flash',
        contents: mlPrompt,
        config: { responseMimeType: "application/json" }
      });
      const mlResult = parseJsonFromAi(response.text);
      if (mlResult.is_fraud_suspected && mlResult.reason) {
          anomalies.push(`ML Pattern Anomaly: ${mlResult.reason}`);
      }
  } catch (err) {
      console.error('ML Fraud Pass Error:', err);
  }

  return {
    isAnomaly: anomalies.length > 0,
    reasons: anomalies.join(' | ')
  };
};

module.exports = {
  runFraudRules
};
