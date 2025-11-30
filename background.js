// α-explain Background Service Worker

// Cache for explanations to reduce API calls
const explanationCache = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'explain') {
        handleExplanationRequest(request.text)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
});

async function handleExplanationRequest(text) {
    const cacheKey = text.toLowerCase().trim();
    if (explanationCache.has(cacheKey)) {
        return {
            success: true,
            explanation: explanationCache.get(cacheKey)
        };
    }

    try {
        const explanation = await getExplanation(text);

        explanationCache.set(cacheKey, explanation);

        if (explanationCache.size > 100) {
            const firstKey = explanationCache.keys().next().value;
            explanationCache.delete(firstKey);
        }

        return {
            success: true,
            explanation: explanation
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function getExplanation(term) {
    const { apiKey } = await chrome.storage.local.get('apiKey');

    if (!apiKey) {
        throw new Error('API key not configured. Please set it in the extension popup.');
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Explain the scientific term "${term}" in 2-3 clear sentences. Be direct and concise. Do not include any preamble like "here's an explanation" - start immediately with the definition and key concepts.`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            tools: [{
                googleSearch: {}
            }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 200
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
    }

    throw new Error('No explanation received from API');
}
