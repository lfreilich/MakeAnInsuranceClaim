// OpenAI service for AI writing assistance
// Reference: javascript_openai_ai_integrations integration blueprint
import OpenAI from "openai";

// Validate environment variables on module load
if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  console.warn("AI Integrations environment variables not configured. AI enhancement will use fallback mode.");
}

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access
// without requiring your own OpenAI API key. Charges are billed to your Replit credits.
const openai = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY 
  ? new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
    })
  : null;

export async function enhanceIncidentDescription(originalText: string): Promise<string> {
  // Guard against empty text
  if (!originalText || originalText.trim().length < 10) {
    throw new Error("Text must be at least 10 characters to enhance");
  }

  // Fallback if AI integration not available
  if (!openai) {
    console.warn("AI integration not available - using fallback enhancement");
    return formatTextFallback(originalText);
  }

  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an insurance claim writing assistant. Your task is to enhance incident descriptions 
          to be clear, detailed, and professional while maintaining accuracy. Do not embellish or add false information.
          Focus on:
          - Clear chronological description of events
          - Specific details about damage extent and location
          - Professional, neutral tone
          - Proper grammar and structure
          Keep the same factual content but present it more clearly and comprehensively.`
        },
        {
          role: "user",
          content: `Please enhance this insurance claim incident description:\n\n${originalText}`
        }
      ],
      max_completion_tokens: 8192,
    });

    const enhancedText = response.choices[0]?.message?.content;
    
    // Guard against empty AI response
    if (!enhancedText || enhancedText.trim().length === 0) {
      console.warn("AI returned empty response - using fallback");
      return formatTextFallback(originalText);
    }

    return enhancedText;
  } catch (error: any) {
    console.error("OpenAI enhancement error:", error);
    
    // Provide meaningful error message
    if (error.status === 401) {
      throw new Error("AI service authentication failed. Please contact support.");
    } else if (error.status === 429) {
      throw new Error("AI service temporarily unavailable due to rate limits. Please try again in a moment.");
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error("AI service is temporarily unavailable. Please try again later.");
    }
    
    // Use fallback for other errors
    console.warn("Using fallback enhancement due to error");
    return formatTextFallback(originalText);
  }
}

// Fallback text enhancement when AI is unavailable
function formatTextFallback(text: string): string {
  const trimmed = text.trim();
  
  // Basic formatting improvements
  const sentences = trimmed.split(/\.\s+/);
  const formatted = sentences
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('. ');
  
  return formatted.endsWith('.') ? formatted : `${formatted}.`;
}
