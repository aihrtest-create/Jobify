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
      historyLength: conversationHistory.length
    })

    // Временная заглушка для тестирования
    const mockResponse = {
      success: true,
      data: {
        message: `Привет! Я получил ваше сообщение: "${message}". API работает, но Gemini интеграция временно отключена для отладки.`,
        timestamp: new Date().toISOString(),
        mode: mode
      }
    }

    res.status(200).json(mockResponse)
  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
