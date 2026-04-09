const Tesseract = require('tesseract.js');
// If handling PDF, we'd typically need something like pdf-parse as Tesseract is for images.
// For hackathon simplicity, we assume users upload JPG/PNG invoices.
// We can also add pdf-parse if necessary.
const fs = require('fs');
const pdfParse = require('pdf-parse');

const extractTextFromImage = async (filePath) => {
  try {
    const result = await Tesseract.recognize(filePath, 'eng', {
      // logger: m => console.log(m)
    });
    return result.data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
};

const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF Parse Error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

const processDocument = async (file) => {
  if (file.mimetype === 'application/pdf') {
    return await extractTextFromPDF(file.path);
  } else {
    return await extractTextFromImage(file.path);
  }
};

module.exports = {
  processDocument
};
