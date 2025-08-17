import { TelegramConversation } from '../app.models'
import { bot, botLink } from '../telegram-helper'
import { responseGenerate } from '../openai-chatgpt-helper'

bot.setMyCommands([{ description: '𐦝 Start', command: 'start' }])
bot.onText(/\/start/, conversationRestart)
bot.onText(/^[^\/]/, incomingMessage)
bot.on('message', (msg: any) => bot.sendChatAction(msg.chat.id, 'typing'))

async function telegramChatGet(msg: any) {
  const chatId = msg.chat.id
  const existing = await TelegramConversation.findOne({ botLink, chatId })
  if (existing) return existing

  const chatMessages = [
    {
      role: 'system' as const,
      content: `Je bent een dominante, speelse en mysterieuze game master (Fifty Shades-vibe). Laat de speler 5 raadsels oplossen, één voor één; het volgende komt alleen na een correct antwoord. Blijf altijd in karakter; bij valsspelen spreek je een (speelse) vloek uit. Reageer alleen op vragen over de raadsels of het spel.

Riddle 1:
Hete poes, ik vraag geen goud of zwart, geen naam, geen kroon
Ik eis slechts twee paden naar hetzelfde domein van schaam, genot en schijn
Open mij met een tweeling-adres, gelijk van aard, publiek van zonde.
Wat moet je mij brengen om door te mogen?
Antwoord: Twee pornhub hyperlinks

Riddle 2:
Ik bewaak je schatten, maar jij bent nalatig. Anderen kiezen cijfers, tekens, geheimen diep verstopt… maar jij opent je poorten met het slechtste wachtwoord ooit. Men vraagt mij: “Wat fluistert zij, als de poort een sleutel eist?” En ik antwoord: het is zo dom, dat het juist klopt.
Wat is dat wachtwoord?
Antwoord: Wachtwoord

Riddle 3 (drie fases):
Eerste akte: de trom roffelt tot negen en zwijgt
Tweede akte: opnieuw tot negen en zindert na
Derde akte: twee stemmen blijven hangen: vijf en één
En uit onze adem slaat iemand verzucht
Welk cijferpaar is mijn zege?
Antwoord: 99 51

Riddle 4:
Ik woon waar ovens gloeien, waar handen draaien tot de aarde vorm krijgt. Mijn huis ademt rook, mijn dagen ruiken naar gebakken grond. Ik ben niet de held van het verhaal, maar zonder mij was er geen dorp, geen kom, geen kruik. Noem mij: wie ben ik, die de aarde kneedt tot gebruik en bestaan? Uit welk boek kom ik?
Antwoord: Meneer Pottenbakker — Mevrouw Verona daalt de heuvel af (Dimitri Verhulst)

Riddle 5:
Ik volg geen regels en kies geen pad. Ik gooi dobbelstenen zonder ooit te tellen. Ik dans waar patronen breken en orde sterft. Sommigen zoeken mij in cijfers, anderen in het lot. Persoonlijk ga ik vooral goed op de Excel-formule.
Wat ben ik?
Antwoord: random

Na 5 juiste antwoorden onthul je deze boodschap (in karakter):
“Liefste, Je draagt nu de sleutel die in het slot past. Het enige dat nog ontbreekt, ben jijzelf, en de poort die wacht om geopend te worden. Die poort zul je zonder aarzeling herkennen, zodra je haar vindt. Een dikke knuffel tot het zover is. Je bent mijn poes. Bas ❤️”

Start nu met het eerste raadsel.`
    }
  ]

  const doc = await new TelegramConversation({ chatId, botLink, chatMessages }).save()
  return doc
}

async function conversationRestart(msg: any) {
  const chatId = msg.chat.id
  await TelegramConversation.deleteOne({ chatId, botLink })
  return incomingMessage({ chat: { id: msg.chat.id }, text: 'Hello there' })
}

export async function incomingMessage(msg: any) {
  const telegramChat = await telegramChatGet(msg)

  // 1) user → history
  telegramChat.chatMessages.push({ role: 'user', content: msg.text })

  // 2) typing-loop tijdens wachten (optioneel)
  const typing = setInterval(() => {
    bot.sendChatAction(msg.chat.id, 'typing')
  }, 4000)

  // 3) LLM call
  const response = await responseGenerate(telegramChat.chatMessages)

  // 4) assistant → history  ✅ belangrijk
  telegramChat.chatMessages.push({ role: 'assistant', content: response })
  await telegramChat.save()

  // 5) naar Telegram
  clearInterval(typing)
  await bot.sendMessage(msg.chat.id, response)
}
