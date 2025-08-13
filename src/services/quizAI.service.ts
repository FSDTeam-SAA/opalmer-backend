import { openai } from '../config/openai.config'

export const generateQuizQuestions = async (topic: string, count = 10) => {
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
  `

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  try {
    return JSON.parse(completion.choices[0].message.content || '[]')
  } catch {
    return []
  }
}
