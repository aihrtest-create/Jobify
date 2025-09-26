import axios from 'axios'

/**
 * Получить промпт интервьюера из настроек с подстановкой контекста
 * @param {Object} context - Контекст с данными о вакансии и резюме
 * @returns {string} Промпт для интервью
 */
const getInterviewPrompt = (context) => {
  const { jobText = '', resumeText = '' } = context
  
  // Упрощенный универсальный промпт
  const basePrompt = `Ты — Аня, опытный и дружелюбный AI-интервьюер. Проводи естественное собеседование, адаптируясь под вакансию и кандидата.

ВАКАНСИЯ: ${jobText || 'Общее собеседование'}
РЕЗЮМЕ: ${resumeText || 'Резюме не предоставлено'}

ПРАВИЛА ВЕДЕНИЯ ИНТЕРВЬЮ:
• Задавай ОДИН вопрос за раз
• Реагируй позитивно: "Отлично!", "Интересно!", "Понятно!"
• Запоминай детали и ссылайся на них: "Исходя из вашего опыта с..."
• Адаптируйся под уровень кандидата (джуниор/мидл/сеньор)
• При неполных ответах уточняй: "Можете привести конкретный пример?"
• Если кандидат не знает тему — переходи к следующей

ЗАВЕРШЕНИЕ ИНТЕРВЬЮ:
• После 5-7 вопросов предлагай завершить
• Используй фразу: "Отлично! У меня есть достаточно информации. Есть ли у вас вопросы ко мне? [INTERVIEW_COMPLETE]"

КРИТИЧЕСКИ ВАЖНО: Отвечай ТОЛЬКО текстом без префиксов! НИКОГДА не используй "Интервьюер:", "Аня:", "AI:" или любые другие префиксы. Начинай ответ сразу с содержания!`

  return basePrompt
}

/**
 * Сервис для работы с OpenRouter API
 * Обеспечивает интеграцию с различными LLM моделями через OpenRouter
 */
