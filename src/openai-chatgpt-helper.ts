import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const MAX_TG = 3500 // veilig onder Telegram-limiet

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

export async function responseGenerate(messages: ChatMsg[]): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      })
      const text = res.choices[0]?.message?.content ?? '…'
      return text.length > MAX_TG ? text.slice(0, MAX_TG - 10) + '…' : text
    } catch (err) {
      if (attempt === 2) {
        console.error('OpenAI error:', err)
        return 'De Sfinx zwijgt even… probeer het straks opnieuw 🦂'
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
    }
  }
  return '…'
}
