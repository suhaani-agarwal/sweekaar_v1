// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize with your API key
const genAI = new GoogleGenerativeAI('AIzaSyBII1KWM0GZdcPKHwws7e3Y1P-VrXPk1tA');
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro-latest",  // Updated model name
    generationConfig: {
      temperature: 0.9,
    },
  });

interface AgeSpecificPlan {
  autism: string[];
  cerebralPalsy: string[];
  combined?: string[];
}

interface GuidanceResponse {
  support: {
    emotionalSupport: string;
    validation: string;
  };
  actionPlan: {
    immediateSteps: string[];
    ageSpecificPlans: Record<string, AgeSpecificPlan>;
    longTermStrategies: string[];
  };
  therapySuggestions: string[];
}

export async function getParentGuidance(prompt: string, context: string = ""): Promise<GuidanceResponse> {
  const fullPrompt = `
    As a neurodevelopmental expert, provide guidance for parents of neurodivergent children.
    Your response must include:
    
    1. Emotional Support:
       - emotionalSupport: Brief supportive statement (1-2 sentences)
       - validation: Statement validating their feelings (1 sentence)
    
    2. Action Plan:
       - immediateSteps: 3-5 actionable immediate steps
       - ageSpecificPlans: For ages 5-17, provide specific recommendations for:
         * autism
         * cerebralPalsy 
         * combined cases (optional)
       - longTermStrategies: 3-5 long-term strategies
    
    3. Therapy Suggestions: 2-3 appropriate therapy options

    Respond in this exact JSON format (include all brackets and quotes exactly as shown):
    {
      "support": {
        "emotionalSupport": "Your supportive statement here",
        "validation": "Your validation statement here"
      },
      "actionPlan": {
        "immediateSteps": ["Step 1", "Step 2", "Step 3"],
        "ageSpecificPlans": {
          "5": {
            "autism": ["Suggestion 1", "Suggestion 2"],
            "cerebralPalsy": ["Suggestion 1", "Suggestion 2"],
            "combined": ["Suggestion 1"]
          },
          "6": {
            "autism": ["Suggestion 1", "Suggestion 2"],
            "cerebralPalsy": ["Suggestion 1", "Suggestion 2"]
          }
          // Continue for ages 7-17...
        },
        "longTermStrategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
      },
      "therapySuggestions": ["Therapy 1", "Therapy 2"]
    }

    Current concern: "${prompt}"
    ${context ? `Previous context: ${context}` : ''}
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    });
    
    const responseText = result.response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    // Parse and validate the response
    const response: GuidanceResponse = JSON.parse(responseText);
    
    // Basic validation
    if (!response.support || !response.actionPlan || !response.therapySuggestions) {
      throw new Error("Invalid response structure from API");
    }
    
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to get guidance. Please try again.");
  }
}