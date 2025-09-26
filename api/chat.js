import geminiService from './services/geminiService.js'

/**
 * Chat endpoint for Vercel Functions
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
      message, 
      context = {},
      conversationHistory = [],
      settings = {},
      mode = 'interview',
      interviewPlan = null
    } = req.body

    // Валидация входных данных
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      })
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long (max 5000 characters)'
      })
    }

    // Получаем настройки LLM с fallback значениями
    const {
      model = 'gemini-1.5-flash-8b',
      temperature = mode === 'planning' ? 0.3 : 0.7,
      maxTokens = mode === 'planning' ? 2000 : 1000
    } = settings

    console.log(`Chat API request [${mode}]:`, {
      messageLength: message.length,
      hasJob: !!context.jobText,
      hasResume: !!context.resumeText,
      hasPlan: !!interviewPlan,
      historyLength: conversationHistory.length
    })

    // Отправляем запрос к Gemini
    const result = await geminiService.sendChatMessage(message, conversationHistory, interviewPlan, {
      model,
      temperature,
      maxTokens
    })

    // Анализ ответа на предмет завершения интервью
    if (mode === 'interview' && result.success) {
      const responseText = result.data.message.toLowerCase()
      result.data.isCompletionSuggested = responseText.includes('[interview_complete]')
      
      if (result.data.isCompletionSuggested) {
        result.data.message = result.data.message.replace(/\[INTERVIEW_COMPLETE\]/gi, '').trim()
      }
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
