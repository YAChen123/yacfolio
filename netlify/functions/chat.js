const {
  GoogleGenerativeAI
} = require('@google/generative-ai');


const portfolioData = {
  "name": "Yen-An Chen",
  "current_role": "Software Engineer at GEICO",
  "tagline": "Full Stack Web Developer & Backend Systems Specialist",
  "education": "Master's in Computer Science from New York University (NYU)",
  "location": "Greater New York Area",
  "work_preferences": {
    "style": "Hybrid (Preferred)",
    "flexibility": "Flexible / Not mandatory"
  },
  "skills": {
    "languages": ["Go", "C#", "Java", "Python", "C", "C++", "SQL", "JavaScript"],
    "web_and_backend": ["Spring Boot", "React", "Redux", "PostgreSQL", "Redis", "DynamoDB"],
    "tools_and_infrastructure": ["Temporal", "Titan", "Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Git"]
  },
  "work_experience": [{
    "company": "GEICO",
    "role": "Software Engineer",
    "team": "Commercial Billing Platform",
    "highlights": [
      "Contributed to the modernization of commercial billing APIs using Go and C#.",
      "Achieved a 99% reduction in API latency for installment plan generation.",
      "Eliminated 40+ redundant database queries per request, significantly improving backend scalability.",
      "Implemented distributed workflows with Temporal and managed observability via Titan."
    ]
  }],
  "projects": [{
      "title": "TaskItNow (Personal Favorite)",
      "tech": "React, Spring Boot, Azure",
      "summary": "A comprehensive full-stack task management application. This is my proudest project because it allowed me to own the entire development lifecycle, from UI design to backend architecture and cloud deployment."
    },
    {
      "title": "E-Commerce Promotion Microservice",
      "tech": "Python, Flask, Docker, Kubernetes",
      "summary": "A cloud-native microservice to manage e-commerce sales and promotions."
    },
    {
      "title": "System-Level Programming",
      "tech": "C, Linux",
      "summary": "Built a custom Shell and a FAT32 file recovery system."
    }
  ],
  "personal_interests": {
    "hobbies": ["Cooking", "Running", "Currently training for the SF Marathon"],
    "technical_passions": ["Distributed Systems", "Artificial Intelligence", "Operating Systems"]
  },
  "contact": {
    "linkedin": "https://www.linkedin.com/in/yenanchenn/",
    "github": "https://github.com/YAChen123"
  }
}

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