class OpenRouterService {
  constructor() {
    this.baseURL = 'https://openrouter.ai/api/v1'
    this.apiKey = process.env.OPENROUTER_API_KEY || ''
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60 секунд для LLM запросов
      headers: {
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'AI Coach Interview Platform'
      }
    })
  }

  /**
   * Установить API ключ
   * @param {string} apiKey - API ключ OpenRouter
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey
  }

  /**
   * Планирование интервью на основе контекста
   * @param {Object} context - Контекст с данными о вакансии и резюме
   * @param {Object} options - Настройки генерации
   * @returns {Promise<Object>} План интервью
   */
  async planInterview(context = {}, options = {}) {
    try {
      let {
        model = 'anthropic/claude-3-haiku',
        temperature = 0.7,
        maxTokens = 1500
      } = options

      // Используем универсальный промпт из настроек
      const systemPrompt = getInterviewPrompt(context)
      
      // Простой план интервью без PM-специфики
      const interviewPlan = {
        summary: 'Универсальное интервью адаптированное под вакансию',
        questions: [
          { id: 1, question: 'Расскажите о себе и своем опыте', type: 'general' },
          { id: 2, question: 'Почему вас заинтересовала эта позиция?', type: 'motivation' },
          { id: 3, question: 'Опишите ваш опыт работы с технологиями', type: 'technical' },
          { id: 4, question: 'Как вы решаете сложные задачи?', type: 'problem_solving' },
          { id: 5, question: 'Расскажите о работе в команде', type: 'teamwork' }
        ]
      }

      return {
        success: true,
        data: {
          summary: interviewPlan.summary,
          questions: interviewPlan.questions,
          systemPrompt: systemPrompt,
          model: model,
          usage: { prompt_tokens: systemPrompt.length, completion_tokens: 0 }
        }
      }
    } catch (error) {
      console.error('Interview planning error:', error)
      return this._handleError(error)
    }
  }

  /**
   * Отправка сообщения в чат интервью
   * @param {string} message - Сообщение пользователя
   * @param {Array} conversationHistory - История разговора
   * @param {Object} interviewPlan - План интервью
   * @param {Object} options - Настройки генерации
   * @returns {Promise<Object>} Ответ от модели
   */
  async sendChatMessage(message, conversationHistory = [], interviewPlan = null, options = {}) {
    try {
      let {
        model = 'anthropic/claude-3-haiku',
        temperature = 0.8,
        maxTokens = 1000
      } = options

      let systemPrompt = ''
      
      // Используем единый промпт если это первое сообщение
      if (conversationHistory.length === 0 && interviewPlan && interviewPlan.systemPrompt) {
        systemPrompt = interviewPlan.systemPrompt
      } else {
        // Для продолжения разговора используем краткий контекст
        const conversationContext = conversationHistory
          .slice(-10)
          .map(msg => `${msg.sender === 'user' ? 'Кандидат' : ''}: ${msg.text}`)
          .join('\n')

        systemPrompt = `Ты ведешь интервью. Продолжай в том же стиле. БЕЗ префиксов "Интервьюер:" или "Аня:"!

КОНТЕКСТ РАЗГОВОРА:
${conversationContext}

ПОСЛЕДНЕЕ СООБЩЕНИЕ КАНДИДАТА: ${message}

Продолжи интервью, задавай уточняющие вопросы при неполных ответах.`
      }

      const result = await this.sendMessage(message, {
        model,
        temperature,
        maxTokens,
        systemPrompt,
        conversationHistory: []
      })

      // Проверяем, предлагает ли ИИ завершение (после 5-8 вопросов)
      let responseText = result.data?.message || ''
      
      // Удаляем префиксы если они все-таки появились
      responseText = responseText.replace(/^(Интервьюер|Аня|AI|Assistant):\s*/i, '')
      
      const isCompletionSuggested = responseText.toLowerCase().includes('завершить') || 
                                   responseText.toLowerCase().includes('закончить') ||
                                   responseText.toLowerCase().includes('достаточно') ||
                                   responseText.toLowerCase().includes('[interview_complete]')

      return {
        ...result,
        data: {
          ...result.data,
          message: responseText,
          isCompletionSuggested
        }
      }
    } catch (error) {
      console.error('Chat message error:', error)
      return this._handleError(error)
    }
  }

  /**
   * Отправить сообщение в чат с OpenRouter
   * @param {string} message - Сообщение пользователя
   * @param {Object} options - Опции запроса
   * @param {string} options.model - Модель для использования
   * @param {number} options.temperature - Температура генерации
   * @param {number} options.maxTokens - Максимальное количество токенов
   * @param {string} options.systemPrompt - Системный промпт
   * @param {Array} options.conversationHistory - История диалога
   * @returns {Promise<Object>} Ответ от OpenRouter
   */
  async sendMessage(message, options = {}) {
    let {
      model = 'anthropic/claude-3-haiku',
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt = '',
      conversationHistory = []
    } = options

    try {
      // Формируем сообщения для OpenRouter API
      const messages = []
      
      // Добавляем системный промпт
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        })
      }

      // Добавляем историю диалога
      if (conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          messages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })
        })
      }

      // Добавляем текущее сообщение
      messages.push({
        role: 'user',
        content: message
      })

      // Настройки запроса
      const requestBody = {
        model: model,
        messages: messages,
        temperature: Math.max(0, Math.min(2, temperature)),
        max_tokens: Math.max(1, Math.min(8192, maxTokens)),
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      }

      // Отправляем запрос
      const response = await this.client.post('/chat/completions', requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      })

      const data = response.data
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('Пустой ответ от OpenRouter API')
      }

      return {
        success: true,
        data: {
          message: content.trim(),
          model: model,
          timestamp: new Date().toISOString(),
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
          }
        }
      }

    } catch (error) {
      console.error('OpenRouter API Error:', error)
      return this._handleError(error)
    }
  }

  /**
   * Обработка ошибок OpenRouter API
   * @private
   */
  _handleError(error) {
    console.error('OpenRouter API Error:', error)
      
    // Определяем тип ошибки
    let errorMessage = 'Ошибка при обращении к OpenRouter API'
    let errorCode = 'OPENROUTER_ERROR'

    if (error.response?.status === 401) {
      errorMessage = 'Неверный API ключ OpenRouter'
      errorCode = 'INVALID_API_KEY'
    } else if (error.response?.status === 429) {
      errorMessage = 'Превышена квота OpenRouter API. Попробуйте позже'
      errorCode = 'QUOTA_EXCEEDED'
    } else if (error.response?.status === 400) {
      errorMessage = 'Некорректный запрос к OpenRouter API'
      errorCode = 'BAD_REQUEST'
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage = 'Таймаут запроса к OpenRouter API'
      errorCode = 'TIMEOUT'
    }

    return {
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      details: error.response?.data?.error?.message || error.message
    }
  }

  /**
   * Генерация обратной связи по результатам интервью
   * @param {Array} messages - История сообщений интервью
   * @param {Object} context - Контекст с данными о вакансии и резюме
   * @param {Object} options - Настройки генерации
   * @returns {Promise<Object>} Структурированная обратная связь
   */
  async generateFeedback(messages, context = {}, options = {}) {
    try {
      let {
        model = 'anthropic/claude-3-haiku',
        temperature = 0.3,
        maxTokens = 2000
      } = options

      // Упрощенный промпт для фидбека
      const systemPrompt = `Ты HR-эксперт, который анализирует результаты собеседования и дает конструктивную обратную связь.

ВАКАНСИЯ: ${context.jobText || 'Информация о вакансии не предоставлена'}
РЕЗЮМЕ: ${context.resumeText || 'Информация о резюме не предоставлена'}
ДИАЛОГ: ${messages.map(msg => `${msg.sender === 'user' ? 'Кандидат' : 'Интервьюер'}: ${msg.text}`).join('\n')}

Проанализируй интервью и дай структурированную оценку:

## ОБЩЕЕ ВПЕЧАТЛЕНИЕ
[2-3 предложения о кандидате]

## ОЦЕНКИ (по 10-балльной шкале):
• Техническая компетентность: X/10 - [обоснование]
• Коммуникативные навыки: X/10 - [обоснование]  
• Соответствие позиции: X/10 - [обоснование]
• Мотивация: X/10 - [обоснование]

## СИЛЬНЫЕ СТОРОНЫ:
- [конкретная сильная сторона с примером]
- [конкретная сильная сторона с примером]

## ОБЛАСТИ ДЛЯ РАЗВИТИЯ:
- [что можно улучшить с советом]
- [что можно улучшить с советом]

## ИТОГ
**Общий балл**: X.X/10
**Рекомендация**: [Рекомендовать/Не рекомендовать/Требует дополнительного собеседования]
**Обоснование**: [краткое объяснение решения]`

      const result = await this.sendMessage('Проанализируй собеседование и дай обратную связь', {
        model,
        temperature,
        maxTokens,
        systemPrompt,
        conversationHistory: []
      })

      return result
    } catch (error) {
      console.error('Feedback generation error:', error)
      return this._handleError(error)
    }
  }

  /**
   * Проверка подключения к OpenRouter API
   * @returns {Promise<Object>} Результат проверки
   */
  async testConnection() {
    try {
      const result = await this.sendMessage('Привет! Это тест подключения.', {
        model: 'anthropic/claude-3-haiku',
        temperature: 0.1,
        maxTokens: 50,
        systemPrompt: 'Ответь коротко: "Подключение успешно!"'
      })

      return result
    } catch (error) {
      return this._handleError(error)
    }
  }
}

export default new OpenRouterService()
