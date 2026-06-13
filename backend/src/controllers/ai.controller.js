export const aiChat = async (req, res) => {
    console.log("=== AI Chat Request Received ===");
    console.log("Request body:", req.body);
    console.log("GROQ_API_KEY loaded:", process.env.GROQ_API_KEY ? `Yes (starts with: ${process.env.GROQ_API_KEY.substring(0, 10)}...)` : "No!");
    
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, message: "Invalid messages format" });
        }

        // Clean messages to only include role and content
        const cleanedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        console.log("Calling Groq API with cleaned messages:", cleanedMessages);

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
                    ...cleanedMessages
                ]
            })
        });

        console.log("Groq API response status:", response.status);
        const data = await response.json();
        console.log("Groq API response data:", data);

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            console.log("Returning success response");
            return res.status(200).json({ success: true, content: data.choices[0].message.content });
        } else {
            console.log("Invalid Groq response:", data);
            return res.status(500).json({ success: false, message: data.error?.message || "Invalid response from Groq API" });
        }
    } catch (error) {
        console.error("AI Chat Error:", error);
        return res.status(500).json({ success: false, message: "Error processing AI request: " + error.message });
    }
};
