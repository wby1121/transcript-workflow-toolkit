import { callAi, isAiAvailable } from './client'

export async function extractTopics(rawText: string): Promise<{ topics: string[]; tokensUsed: number }> {
  if (!isAiAvailable()) {
    return { topics: [], tokensUsed: 0 }
  }

  // Chunk: first 3000 chars
  const chunk = rawText.substring(0, 3000)
  const prompt = `Extract 3-5 key topics from this video transcript as a JSON array of strings:\n\n${chunk}\n\nTopics (JSON array):`

  try {
    const response = await callAi([{ role: 'user', content: prompt }], { maxTokens: 300 })
    // Try to parse JSON from response
    const jsonMatch = response.content.match(/\[.*\]/s)
    if (jsonMatch) {
      const topics = JSON.parse(jsonMatch[0])
      return { topics: Array.isArray(topics) ? topics : [], tokensUsed: response.tokensUsed }
    }
    return { topics: [], tokensUsed: response.tokensUsed }
  } catch (err) {
    console.error('[AI] Topic extraction failed:', err)
    return { topics: [], tokensUsed: 0 }
  }
}
