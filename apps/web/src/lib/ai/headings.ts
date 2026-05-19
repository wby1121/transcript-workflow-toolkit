import { callAi, isAiAvailable } from './client'

export async function generateHeadings(chunks: string[]): Promise<{ headings: string[]; tokensUsed: number }> {
  if (!isAiAvailable() || chunks.length === 0) {
    return { headings: [], tokensUsed: 0 }
  }

  const headings: string[] = []
  let totalTokens = 0

  for (const chunk of chunks) {
    const prompt = `Give a short 3-6 word section heading for this transcript segment:\n\n${chunk.substring(0, 500)}\n\nHeading:`

    try {
      const response = await callAi([{ role: 'user', content: prompt }], { maxTokens: 50 })
      const heading = response.content.trim().replace(/^#+\s*/, '').replace(/["']/g, '')
      if (heading) headings.push(heading)
      totalTokens += response.tokensUsed
    } catch (err) {
      console.error('[AI] Heading generation failed for chunk:', err)
    }
  }

  return { headings, tokensUsed: totalTokens }
}
