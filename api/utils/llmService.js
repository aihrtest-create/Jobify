import geminiService from '../services/geminiService.js'
import openrouterService from '../services/openrouterService.js'

/**
 * Получить сервис LLM на основе настроек
 * @param {Object} settings - Настройки LLM
 * @returns {Object} Соответствующий сервис LLM
 */
export const getLLMService = (settings = {}) => {
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
