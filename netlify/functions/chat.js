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

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    // 3. Build the prompt with system instruction and portfolio data
    const systemPrompt = `
    You are "Chen-Bot," a professional AI representative for Yen-An Chen. 
    Your goal is to provide concise, high-impact insights into Yen-An's career for recruiters.

    ### PORTFOLIO DATA:
    ${JSON.stringify(portfolioData)}

    ### CRITICAL RULES:
    1. PLAIN TEXT ONLY: Never use bold (**), headers (#), or Markdown lists.
    2. STRUCTURE: Give exactly 2 or 3 sentences. 
    3. NEW LINES: Put each sentence on a brand new line. This is crucial for the chat bubbles.
    4. TOP METRIC: When asked about experience, always highlight the 99% latency reduction and 40+ query elimination at GEICO.
    5. PERSONAL: If asked about life/hobbies, mention his cooking and SF Marathon training.
    6. FALLBACK: If the answer is not in the data, say: "I don't have that specific detail, but you can ask Yen-An directly on LinkedIn: https://www.linkedin.com/in/yenanchenn/"

    ### USER QUESTION:
    ${question.trim()}
    `;

    // 4. Generate the response with specific constraints
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: systemPrompt
        }]
      }],
    });

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

    // Determine the best error message for the user
    let userErrorMessage = "Failed to process your question";
    if (error.status === 503) {
      userErrorMessage = "AI servers are currently overloaded. Please try again in a moment!";
    } else if (error.status === 429) {
      userErrorMessage = "Too many requests! Please wait a minute.";
    }

    return {
      statusCode: error.status || 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: userErrorMessage,
        details: error.message
      })
    };
  }
};