import TelegramBot from 'node-telegram-bot-api'

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN ontbreekt in env')
}

export const botLink = 'IsHetEenPoesofeenBot' // vrij label in je DB-scope
export const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false })
// Geen polling; we gebruiken webhook + Express route + bot.processUpdate
