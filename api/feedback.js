import { getLLMService } from './utils/llmService.js'

/**
 * Feedback generation endpoint for Vercel Functions
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { 
      messages, 
      context = {},
      settings = {}
    } = req.body

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages are required'
      })
    }

    // Получаем настройки для генерации фидбека
    const {
      model = 'gemini-1.5-flash-8b',
      temperature = 0.3,
      maxTokens = 2000
    } = settings

    // Получаем нужный LLM сервис
    const llmService = getLLMService(settings)
    
    // Генерируем обратную связь через выбранный LLM
    const result = await llmService.generateFeedback(messages, context, {
      model,
      temperature,
      maxTokens
    })

    res.status(200).json(result)
  } catch (error) {
    console.error('Feedback API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
