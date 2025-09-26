import axios from 'axios'
import { getLLMSettings, getGreeting } from './settings'

/**
 * API клиент для работы с бэкендом
 * Обеспечивает взаимодействие с LLM сервисами
 */
class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 секунд для LLM запросов
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Интерцептор для логирования запросов
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Интерцептор для обработки ответов
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * Получить контекст из localStorage для передачи в API
   * @returns {Object} Контекст с данными о вакансии и резюме в новом формате
   */
  getContext() {
    try {
      const jobData = JSON.parse(localStorage.getItem('jobData') || '{}')
      const resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}')
      
      // Новая структура: передаем полные тексты вместо разбитых полей
      const context = {
        jobText: jobData.description || jobData.text || '', // Полный текст вакансии
        resumeText: resumeData.text || resumeData.content || '', // Полный текст резюме
        
        // Оставляем для совместимости, если понадобится для UI
        jobTitle: jobData.position || jobData.title || '',
        company: jobData.company || ''
      }
      
      // Отладочная информация
      console.log('Job data from localStorage:', jobData)
      console.log('Resume data from localStorage:', resumeData)
      console.log('Generated context (new format):', context)
      
      return context
    } catch (error) {
      console.error('Error getting context:', error)
      return {
        jobText: '',
        resumeText: '',
        jobTitle: '',
        company: ''
      }
    }
  }

  /**
   * Планирование интервью
   * @param {Object} context - Контекст интервью (вакансия, резюме)
   * @returns {Promise<Object>} План интервью
   */
  async planInterview(context = {}) {
    try {
      const llmSettings = getLLMSettings()
      const fullContext = { ...this.getContext(), ...context }
      
      const response = await this.client.post('/api/plan-interview', {
        context: fullContext,
        settings: {
          ...llmSettings,
          temperature: 0.3,
          maxTokens: 2000
        }
      })

      return response.data
    } catch (error) {
      console.error('Interview planning error:', error)
      return this.handleError(error, 'PLANNING_ERROR')
    }
  }

  /**
   * Отправить сообщение в чат (обновленная версия с поддержкой планов)
   * @param {string} message - Сообщение пользователя
   * @param {Array} conversationHistory - История диалога
   * @param {Object} interviewPlan - План интервью (опционально)
   * @returns {Promise<Object>} Ответ от ИИ
   */
  async sendChatMessage(message, conversationHistory = [], interviewPlan = null) {
    try {
      const llmSettings = getLLMSettings()
      const context = this.getContext()

      const response = await this.client.post('/api/chat', {
        message,
        mode: 'interview',
        context: context,
        conversationHistory,
        interviewPlan,
        settings: llmSettings
      })

      return response.data
    } catch (error) {
      console.error('Chat API error:', error)
      return this.handleError(error, 'CHAT_ERROR')
    }
  }

  /**
   * Получить статичное приветствие
   * @param {Object} context - Контекст для подстановки
   * @returns {string} Приветственное сообщение
   */
  getGreeting(context = {}) {
    const jobContext = this.getContext()
    const positionName = context.positionName || 
                        jobContext.position || 
                        jobContext.company || 
                        'интересующую вас позицию'
    
    return getGreeting({ positionName })
  }

  /**
   * Обработка ошибок API
   * @param {Error} error - Ошибка
   * @param {string} errorType - Тип ошибки
   * @returns {Object} Объект ошибки
   */
  handleError(error, errorType = 'API_ERROR') {
    // Обработка различных типов ошибок
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Таймаут запроса. Попробуйте еще раз.',
        errorCode: 'TIMEOUT',
        canRetry: true
      }
    }
    
    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Некорректный запрос',
        errorCode: 'BAD_REQUEST',
        canRetry: false,
        details: error.response?.data?.details
      }
    }
    
    if (error.response?.status === 500) {
      return {
        success: false,
        error: 'Ошибка сервера. Попробуйте позже.',
        errorCode: 'SERVER_ERROR',
        canRetry: true
      }
    }
    
    return {
      success: false,
      error: 'Ошибка подключения к серверу',
      errorCode: errorType,
      canRetry: true
    }
  }

  /**
   * Генерация обратной связи
   * @param {Array} messages - История сообщений интервью
   * @returns {Promise<Object>} Структурированная обратная связь
   */
  async generateFeedback(messages) {
    try {
      const llmSettings = getLLMSettings()
      const context = this.getContext()

      const response = await this.client.post('/api/feedback', {
        messages,
        context,
        settings: {
          ...llmSettings,
          temperature: 0.3, // Более консервативная температура для фидбека
          maxTokens: 2000
        }
      })

      return response.data
    } catch (error) {
      console.error('Feedback API error:', error)
      
      return {
        success: false,
        error: 'Ошибка генерации обратной связи',
        errorCode: 'FEEDBACK_ERROR'
      }
    }
  }

  /**
   * Генерация сопроводительного письма
   * @returns {Promise<Object>} Сгенерированное письмо
   */
  async generateCoverLetter() {
    try {
      const llmSettings = getLLMSettings()
      const context = this.getContext()

      const response = await this.client.post('/api/cover-letter', {
        context,
        settings: {
          ...llmSettings,
          temperature: 0.7, // Креативность для письма
          maxTokens: 1500
        }
      })

      return response.data
    } catch (error) {
      console.error('Cover letter API error:', error)
      
      return {
        success: false,
        error: 'Ошибка генерации сопроводительного письма',
        errorCode: 'COVER_LETTER_ERROR'
      }
    }
  }

  /**
   * Тестирование подключения к Gemini API
   * @returns {Promise<Object>} Результат тестирования
   */
  async testGeminiConnection() {
    try {
      const response = await this.client.get('/api/test-gemini')
      return response.data
    } catch (error) {
      console.error('Gemini test error:', error)
      
      return {
        success: false,
        error: 'Ошибка тестирования Gemini API',
        errorCode: 'TEST_ERROR'
      }
    }
  }

  /**
   * Проверка здоровья API
   * @returns {Promise<Object>} Статус API
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/api/health')
      return response.data
    } catch (error) {
      console.error('Health check error:', error)
      
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }
}

export default new ApiClient()
