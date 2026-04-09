const db = require('../config/database');
const { GoogleGenAI } = require('@google/genai');
const config = require('../config/env');
const { callAiWithRetry, parseJsonFromAi } = require('../utils/ai.helper');

const ai = new GoogleGenAI({ apiKey: config.ai.geminiApiKey });

/**
 * Aggregates per-vendor stats from the database.
 * Returns an array of vendor objects with risk indicators.
 */
const getVendorProfiles = async () => {
  // 1. Base stats per vendor
  const statsRes = await db.query(`
    SELECT
      vendor,
      COUNT(id)::int                             AS invoice_count,
      SUM(amount)::float                         AS total_spent,
      AVG(amount)::float                         AS avg_amount,
      MAX(amount)::float                         AS max_amount,
      MIN(amount)::float                         AS min_amount,
      STDDEV(amount)::float                      AS stddev_amount,
      COUNT(*) FILTER (WHERE is_anomaly)::int    AS anomaly_count
    FROM invoices
    GROUP BY vendor
    ORDER BY total_spent DESC
  `);

  // 2. Duplicate invoice detection per vendor (same amount appearing 2+ times)
  const dupRes = await db.query(`
    SELECT vendor, COUNT(*) AS dup_groups
    FROM (
      SELECT vendor, amount, COUNT(*) as cnt
      FROM invoices
      GROUP BY vendor, amount
      HAVING COUNT(*) > 1
    ) sub
    GROUP BY vendor
  `);
  const dupMap = {};
  dupRes.rows.forEach(r => { dupMap[r.vendor] = parseInt(r.dup_groups); });

  // 3. Price spike detection (invoices > 2x vendor average)
  const spikeRes = await db.query(`
    SELECT i.vendor, COUNT(*)::int AS spike_count
    FROM invoices i
    JOIN (
      SELECT vendor, AVG(amount) AS avg_amt FROM invoices GROUP BY vendor
    ) stats ON i.vendor = stats.vendor
    WHERE i.amount > stats.avg_amt * 2
    GROUP BY i.vendor
  `);
  const spikeMap = {};
  spikeRes.rows.forEach(r => { spikeMap[r.vendor] = r.spike_count; });

  // 4. Build vendor profiles with rule-based risk score
  const vendors = statsRes.rows.map(v => {
    const dupGroups  = dupMap[v.vendor] || 0;
    const spikeCount = spikeMap[v.vendor] || 0;

    // Risk scoring: each factor contributes
    let riskScore = 0;
    const warnings = [];

    if (dupGroups >= 2) {
      riskScore += 35;
      warnings.push(`Suspicious: ${dupGroups} duplicate invoice amount group(s) detected.`);
    } else if (dupGroups === 1) {
      riskScore += 15;
      warnings.push('One duplicate invoice amount group detected.');
    }

    if (spikeCount >= 2) {
      riskScore += 30;
      warnings.push(`${spikeCount} invoices are priced more than 2× this vendor's average (₹${v.avg_amount?.toFixed(2)}).`);
    } else if (spikeCount === 1) {
      riskScore += 15;
      warnings.push(`1 invoice is priced more than 2× this vendor's average (₹${v.avg_amount?.toFixed(2)}).`);
    }

    if (v.anomaly_count > 0) {
      riskScore += Math.min(v.anomaly_count * 10, 30);
      warnings.push(`${v.anomaly_count} invoice(s) flagged by fraud detection engine.`);
    }

    // High price volatility
    const cv = v.stddev_amount && v.avg_amount ? (v.stddev_amount / v.avg_amount) : 0;
    if (cv > 0.8 && v.invoice_count >= 3) {
      riskScore += 10;
      warnings.push('High price variability detected across invoices (CV > 80%).');
    }

    riskScore = Math.min(riskScore, 100);

    const riskLevel = riskScore >= 60 ? 'HIGH'
                    : riskScore >= 30 ? 'MEDIUM'
                    : 'LOW';

    return {
      vendor:        v.vendor,
      invoice_count: v.invoice_count,
      total_spent:   v.total_spent,
      avg_amount:    v.avg_amount,
      max_amount:    v.max_amount,
      min_amount:    v.min_amount,
      anomaly_count: v.anomaly_count,
      dup_groups:    dupGroups,
      spike_count:   spikeCount,
      risk_score:    riskScore,
      risk_level:    riskLevel,
      warnings,
    };
  });

  return vendors;
};

/**
 * Generates an AI-written analysis for vendors that have MEDIUM or HIGH risk.
 */
const enrichWithAIInsights = async (vendors) => {
  const risky = vendors.filter(v => v.risk_level !== 'LOW');
  if (!risky.length) return vendors;

  const summaryInput = risky.map(v => ({
    vendor:        v.vendor,
    total_spent:   v.total_spent,
    invoice_count: v.invoice_count,
    avg_amount:    v.avg_amount,
    dup_groups:    v.dup_groups,
    spike_count:   v.spike_count,
    anomaly_count: v.anomaly_count,
    risk_level:    v.risk_level,
    warnings:      v.warnings,
  }));

  const prompt = `
You are an expert AI Forensic Accountant. You are reviewing vendor behavior profiles that have been flagged by our rule-based detection system.
For each vendor, provide a SHORT, professional 1-2 sentence business impact statement explaining WHY this vendor is risky and what action the company should take.

Vendor Profiles (JSON):
${JSON.stringify(summaryInput, null, 2)}

Respond ONLY with a JSON array matching this schema:
[
  { "vendor": "Vendor Name", "ai_insight": "Your 1-2 sentence risk analysis and recommended action." }
]
`;

  try {
    const response = await callAiWithRetry(ai.models, {
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const insights = parseJsonFromAi(response.text);
    const insightMap = {};
    insights.forEach(i => { insightMap[i.vendor] = i.ai_insight; });

    return vendors.map(v => ({
      ...v,
      ai_insight: insightMap[v.vendor] || null,
    }));
  } catch (err) {
    console.error('AI Vendor Insight Error:', err.message);
    return vendors.map(v => ({ ...v, ai_insight: null }));
  }
};

const analyzeVendors = async () => {
  const vendors = await getVendorProfiles();
  const enriched = await enrichWithAIInsights(vendors);
  return enriched;
};

module.exports = { analyzeVendors };
