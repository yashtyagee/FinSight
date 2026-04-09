/**
 * Helper to call Gemini AI with automatic retries for temporary errors (like 503).
 */
const callAiWithRetry = async (aiModel, params, retries = 4, delay = 1000) => {
    let currentModel = params.model || 'gemini-2.5-flash';
    
    // AI Fallback pool to magically bypass Free-Tier Quotas
    const fallbacks = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-flash-latest'
    ];
    let fallbackIndex = 0;

    for (let i = 0; i < retries; i++) {
        try {
            return await aiModel.generateContent({ ...params, model: currentModel });
        } catch (error) {
            const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
            const isRetryable = error.status === 503 || isRateLimit;
            const isLastAttempt = i === retries - 1;

            if (isRetryable && !isLastAttempt) {
                // If Quota Exhausted (429), automatically migrate to the next available model
                if (isRateLimit && fallbacks[fallbackIndex]) {
                    console.warn(`[AI System] Quota Exceeded on ${currentModel}. Hot-swapping to fallback model: ${fallbacks[fallbackIndex]}`);
                    currentModel = fallbacks[fallbackIndex];
                    fallbackIndex++;
                } else {
                    console.warn(`[AI System] API busy (Status: ${error.status}). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; // Exponential backoff
                }
                continue;
            }
            throw error;
        }
    }
};

const parseJsonFromAi = (text) => {
    try {
        if (!text) return {};
        let clean = text.trim();
        
        // Remove markdown formatting if Gemini wrapped it
        if (clean.startsWith('```json')) clean = clean.substring(7);
        else if (clean.startsWith('```')) clean = clean.substring(3);
        if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
        
        // Find actual JSON bounds in case there's text before/after
        const firstBrace = clean.indexOf('{');
        const firstBracket = clean.indexOf('[');
        const lastBrace = clean.lastIndexOf('}');
        const lastBracket = clean.lastIndexOf(']');
        
        let startIdx = -1;
        let endIdx = -1;
        
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startIdx = firstBrace;
            endIdx = lastBrace;
        } else if (firstBracket !== -1) {
            startIdx = firstBracket;
            endIdx = lastBracket;
        }
        
        if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
            clean = clean.substring(startIdx, endIdx + 1);
        }

        // Replace literal unescaped newlines/tabs inside strings which break JSON.parse
        clean = clean.replace(/[\n\r\t]+/g, ' ');

        return JSON.parse(clean);
    } catch (e) {
        console.error('Failed to parse AI JSON:', e.message);
        throw e;
    }
}

module.exports = {
    callAiWithRetry,
    parseJsonFromAi
};
