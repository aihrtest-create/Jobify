import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import geminiService from './services/geminiService.js'
import openrouterService from './services/openrouterService.js'

// Загружаем переменные окружения
dotenv.config()

const app = express()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/**
 * Middleware для логирования запросов
 * @param {Object} req - Объект запроса Express
 * @param {Object} res - Объект ответа Express
 * @param {Function} next - Следующий middleware
 */
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
}

app.use(requestLogger)

/**
 * Получить сервис LLM на основе настроек
 * @param {Object} settings - Настройки LLM
 * @returns {Object} Соответствующий сервис LLM
 */
const getLLMService = (settings = {}) => {
  const { provider = 'gemini', geminiApiKey, openrouterApiKey } = settings
  
  if (provider === 'openrouter') {
    // Устанавливаем API ключ для OpenRouter
    if (openrouterApiKey) {
      openrouterService.setApiKey(openrouterApiKey)
    }
    return openrouterService
  } else {
    // Устанавливаем API ключ для Gemini
    if (geminiApiKey) {
      geminiService.setApiKey(geminiApiKey)
    } else if (process.env.GOOGLE_GEMINI_API_KEY) {
      // Используем ключ из переменных окружения как fallback
      geminiService.setApiKey(process.env.GOOGLE_GEMINI_API_KEY)
    }
    return geminiService
  }
}

// Базовые маршруты
app.get('/', (req, res) => {
  res.json({ 
    message: 'Jobify.ai API Server',
    version: '1.0.0',
    status: 'running'
  })
})

/**
 * Проверка здоровья API
 * @route GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

/**
 * Валидация входных данных для чата
 * @param {Object} data - Данные запроса
 * @returns {Object} Результат валидации
 */
const validateChatRequest = (data) => {
  const errors = []
  
  // Проверяем обязательные поля
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
    errors.push('Message is required and must be a non-empty string')
  }
  
  if (data.message && data.message.length > 5000) {
    errors.push('Message is too long (max 5000 characters)')
  }
  
  // Проверяем режим
  if (data.mode && !['planning', 'interview'].includes(data.mode)) {
    errors.push('Mode must be either "planning" or "interview"')
  }
  
  // Проверяем историю диалога
  if (data.conversationHistory && !Array.isArray(data.conversationHistory)) {
    errors.push('Conversation history must be an array')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Обработка ошибок с fallback логикой
 * @param {Error} error - Ошибка
 * @param {string} context - Контекст ошибки
 * @returns {Object} Объект ошибки для ответа
 */
const handleChatError = (error, context = 'Unknown') => {
  console.error(`Chat API error [${context}]:`, error)
  
  // Определяем тип ошибки и возвращаем соответствующий ответ
  if (error.message.includes('API key')) {
    return {
      success: false,
      error: 'API configuration error',
      canRetry: false,
      fallbackAvailable: false
    }
  }
  
  if (error.message.includes('quota') || error.message.includes('limit')) {
    return {
      success: false,
      error: 'API quota exceeded. Please try again later.',
      canRetry: true,
      fallbackAvailable: false
    }
  }
  
  if (error.message.includes('network') || error.message.includes('timeout')) {
    return {
      success: false,
      error: 'Network error. Please check your connection.',
      canRetry: true,
      fallbackAvailable: true
    }
  }
  
  return {
    success: false,
    error: 'Temporary service error. Please try again.',
    canRetry: true,
    fallbackAvailable: true,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  }
}

/**
 * Планирование интервью
 * @route POST /api/plan-interview
 */
app.post('/api/plan-interview', async (req, res) => {
  try {
    const { context = {}, settings = {} } = req.body
    
    console.log('Interview planning request:', {
      hasJob: !!context.jobText,
      hasResume: !!context.resumeText,
      jobLength: context.jobText?.length || 0,
      provider: settings.provider || 'gemini'
    })
    
    const llmService = getLLMService(settings)
    const result = await llmService.planInterview(context, settings)
    
    console.log('Interview plan generated:', {
      success: result.success,
      hasQuestions: !!result.data?.questions
    })
    
    res.json(result)
  } catch (error) {
    console.error('Interview planning error:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при планировании интервью',
      details: error.message
    })
  }
})

