const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  db: {
    url: process.env.DATABASE_URL
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY
  }
};
