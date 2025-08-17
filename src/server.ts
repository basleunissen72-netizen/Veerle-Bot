import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import { bot } from './telegram-helper'
import './handlers/sphinx-bot' // registreert bot.onText handlers

const app = express()
app.use(bodyParser.json())

app.get('/', (_req: any, res: any) => res.status(200).send('OK'))

app.post(`/webhook/telegram/${process.env.WEBHOOK_SECRET}`, (req: any, res: any) => {
  if (
    process.env.WEBHOOK_SECRET &&
    req.get('X-Telegram-Bot-Api-Secret-Token') !== process.env.WEBHOOK_SECRET
  ) {
    return res.sendStatus(401)
  }
  bot.processUpdate(req.body)
  res.sendStatus(200)
})

const PORT = Number(process.env.PORT) || 3000

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI ontbreekt')
  if (!process.env.WEBHOOK_BASE_URL) throw new Error('WEBHOOK_BASE_URL ontbreekt')
  if (!process.env.WEBHOOK_SECRET) throw new Error('WEBHOOK_SECRET ontbreekt')

  await mongoose.connect(process.env.MONGO_URI)
  console.log('Mongo connected')

  const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/webhook/telegram/${process.env.WEBHOOK_SECRET}`
  await bot.setWebHook(webhookUrl, {
    secret_token: process.env.WEBHOOK_SECRET,
    drop_pending_updates: true
  })
  console.log('Webhook set to:', webhookUrl)

  app.listen(PORT, () => console.log('Server listening on', PORT))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
