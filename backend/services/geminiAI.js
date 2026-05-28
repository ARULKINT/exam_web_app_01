const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EXTRACTION_PROMPT = `Extract all multiple choice questions from the following text.
Return a JSON array of question objects. Each object must have exactly these fields:
- question: string (the full question text)
- option_a: string
- option_b: string
- option_c: string
- option_d: string
- correct_answer: string (must be "A", "B", "C", or "D")
- explanation: string (brief explanation, empty string if none)

Rules:
- Only return valid MCQs with exactly 4 options.
- If text contains no valid MCQs, return an empty array [].
- Return ONLY the JSON array, no other text.

Text to process:
`;

async function extractQuestionsFromText(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const result = await model.generateContent(EXTRACTION_PROMPT + text);
  const response = await result.response;
  const raw = response.text().trim();

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

module.exports = { extractQuestionsFromText };
