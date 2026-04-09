const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  connectionString: config.db.url,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL Database.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
