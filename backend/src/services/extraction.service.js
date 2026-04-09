const { GoogleGenAI } = require('@google/genai');
const config = require('../config/env');
const { callAiWithRetry, parseJsonFromAi } = require('../utils/ai.helper');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: config.ai.geminiApiKey });

const SCHEMA_PROMPT = `
You are an expert AI financial assistant. Extract structured financial data from this invoice.
Categorize the expense automatically (e.g., Marketing, Travel, Office Supplies, Utilities, Software, Refrigeration, etc.).

Return ONLY a valid JSON object matching this schema:
{
  "vendor": "String (Name of the company/vendor on the invoice)",
  "invoice_number": "String",
  "amount": "Number (Total amount payable including all taxes)",
  "taxable_value": "Number (Amount BEFORE tax is added, i.e. taxable base amount. If not explicit, calculate as amount - tax)",
  "tax": "Number (Total GST/tax amount paid. Sum of CGST+SGST or IGST)",
  "category": "String (categorize the expense)",
  "date": "String (YYYY-MM-DD format, invoice date)",
  "gstin": "String (Vendor GST Identification Number exactly as printed, or null)",
  "buyer_gstin": "String (Buyer or Bill-To party GSTIN exactly as printed, or null)",
  "email": "String (Vendor contact email, or null if not found)",
  "address": "String (Vendor physical address)",
  "payment_details": "String (Bank account, IFSC, UPI, etc.)",
  "line_items": [
     { "description": "String", "quantity": "Number", "unit_price": "Number", "subtotal": "Number" }
  ]
}
`;


/**
 * For image invoices: uses raw OCR text passed in from Tesseract.
 */
const extractStructuredData = async (rawText) => {
  const prompt = `${SCHEMA_PROMPT}\n\nRaw OCR Text:\n${rawText}`;

  try {
    const response = await callAiWithRetry(ai.models, {
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return parseJsonFromAi(response.text);
  } catch (error) {
    console.error('Gemini Extraction Error:', error);
    throw new Error('Gemini Error: ' + (error.message || 'Failed to extract structured data'));
  }
};

/**
 * For PDF invoices: sends the raw PDF bytes directly to Gemini Vision.
 * This handles both text-based PDFs AND scanned image-PDFs.
 */
const extractFromPDF = async (filePath) => {
  try {
    const pdfBytes = fs.readFileSync(filePath);
    const base64Data = pdfBytes.toString('base64');

    const response = await callAiWithRetry(ai.models, {
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data,
            }
          },
          { text: SCHEMA_PROMPT }
        ]
      },
      config: { responseMimeType: 'application/json' }
    });

    return parseJsonFromAi(response.text);
  } catch (error) {
    console.error('Gemini PDF Extraction Error:', error);
    // Fallback: try pdf-parse text extraction
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      if (pdfData.text && pdfData.text.trim().length > 50) {
        console.log('Falling back to pdf-parse text extraction...');
        return await extractStructuredData(pdfData.text);
      }
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr.message);
    }
    throw new Error('Failed to extract data from PDF. Please ensure the PDF contains a readable invoice.');
  }
};

module.exports = {
  extractStructuredData,
  extractFromPDF,
};
