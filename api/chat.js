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
      mode = 'interview'
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

    console.log(`Chat API request [${mode}]:`, {
      messageLength: message.length,
      hasJob: !!context.jobText,
      hasResume: !!context.resumeText,
      historyLength: conversationHistory.length,
      hasApiKey: !!process.env.GOOGLE_GEMINI_API_KEY
    })

    // Получаем план интервью для первого сообщения
    let interviewPlan = null
    if (conversationHistory.length === 0) {
      const planResult = await geminiService.planInterview(context, {
        model: settings.model || 'gemini-1.5-flash-8b',
        temperature: settings.temperature || 0.7
      })
      
      if (planResult.success) {
        interviewPlan = planResult.data
      } else {
        console.error('Failed to plan interview:', planResult.error)
        return res.status(500).json({
          success: false,
          error: 'Failed to initialize interview',
          details: planResult.error
        })
      }
    }

    // Отправляем сообщение в чат
    const chatResult = await geminiService.sendChatMessage(
      message,
      conversationHistory,
      interviewPlan,
      {
        model: settings.model || 'gemini-1.5-flash-8b',
        temperature: settings.temperature || 0.8,
        maxTokens: settings.maxTokens || 1000
      }
    )

    if (!chatResult.success) {
      console.error('Chat failed:', chatResult.error)
      return res.status(500).json({
        success: false,
        error: 'Failed to get AI response',
        details: chatResult.error,
        errorCode: chatResult.errorCode
      })
    }

    // Возвращаем успешный результат
    res.status(200).json({
      success: true,
      data: {
        message: chatResult.data.message,
        timestamp: chatResult.data.timestamp,
        mode: mode,
        model: chatResult.data.model,
        usage: chatResult.data.usage,
        isCompletionSuggested: chatResult.data.isCompletionSuggested || false,
        interviewPlan: interviewPlan // Включаем план только для первого сообщения
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
