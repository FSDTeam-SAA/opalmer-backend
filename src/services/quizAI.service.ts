import { openai } from '../config/openai.config'
import AppError from '../errors/AppError'

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

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    })

    const rawContent = completion.choices[0]?.message?.content || '[]'
    const match = rawContent.match(/\[.*\]/s)
    if (!match) return []

    try {
      return JSON.parse(match[0])
    } catch (err) {
      console.error('JSON parse error:', err, rawContent)
      return []
    }
  } catch (err: any) {
    const providerStatus = Number(
      err?.status ?? err?.statusCode ?? err?.cause?.status
    )
    const providerMessage =
      typeof err?.message === 'string' && err.message.trim()
        ? err.message.trim()
        : 'AI provider request failed'

    if (providerStatus === 429) {
      throw new AppError(
        429,
        'OpenAI quota/rate limit reached. Add billing credits or use another valid API key.'
      )
    }

    if (providerStatus === 401) {
      throw new AppError(
        401,
        'OpenAI API key is invalid or missing on the server.'
      )
    }

    throw new AppError(502, providerMessage)
  }
}
