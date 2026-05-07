/**
 * Utility for safely extracting and parsing JSON from LLM responses.
 * LLMs often wrap JSON in markdown code blocks or include conversational text.
 */

export function extractJson<T>(text: string): T | null {
  if (!text) return null;

  try {
    // 1. Try direct parsing
    return JSON.parse(text) as T;
  } catch (e) {
    // 2. Try extracting from markdown code blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch?.[1]) {
      try {
        return JSON.parse(jsonBlockMatch[1]) as T;
      } catch (innerE) {
        // Fall through to general extraction
      }
    }

    // 3. Try finding the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch (finalE) {
        return null;
      }
    }

    return null;
  }
}
