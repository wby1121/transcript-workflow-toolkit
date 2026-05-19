import { callAi, isAiAvailable } from './client'

export async function generateSummary(rawText: string): Promise<{ summary: string; tokensUsed: number }> {
  if (!isAiAvailable()) {
    return { summary: '', tokensUsed: 0 }
  }

  // Chunk: first 2000 + last 500 chars
  const chunk = rawText.substring(0, 2000) + '\n\n[...]\n\n' + rawText.substring(Math.max(0, rawText.length - 500))
  const prompt = `Write a 2-3 sentence summary of this video transcript:\n\n${chunk}\n\nSummary:`

  try {
    const response = await callAi([{ role: 'user', content: prompt }], { maxTokens: 300 })
    return { summary: response.content.trim(), tokensUsed: response.tokensUsed }
  } catch (err) {
    console.error('[AI] Summary generation failed:', err)
    return { summary: '', tokensUsed: 0 }
  }
}
