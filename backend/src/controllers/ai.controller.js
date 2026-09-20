const GROQ_MODELS = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'groq/compound',
    'groq/compound-mini',
    'canopylabs/orpheus-v1-english',
    'allam-2-7b'
];

const SYSTEM_PROMPT = "You are TeamMeet AI Mentor. Help users with TeamMeet features, meeting tips, and troubleshooting. Respond concisely, clearly, and friendly.";

export const aiChat = async (req, res) => {
    console.log("=== AI Chat Request Received ===");
    console.log("Request body:", req.body);
    console.log("GROQ_API_KEY loaded:", process.env.GROQ_API_KEY ? `Yes (starts with: ${process.env.GROQ_API_KEY.substring(0, 10)}...)` : "No!");

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, message: "Invalid messages format" });
        }

        const cleanedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const requestBody = {
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...cleanedMessages
            ],
            max_tokens: 800,
            temperature: 0.7
        };

        let lastError = null;
        let usedModel = null;

        for (const model of GROQ_MODELS) {
            try {
                console.log(`Trying model: ${model}`);
                usedModel = model;

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model,
                        ...requestBody
                    })
                });

                const data = await response.json();
                console.log(`Model ${model} response status: ${response.status}`);

                if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                    console.log(`Success using model: ${model}`);
                    return res.status(200).json({
                        success: true,
                        content: data.choices[0].message.content,
                        model: usedModel
                    });
                } else {
                    lastError = data.error?.message || `Model ${model} returned invalid response`;
                    console.log(`Model ${model} failed: ${lastError}`);
                }
            } catch (err) {
                lastError = err.message;
                console.log(`Model ${model} threw error: ${lastError}`);
            }
        }

        console.log("All models failed. Last error:", lastError);
        return res.status(500).json({
            success: false,
            message: lastError || "All AI models are currently unavailable. Please try again later."
        });

    } catch (error) {
        console.error("AI Chat Error:", error);
        return res.status(500).json({ success: false, message: "Error processing AI request: " + error.message });
    }
};
