require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/database');

async function seed() {
  const rows = [
    ['N.S. Refrigeration Co.', 'INV-DUP-001', 15000, 2700, 'Refrigeration', '2024-01-15', '07ACZPN6029K1ZT', false, ''],
    ['N.S. Refrigeration Co.', 'INV-DUP-002', 15000, 2700, 'Refrigeration', '2024-02-15', '07ACZPN6029K1ZT', false, ''],
    ['N.S. Refrigeration Co.', 'INV-SPIKE',   95000,17100, 'Refrigeration', '2024-03-10', null,              true,  'Suspiciously high amount compared to vendor average'],
    ['Cloudware Pvt Ltd',      'CW-001',        8500, 1530, 'Software',      '2024-01-20', null, false, ''],
    ['Cloudware Pvt Ltd',      'CW-002',        8500, 1530, 'Software',      '2024-02-20', null, false, ''],
    ['Cloudware Pvt Ltd',      'CW-003',        8500, 1530, 'Software',      '2024-03-20', null, false, ''],
    ['Cloudware Pvt Ltd',      'CW-SPIKE',     42000, 7560, 'Software',      '2024-04-05', null, true,  'Price spike detected: 5x above vendor average'],
  ];

  for (const r of rows) {
    await db.query(
      'INSERT INTO invoices (vendor,invoice_number,amount,tax,category,date,gstin,is_anomaly,anomaly_reasons) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      r
    );
    console.log('Inserted:', r[0], r[1]);
  }
  console.log('\nAll test data seeded!');
  process.exit(0);
}

seed().catch(e => { console.error('SEED ERROR:', e.message); process.exit(1); });
