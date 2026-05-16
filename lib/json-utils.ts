/**
 * Utility for safely extracting and parsing JSON from LLM responses.
 * LLMs often wrap JSON in markdown code blocks, include conversational text,
 * or produce truncated/malformed JSON that needs repair.
 */

/**
 * Attempt to repair common JSON issues from LLM output:
 * - Trailing commas before } or ]
 * - Truncated strings (unclosed quotes)
 * - Unclosed arrays/objects
 * - Incomplete key-value pairs
 */
function repairJson(text: string): string | null {
  let json = text.trim();

  // Remove any trailing non-JSON garbage after what looks like an attempt to close
  // e.g., "...}\n\nHere is the analysis" → "...}"
  const lastBrace = json.lastIndexOf('}');
  const lastBracket = json.lastIndexOf(']');
  const lastCloser = Math.max(lastBrace, lastBracket);
  if (lastCloser > 0 && lastCloser < json.length - 1) {
    // Check if there's non-whitespace after the last closer
    const afterCloser = json.substring(lastCloser + 1).trim();
    if (afterCloser && !afterCloser.startsWith('}') && !afterCloser.startsWith(']')) {
      json = json.substring(0, lastCloser + 1);
    }
  }

  // Fix truncated strings — find unclosed quotes and close them
  // Count quotes (ignoring escaped ones)
  const unescapedQuotes = json.match(/(?<!\\)"/g);
  if (unescapedQuotes && unescapedQuotes.length % 2 !== 0) {
    // Odd number of quotes — last string is unclosed
    json += '"';
  }

  // Remove trailing commas inside objects/arrays (common LLM mistake)
  json = json.replace(/,\s*([\]}])/g, '$1');

  // Remove incomplete key-value pairs at the end
  // e.g., '..."key": ' or '..."key":' with nothing after
  json = json.replace(/,\s*"[^"]*"\s*:\s*$/g, '');

  // Close unclosed structures by counting braces/brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  // If we're still inside a string, we already closed it above.
  // Now close any remaining open structures.
  // Close brackets first (inner), then braces (outer)
  // Remove any trailing comma before closing
  json = json.replace(/,\s*$/, '');

  for (let i = 0; i < openBrackets; i++) {
    json += ']';
  }
  for (let i = 0; i < openBraces; i++) {
    json += '}';
  }

  try {
    JSON.parse(json);
    return json;
  } catch {
    return null;
  }
}

/**
 * Last-resort extraction: use regex to pull individual known fields
 * from broken JSON. Returns a partial object with whatever was found.
 */
function regexExtractFields(text: string): Record<string, unknown> | null {
  const result: Record<string, unknown> = {};
  let found = false;

  // Extract string fields
  const stringFields = [
    'section_id', 'section_heading', 'detailed_content',
    'title', 'overall_quality', 'content'
  ];
  for (const field of stringFields) {
    const match = text.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`, 's'));
    if (match?.[1]) {
      result[field] = match[1];
      found = true;
    }
  }

  // Extract array-of-strings fields
  const arrayFields = [
    'key_findings', 'gaps', 'suggestions',
    'sections_needing_research', 'search_queries'
  ];
  for (const field of arrayFields) {
    const match = text.match(new RegExp(`"${field}"\\s*:\\s*\\[(.*?)\\]`, 's'));
    if (match?.[1]) {
      // Extract individual strings from the array content
      const items: string[] = [];
      const itemMatches = match[1].matchAll(/"((?:[^"\\]|\\.)*)"/g);
      for (const itemMatch of itemMatches) {
        items.push(itemMatch[1]);
      }
      if (items.length > 0) {
        result[field] = items;
        found = true;
      }
    }
  }

  // Extract array-of-numbers fields
  const numArrayFields = ['sources_used'];
  for (const field of numArrayFields) {
    const match = text.match(new RegExp(`"${field}"\\s*:\\s*\\[(.*?)\\]`, 's'));
    if (match?.[1]) {
      const nums = match[1].match(/\d+/g);
      if (nums) {
        result[field] = nums.map(Number);
        found = true;
      }
    }
  }

  // Extract boolean fields
  const boolFields = ['approved'];
  for (const field of boolFields) {
    const match = text.match(new RegExp(`"${field}"\\s*:\\s*(true|false)`));
    if (match?.[1]) {
      result[field] = match[1] === 'true';
      found = true;
    }
  }

  return found ? result : null;
}

/**
 * Extract and parse JSON from LLM responses with multi-stage fallback:
 * 1. Direct JSON.parse
 * 2. Extract from markdown code blocks
 * 3. Find first { to last } and parse
 * 4. Repair truncated/malformed JSON (close unclosed quotes, braces, fix trailing commas)
 * 5. Regex-based field extraction as last resort
 */
export function extractJson<T>(text: string): T | null {
  if (!text) return null;

  try {
    // 1. Try direct parsing
    return JSON.parse(text) as T;
  } catch {
    // 2. Try extracting from markdown code blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch?.[1]) {
      try {
        return JSON.parse(jsonBlockMatch[1]) as T;
      } catch {
        // Fall through
      }
    }

    // 3. Try finding the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // Fall through to repair
      }
    }

    // 4. Try repairing the JSON (handles truncation, unclosed strings, etc.)
    const jsonStart = text.indexOf('{');
    if (jsonStart !== -1) {
      const rawJson = text.substring(jsonStart);
      const repaired = repairJson(rawJson);
      if (repaired) {
        try {
          const parsed = JSON.parse(repaired) as T;
          console.log('[json-utils] Recovered JSON via repair');
          return parsed;
        } catch {
          // Fall through to regex
        }
      }
    }

    // 5. Last resort: regex field extraction
    const regexResult = regexExtractFields(text);
    if (regexResult) {
      console.log('[json-utils] Recovered partial data via regex extraction');
      return regexResult as T;
    }

    return null;
  }
}