/**
 * Чат с LLM через Gemini API с поддержкой режимов
 * @route POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      message, 
      context = {},
      conversationHistory = [],
      settings = {},
      mode = 'interview', // 'planning' | 'interview'
      interviewPlan = null
    } = req.body
    
    // Валидация входных данных
    const validation = validateChatRequest(req.body)
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      })
    }

    // Получаем настройки LLM с fallback значениями
    const {
      model = 'gemini-1.5-flash-8b',
      temperature = mode === 'planning' ? 0.3 : 0.7,
      maxTokens = mode === 'planning' ? 2000 : 1000
    } = settings

    // Отладочная информация
    console.log(`Chat API request [${mode}]:`, {
      messageLength: message.length,
      hasJob: !!context.jobText,
      hasResume: !!context.resumeText,
      hasPlan: !!interviewPlan,
      historyLength: conversationHistory.length,
      provider: settings.provider || 'gemini'
    })

    // Получаем нужный LLM сервис
    const llmService = getLLMService(settings)

    // Отправляем запрос к LLM с retry логикой
    let result
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        attempts++
        // Используем универсальную логику чата
        result = await llmService.sendChatMessage(message, conversationHistory, interviewPlan, {
          model,
          temperature,
          maxTokens
        })
        break
      } catch (error) {
        console.error(`Attempt ${attempts} failed:`, error.message)
        
        if (attempts === maxAttempts) {
          throw error
        }
        
        // Ждем перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
      }
    }
    
    // Дополнительная обработка для режима планирования
    if (mode === 'planning' && result.success) {
      try {
        // Пытаемся распарсить JSON план
        const planText = result.data.message
        const jsonMatch = planText.match(/\{[\s\S]*\}/)
        
        if (jsonMatch) {
          const planJson = JSON.parse(jsonMatch[0])
          result.data.plan = planJson
          result.data.planText = planText
        } else {
          console.warn('No JSON plan found in response, using text as is')
          result.data.planText = planText
        }
      } catch (parseError) {
        console.error('Failed to parse plan JSON:', parseError)
        // Не фейлим запрос, просто отмечаем что план в текстовом формате
        result.data.planText = result.data.message
      }
    }
    
    // Анализ ответа на предмет завершения интервью
    if (mode === 'interview' && result.success) {
      const responseText = result.data.message.toLowerCase()
      result.data.isCompletionSuggested = responseText.includes('[interview_complete]')
      
      if (result.data.isCompletionSuggested) {
        // Очищаем маркер из ответа для пользователя
        result.data.message = result.data.message.replace(/\[INTERVIEW_COMPLETE\]/gi, '').trim()
      }
    }

    res.json(result)
  } catch (error) {
    const errorResponse = handleChatError(error, `${req.body.mode || 'interview'} mode`)
    res.status(500).json(errorResponse)
  }
})

/**
 * Генерация обратной связи через Gemini API
 * @route POST /api/feedback
 */
app.post('/api/feedback', async (req, res) => {
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

    res.json(result)
  } catch (error) {
    console.error('Feedback API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

/**
 * Генерация сопроводительного письма
 * @route POST /api/cover-letter
 */
app.post('/api/cover-letter', async (req, res) => {
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

    const { provider = 'gemini', model = 'gemini-1.5-flash-8b', temperature = 0.7, maxTokens = 1500 } = settings

    // Получаем нужный LLM сервис
    const llmService = getLLMService(settings)

    // Упрощенный промпт для сопроводительного письма
    let systemPrompt = `Напиши профессиональное сопроводительное письмо для данной вакансии.

ВАКАНСИЯ: ${context.jobText || 'Информация о вакансии не предоставлена'}
РЕЗЮМЕ: ${context.resumeText || 'Резюме не предоставлено'}

Создай письмо из 3-4 абзацев:
1. Приветствие и интерес к позиции
2. Релевантный опыт и навыки из резюме
3. Мотивация и ценность для компании
4. Призыв к действию

Тон: профессиональный, но живой. Подчеркни соответствие требованиям вакансии.`
    
    const result = await llmService.sendMessage('Напиши сопроводительное письмо', {
      model,
      temperature,
      maxTokens,
      systemPrompt,
      conversationHistory: []
    })

    res.json(result)
  } catch (error) {
    console.error('Cover letter API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

/**
 * Тестирование подключения к Gemini API (для обратной совместимости)
 * @route GET /api/test-gemini
 */
app.get('/api/test-gemini', async (req, res) => {
  try {
    const result = await geminiService.testConnection()
    res.json(result)
  } catch (error) {
    console.error('Gemini test error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

/**
 * Тестирование подключения к выбранному LLM провайдеру
 * @route POST /api/test-connection
 */
app.post('/api/test-connection', async (req, res) => {
  try {
    const { settings = {} } = req.body
    const { provider = 'gemini' } = settings
    
    console.log('Testing connection for provider:', provider)
    
    const llmService = getLLMService(settings)
    const result = await llmService.testConnection()
    
    res.json(result)
  } catch (error) {
    console.error('Connection test error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Обработка несуществующих маршрутов
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
  console.error('Global error handler:', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
})

// Экспортируем для Vercel Functions
export default app

// Запуск сервера только в локальной среде
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`🚀 Jobify.ai API Server running on port ${PORT}`)
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`)
  })
}
