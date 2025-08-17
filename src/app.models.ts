import mongoose from 'mongoose'

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true }
  },
  { _id: false }
)

const TelegramConversationSchema = new mongoose.Schema(
  {
    botLink: { type: String, index: true, required: true },
    chatId: { type: Number, index: true, required: true },
    chatMessages: { type: [ChatMessageSchema], default: [] }
    // Eventueel later: riddleIndex: Number, enz.
  },
  { timestamps: true }
)

export const TelegramConversation = mongoose.model('TelegramConversation', TelegramConversationSchema)
