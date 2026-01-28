const {
    GoogleGenerativeAI
} = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    // Only allow POST requests from your frontend
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed"
        };
    }

    try {
        const {
            question
        } = JSON.parse(event.body);

        // Validate question
        if (!question || typeof question !== 'string' || !question.trim()) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "Please provide a valid question"
                })
            };
        }

        // 1. Load your portfolio.json from the root directory
        const dataPath = path.resolve(__dirname, '../../portfolio.json');
        const portfolioData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // 2. Initialize Gemini with your Netlify Environment Variable
        if (!process.env.GEMINI_API_KEY) {
            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "API key not configured"
                })
            };
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Use the cheaper/faster Flash-Lite model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite"
        });

        // 3. Build the prompt with system instruction and portfolio data
        const systemPrompt = `
  You are Yen-An Chen's professional AI Assistant. 
  Your goal is to represent Yen-An to recruiters and peers using the provided Portfolio Data.

  KEY GUIDELINES:
  1. CURRENT ROLE: Yen-An is a Software Engineer at GEICO. He is NOT currently a student.
  2. TOP ACHIEVEMENTS: Always highlight the 99% latency reduction at GEICO if asked about his experience.
  3. PERSONAL TOUCH: If asked about hobbies, mention he is training for the SF Marathon and loves cooking.
  4. WORK STYLE: He prefers Hybrid roles but is flexible.
  5. TECHNICAL PASSION: He is specifically interested in Distributed Systems.
  6. TONE: Be helpful, technical yet friendly, and concise.

  If a question cannot be answered using the data below, politely suggest they reach out to Yen-An via LinkedIn.

  Portfolio Data:
  ${JSON.stringify(portfolioData, null, 2)}

User Question: ${question.trim()}`;

        // 4. Generate the response
        const result = await model.generateContent(systemPrompt);
        const answer = result.response.text();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                answer
            }),
        };
    } catch (error) {
        console.error('Chat function error:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: "Failed to process your question",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};