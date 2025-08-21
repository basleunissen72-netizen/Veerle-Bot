// src/server.ts
import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import { bot } from './telegram-helper'
import './handlers/sphinx-bot' // registreert bot.onText handlers

const app = express()
app.use(bodyParser.json())

// --- Kleine helper om logs netter/veiliger te maken ---
function summarizeUpdate(u: any) {
  try {
    const chatId = u?.message?.chat?.id ?? u?.edited_message?.chat?.id ?? u?.callback_query?.message?.chat?.id
    const from = u?.message?.from?.username || u?.message?.from?.first_name || u?.edited_message?.from?.username
    const text =
      u?.message?.text ??
      u?.edited_message?.text ??
      u?.callback_query?.data ??
      u?.my_chat_member?.new_chat_member?.status ??
      '(no text)'

    return {
      chatId,
      from,
      // log alleen een ingekorte versie van tekst; geen gevoelige data dumpen
      text: typeof text === 'string' ? (text.length > 200 ? text.slice(0, 200) + '…' : text) : text,
      kind: Object.keys(u || {})[0] || 'update'
    }
  } catch {
    return { info: 'could not summarize update' }
  }
}

// Healthcheck
app.get('/', (_req: any, res: any) => res.status(200).send('OK'))

// Webhook endpoint (geheime pad beschermt de route)
app.post(`/webhook/telegram/${process.env.WEBHOOK_SECRET}`, (req: any, res: any) => {
  // Server-side logging (alleen in Render logs zichtbaar; eindgebruiker ziet dit nooit)
  console.log('Telegram update:', JSON.stringify(summarizeUpdate(req.body)))
  bot.processUpdate(req.body)
  res.sendStatus(200)
})

const PORT = Number(process.env.PORT) || 3000

async function main() {
  // Basis env-checks
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI ontbreekt')
  if (!process.env.WEBHOOK_BASE_URL) throw new Error('WEBHOOK_BASE_URL ontbreekt')
  if (!process.env.WEBHOOK_SECRET) throw new Error('WEBHOOK_SECRET ontbreekt')

  // DB-verbinding (stil, geen user-facing output)
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Mongo connected')

  // Webhook op jouw Render URL zetten
  const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/webhook/telegram/${process.env.WEBHOOK_SECRET}`

  // Zonder secret_token (types/compat), drop pending updates bij (her)deploy
  await bot.setWebHook(webhookUrl, {
    drop_pending_updates: true
  } as any)
  console.log('Webhook set to:', webhookUrl)

  app.listen(PORT, () => console.log('Server listening on', PORT))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
