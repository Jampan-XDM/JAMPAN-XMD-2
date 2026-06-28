const axios = require('axios');

/**
 * Mfumo mkuu wa AI unaounganisha mitambo yote ya JAMPAN-XMD
 * @param {string} prompt - Maagizo ya mfumo / Identity
 * @param {string} text - Swali la mtumiaji
 * @returns {Promise<string>} - Jibu kutoka kwa AI
 */
async function fetchAIResponse(prompt, text) {
    const fullQuery = `${prompt}\nInput: ${text}`;
    
    try {
        // Engine ya Kwanza: Gifted Tech AI
        const response = await axios.get(`https://api.giftedtech.my.id/api/ai/gpt4?apikey=gifted&q=${encodeURIComponent(fullQuery)}`);
        return response.data.result || response.data.response || null;
    } catch (err) {
        console.log("Gifted Tech AI Node offline, switching to Guru API...");
        try {
            // Engine ya Pili: Guru API
            const fallbackRes = await axios.get(`https://api.guruapi.tech/ai/gpt4?username=jampan&query=${encodeURIComponent(fullQuery)}`);
            return fallbackRes.data.msg || fallbackRes.data.result || null;
        } catch (fErr) {
            console.log("Guru API Node offline, switching to Sandip API...");
            try {
                // Engine ya Tatu: Sandip API
                const thirdRes = await axios.get(`https://api.sandipbbaruwal.onrender.com/gpt4?query=${encodeURIComponent(fullQuery)}`);
                return thirdRes.data.gpt4 || thirdRes.data.answer || null;
            } catch (tErr) {
                return "Mifumo yote ya AI kwa sasa hivi ipo busy. Tafadhali jaribu tena baadae.";
            }
        }
    }
}

module.exports = { fetchAIResponse };
