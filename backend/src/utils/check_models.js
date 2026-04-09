const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBuSVfRL1vJVDRGzDiridHF5exODIQF2C0'});
async function run() {
    try {
        const res = await ai.models.list();
        for await (const m of res) {
            console.log(m.name);
        }
    } catch (e) {
        console.error(e.message);
    }
}
run();
