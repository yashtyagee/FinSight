const { GoogleGenAI } = require('@google/genai');
const config = require('../config/env');
const db = require('../config/database');
const { callAiWithRetry } = require('../utils/ai.helper');

const ai = new GoogleGenAI({ apiKey: config.ai.geminiApiKey });

const getContext = async () => {
  const statsRes = await db.query('SELECT COUNT(id) as count, SUM(amount) as total, AVG(amount) as avg FROM invoices');
  const catRes = await db.query('SELECT category, SUM(amount) as total FROM invoices GROUP BY category ORDER BY total DESC');
  const vendorRes = await db.query('SELECT vendor, SUM(amount) as total FROM invoices GROUP BY vendor ORDER BY total DESC LIMIT 5');
  const monthRes = await db.query("SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as total FROM invoices GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month ASC");
  
  // Gracefully handle if DB doesn't have is_anomaly yet (just in case migration failed)
  let fraudCount = 0;
  try {
      const fraudRes = await db.query('SELECT COUNT(*) as fraud_count FROM invoices WHERE is_anomaly = true');
      fraudCount = parseInt(fraudRes.rows[0]?.fraud_count) || 0;
  } catch (e) { /* ignore if column missing */ }
  
  return {
    overview: statsRes.rows[0] || {},
    categories: catRes.rows || [],
    topVendors: vendorRes.rows || [],
    monthlyTrend: monthRes.rows || [],
    anomaliesCount: fraudCount
  };
};

const getFinancialAdvice = async (userMessage) => {
  try {
    const contextData = await getContext();

    let ragContext = "";
    try {
      // Fetch specific insights from the RAG pipeline (FastAPI)
      const ragResponse = await fetch('http://127.0.0.1:8000/finai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });
      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        if (ragData && ragData.answer) {
          ragContext = `\nSpecific Invoice Document Insights (from RAG):\n${ragData.answer}\n`;
        }
      }
    } catch (err) {
      console.warn('RAG Pipeline unreachable:', err.message);
    }

    const prompt = `
You are an expert AI Financial Advisor and Accountant for a business. The user is asking you a question about their company expenses.
Use the following database context and RAG document insights to provide accurate, insightful, and professional advice. 

Financial Context Dataset (Aggregated Stats):
${JSON.stringify(contextData, null, 2)}
${ragContext}
User Question: ${userMessage}
`;

    const systemInstruction = `You are FinAi, a professional AI financial advisor and accountant. Always base answers STRICTLY on the dataset provided. Be precise, analytical, and helpful.

FORMATTING RULES (IMPORTANT):
- Use **bold** for key numbers, amounts, vendor names, and important terms
- Use ## or ### headers to organize sections in your answer
- Use bullet points (- ) for lists of items or insights
- Use numbered lists (1. 2. 3.) for step-by-step recommendations  
- Keep paragraphs short (2-3 sentences max)
- Always start with a brief direct answer, then provide details
- Never use raw code blocks or tables — use formatted text only
- Sign off as "FinAi" if appropriate`;
    const response = await callAiWithRetry(ai.models, {
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction }
    });

    return response.text;
  } catch (error) {
    console.error('AI Advisor Error:', error);
    throw new Error('Failed to generate AI advice');
  }
};

const getHealthScore = async () => {
    try {
        const contextData = await getContext();
        const prompt = `
You are an expert AI Financial Auditor. Analyze this company's financial data.
Your goal is to generate a business financial health score from 0 to 100.
Deduct points for:
- Having anomalies or suspicious invoices.
- Having a low volume of total invoices.
- Extremely imbalanced spending (e.g. 90% in one non-essential category).
- Highly erratic or declining month-to-month spending patterns.

Give credit for:
- Diverse, distributed spending.
- Zero anomalies.
- Stable expense tracking.

Return EXACTLY a JSON payload matching this schema:
{
  "score": 85,
  "explanation": "String (why you gave this score in 2 concise sentences)",
  "insights": [
    "String (Actionable cost optimization 1)",
    "String (Actionable cost optimization 2)"
  ]
}

Financial Context:
${JSON.stringify(contextData, null, 2)}
`;
        const response = await callAiWithRetry(ai.models, {
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        return JSON.parse(response.text);
    } catch(err) {
        console.error('Health Score Error', err);
        return { 
            score: 0, 
            explanation: 'Failed to generate health score due to an AI error.', 
            insights: [] 
        };
    }
}

module.exports = {
  getFinancialAdvice,
  getHealthScore
};
