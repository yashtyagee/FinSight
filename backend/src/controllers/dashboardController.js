const db = require('../config/database');

const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Basic Stats (Total, Tax, Count, Avg)
    const statsQuery = 'SELECT COUNT(id) as invoice_count, SUM(amount) as total, SUM(tax) as total_tax, AVG(amount) as avg_amount FROM invoices';
    const statsRes = await db.query(statsQuery);
    const stats = statsRes.rows[0] || {};
    const total = parseFloat(stats.total) || 0;
    const total_tax = parseFloat(stats.total_tax) || 0;
    const invoice_count = parseInt(stats.invoice_count) || 0;
    const avg_amount = parseFloat(stats.avg_amount) || 0;

    // 2. Spending by Category
    const categoryQuery = 'SELECT category, SUM(amount) as value FROM invoices GROUP BY category ORDER BY value DESC';
    const categoryRes = await db.query(categoryQuery);

    // 3. Vendor analysis (By spent and count)
    const vendorQuery = 'SELECT vendor, SUM(amount) as total_spent, COUNT(*) as invoice_count FROM invoices GROUP BY vendor ORDER BY total_spent DESC LIMIT 5';
    const vendorRes = await db.query(vendorQuery);
    
    // Most frequent vendor trick
    const freqVendorQuery = 'SELECT vendor, COUNT(*) as invoice_count FROM invoices GROUP BY vendor ORDER BY invoice_count DESC LIMIT 5';
    const freqVendorRes = await db.query(freqVendorQuery);

    // 4. Monthly Trend
    const trendQuery = `
      SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as total
      FROM invoices
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
      LIMIT 12
    `;
    const trendRes = await db.query(trendQuery);

    // 5. Forecasting (Naive Moving Average of last 3 months)
    let next_month_forecast = 0;
    if (trendRes.rows.length > 0) {
      const recent = trendRes.rows.slice(-3); // Get up to last 3 months
      const recentSum = recent.reduce((sum, row) => sum + parseFloat(row.total), 0);
      next_month_forecast = recentSum / recent.length;
    }

    // 6. Anomalies / Flags
    const anomaliesQuery = 'SELECT id, vendor, invoice_number, amount, date, anomaly_reasons FROM invoices WHERE is_anomaly = true ORDER BY created_at DESC LIMIT 10';
    const anomaliesRes = await db.query(anomaliesQuery);

    res.status(200).json({
      success: true,
      data: {
        total_expenses: total,
        total_tax: total_tax,
        invoice_count: invoice_count,
        avg_invoice_value: avg_amount,
        next_month_forecast: next_month_forecast,
        by_category: categoryRes.rows,
        top_vendors: vendorRes.rows,
        frequent_vendors: freqVendorRes.rows,
        monthly_trend: trendRes.rows,
        anomalies: anomaliesRes.rows
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats
};
