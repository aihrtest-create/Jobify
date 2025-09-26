import { getLLMService } from './utils/llmService.js'

/**
 * Cover letter generation endpoint for Vercel Functions
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
      context = {},
      settings = {}
    } = req.body

    if (!context.jobText) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют данные о вакансии'
      })
    }

    const { 
      model = 'gemini-1.5-flash-8b', 
      temperature = 0.7, 
      maxTokens = 1500 
    } = settings

    // Упрощенный промпт для сопроводительного письма
    const systemPrompt = `Напиши профессиональное сопроводительное письмо для данной вакансии.

ВАКАНСИЯ: ${context.jobText || 'Информация о вакансии не предоставлена'}
РЕЗЮМЕ: ${context.resumeText || 'Резюме не предоставлено'}

Создай письмо из 3-4 абзацев:
1. Приветствие и интерес к позиции
2. Релевантный опыт и навыки из резюме
3. Мотивация и ценность для компании
4. Призыв к действию

Тон: профессиональный, но живой. Подчеркни соответствие требованиям вакансии.`
    
    // Получаем нужный LLM сервис
    const llmService = getLLMService(settings)
    
    const result = await llmService.sendMessage('Напиши сопроводительное письмо', {
      model,
      temperature,
      maxTokens,
      systemPrompt,
      conversationHistory: []
    })

    res.status(200).json(result)
  } catch (error) {
    console.error('Cover letter API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
