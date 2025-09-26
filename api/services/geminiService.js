import { GoogleGenerativeAI } from '@google/generative-ai'

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

СТИЛЬ: Живой, дружелюбный, профессиональный. БЕЗ префиксов "Интервьюер:" или "Аня:"!`

  return basePrompt
}

/**
 * Сервис для работы с Google Gemini API
 * Обеспечивает интеграцию с различными моделями Gemini
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || 'AIzaSyCsADRwHZj4-j2w5yM7ScQW2zLVRXdbhIc'
    this.genAI = new GoogleGenerativeAI(this.apiKey)
  }

  /**
   * Получить модель Gemini
   * @param {string} modelName - Название модели
   * @returns {Object} Экземпляр модели
   */
  getModel(modelName = 'gemini-1.5-flash-8b') {
    return this.genAI.getGenerativeModel({ model: modelName })
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
        model = 'gemini-1.5-flash-8b',
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
        model = 'gemini-1.5-flash-8b',
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
          .map(msg => `${msg.sender === 'user' ? 'Кандидат' : 'Интервьюер'}: ${msg.text}`)
          .join('\n')

        systemPrompt = `Ты ведешь интервью. Продолжай в том же стиле.

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
      const responseText = result.data?.message || ''
      const isCompletionSuggested = responseText.toLowerCase().includes('завершить') || 
                                   responseText.toLowerCase().includes('закончить') ||
                                   responseText.toLowerCase().includes('достаточно') ||
                                   responseText.toLowerCase().includes('[interview_complete]')

      return {
        ...result,
        data: {
          ...result.data,
          isCompletionSuggested
        }
      }
    } catch (error) {
      console.error('Chat message error:', error)
      return this._handleError(error)
    }
  }

  /**
   * Отправить сообщение в чат с Gemini
   * @param {string} message - Сообщение пользователя
   * @param {Object} options - Опции запроса
   * @param {string} options.model - Модель для использования
   * @param {number} options.temperature - Температура генерации
   * @param {number} options.maxTokens - Максимальное количество токенов
   * @param {string} options.systemPrompt - Системный промпт
   * @param {Array} options.conversationHistory - История диалога
   * @returns {Promise<Object>} Ответ от Gemini
   */
  async sendMessage(message, options = {}) {
      let {
        model = 'gemini-1.5-flash-8b',
        temperature = 0.7,
        maxTokens = 1000,
        systemPrompt = '',
        conversationHistory = []
      } = options

    // Первая попытка с выбранной моделью
    try {
      return await this._attemptSendMessage(message, {
        model,
        temperature,
        maxTokens,
        systemPrompt,
        conversationHistory
      })
    } catch (error) {
      // Если превышена квота, пробуем другую модель
      if ((error.status === 429 || error.message?.includes('quota'))) {
        console.log(`Quota exceeded for ${model}, trying alternative model...`)
        try {
          // Пробуем другую модель в зависимости от текущей
          const alternativeModel = model.includes('flash-8b') ? 'gemini-1.5-flash' : 'gemini-1.5-flash-8b'
          return await this._attemptSendMessage(message, {
            model: alternativeModel,
            temperature,
            maxTokens,
            systemPrompt,
            conversationHistory
          })
        } catch (alternativeError) {
          // Если и альтернативная модель не работает, возвращаем оригинальную ошибку
          return this._handleError(error)
        }
      }
      return this._handleError(error)
    }
  }

  /**
   * Внутренний метод для отправки сообщения
   * @private
   */
  async _attemptSendMessage(message, options) {
    const {
      model,
      temperature,
      maxTokens,
      systemPrompt,
      conversationHistory
    } = options

    try {
      const genModel = this.getModel(model)

      // Настраиваем параметры генерации
      const generationConfig = {
        temperature: Math.max(0, Math.min(2, temperature)),
        maxOutputTokens: Math.max(1, Math.min(8192, maxTokens)),
        topP: 0.95,
        topK: 40,
      }

      // Формируем полный контекст
      let fullPrompt = ''
      
      if (systemPrompt) {
        fullPrompt += `${systemPrompt}\n\n`
      }

      // Добавляем историю диалога
      if (conversationHistory.length > 0) {
        fullPrompt += 'История диалога:\n'
        conversationHistory.forEach(msg => {
          const role = msg.sender === 'user' ? 'Кандидат' : 'Интервьюер'
          fullPrompt += `${role}: ${msg.text}\n`
        })
        fullPrompt += '\n'
      }

      fullPrompt += `Кандидат: ${message}\nИнтервьюер:`

      // Отправляем запрос
      const result = await genModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: fullPrompt }]
        }],
        generationConfig
      })

      const response = await result.response
      const text = response.text()

      if (!text) {
        throw new Error('Пустой ответ от Gemini API')
      }

      return {
        success: true,
        data: {
          message: text.trim(),
          model: model,
          timestamp: new Date().toISOString(),
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0
          }
        }
      }

    } catch (error) {
      console.error('Gemini API Error:', error)
      throw error // Пробрасываем ошибку для обработки в основном методе
    }
  }

  /**
   * Обработка ошибок Gemini API
   * @private
   */
  _handleError(error) {
    console.error('Gemini API Error:', error)
      
    // Определяем тип ошибки
    let errorMessage = 'Ошибка при обращении к Gemini API'
    let errorCode = 'GEMINI_ERROR'

    if (error.message?.includes('API key')) {
      errorMessage = 'Неверный API ключ Gemini'
      errorCode = 'INVALID_API_KEY'
    } else if (error.message?.includes('quota') || error.status === 429) {
      errorMessage = 'Превышена квота Gemini API. Попробуйте позже или смените модель на Flash'
      errorCode = 'QUOTA_EXCEEDED'
    } else if (error.message?.includes('safety')) {
      errorMessage = 'Запрос заблокирован системой безопасности Gemini'
      errorCode = 'SAFETY_BLOCKED'
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Таймаут запроса к Gemini API'
      errorCode = 'TIMEOUT'
    }

    return {
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      details: error.message
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
        model = 'gemini-1.5-flash-8b',
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
   * Проверка подключения к Gemini API
   * @returns {Promise<Object>} Результат проверки
   */
  async testConnection() {
    try {
      const result = await this.sendMessage('Привет! Это тест подключения.', {
        model: 'gemini-1.5-flash-8b',
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

export default new GeminiService()
