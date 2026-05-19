const API_KEY = process.env.DEEPSEEK_API_KEY || ''
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/anthropic'

interface AiMessage { role: 'user' | 'assistant'; content: string }
interface AiResponse { content: string; tokensUsed: number }

export async function callAi(
  messages: AiMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<AiResponse> {
  if (!API_KEY) {
    throw new Error('DeepSeek API key not configured. Set DEEPSEEK_API_KEY in .env.local.')
  }

  const url = `${BASE_URL}/v1/messages`
  const body = {
    model: 'deepseek-chat',
    max_tokens: options.maxTokens || 1024,
    temperature: options.temperature || 0.3,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  }

  console.log('[AI] Calling:', url, 'with model:', body.model, 'tokens:', body.max_tokens)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text()
      console.error('[AI] API error:', res.status, text.substring(0, 200))
      throw new Error(`DeepSeek API returned ${res.status}: ${text.substring(0, 100)}`)
    }

    const data = await res.json()
    const content = data.content?.[0]?.text || ''
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)

    console.log('[AI] Response:', tokensUsed, 'tokens,', content.length, 'chars')
    return { content, tokensUsed }
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('DeepSeek API request timed out after 30 seconds')
    }
    throw err
  }
}

export function isAiAvailable(): boolean {
  return !!API_KEY
}
