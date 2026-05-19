import { callAi, isAiAvailable } from './client'
import type { FaqEntry } from '@/types'

export async function generateFaq(
  summary: string,
  topics: string[]
): Promise<{ faq: FaqEntry[]; tokensUsed: number }> {
  if (!isAiAvailable()) {
    return { faq: [], tokensUsed: 0 }
  }

  const context = `Summary: ${summary}\nTopics: ${topics.join(', ')}`
  const prompt = `Based on this video content, generate 3 FAQ questions and answers as a JSON array of {q, a} objects:\n\n${context}\n\nFAQ (JSON):`

  try {
    const response = await callAi([{ role: 'user', content: prompt }], { maxTokens: 500 })
    const jsonMatch = response.content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const faq = JSON.parse(jsonMatch[0])
      return { faq: Array.isArray(faq) ? faq : [], tokensUsed: response.tokensUsed }
    }
    return { faq: [], tokensUsed: response.tokensUsed }
  } catch (err) {
    console.error('[AI] FAQ generation failed:', err)
    return { faq: [], tokensUsed: 0 }
  }
}
