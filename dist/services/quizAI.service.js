"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuizQuestions = void 0;
const openai_config_1 = require("../config/openai.config");
const generateQuizQuestions = async (topic, count = 10) => {
    const prompt = `
  Generate ${count} difficult multiple-choice questions about "${topic}".
  Format the response strictly as JSON with this structure:
  [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    }
  ]
  `;
    const completion = await openai_config_1.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
    });
    // console.log(1, completion)
    const rawContent = completion.choices[0]?.message?.content || '[]';
    const match = rawContent.match(/\[.*\]/s);
    if (!match)
        return [];
    try {
        return JSON.parse(match[0]);
    }
    catch (err) {
        console.error('JSON parse error:', err, rawContent);
        return [];
    }
};
exports.generateQuizQuestions = generateQuizQuestions;
