export const aiChat = async (req, res) => {
    try {
        const { messages } = req.body;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: "system", content: "You are TeamMeet AI Mentor, a helpful and friendly assistant for TeamMeet video conferencing app. You help users with questions about TeamMeet features, meeting tips, troubleshooting, and general guidance. Keep responses concise and helpful." },
                    ...messages
                ]
            })
        });

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            return res.status(200).json({ success: true, content: data.choices[0].message.content });
        } else {
            return res.status(500).json({ success: false, message: "Invalid response from Groq API" });
        }
    } catch (error) {
        console.error("AI Chat Error:", error);
        return res.status(500).json({ success: false, message: "Error processing AI request" });
    }
};
