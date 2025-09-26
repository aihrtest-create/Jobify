/**
 * Утилиты для отслеживания стоимости использования LLM
 * Ведет статистику токенов и расходов в рублях
 */

/**
 * Цены на модели в долларах за 1M токенов (входящие + исходящие)
 * Данные актуальны на сентябрь 2024
 */
export const MODEL_PRICES = {
  // Gemini модели
  'gemini-1.5-flash-8b': { input: 0.075, output: 0.3 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  
  // Claude модели
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'anthropic/claude-3-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-3-opus': { input: 15.0, output: 75.0 },
  
  // GPT модели
  'openai/gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'openai/gpt-4': { input: 30.0, output: 60.0 },
  'openai/gpt-4-turbo': { input: 10.0, output: 30.0 },
  
  // Google модели через OpenRouter
  'google/gemini-pro': { input: 1.25, output: 5.0 },
  'google/gemini-pro-vision': { input: 1.25, output: 5.0 },
  
  // Meta модели
  'meta-llama/llama-3-8b-instruct': { input: 0.2, output: 0.2 },
  'meta-llama/llama-3-70b-instruct': { input: 0.9, output: 0.9 },
  
  // Mistral модели
  'mistralai/mistral-7b-instruct': { input: 0.2, output: 0.2 },
  'mistralai/mixtral-8x7b-instruct': { input: 0.6, output: 0.6 },
  
  // Специализированные
  'cohere/command-r-plus': { input: 3.0, output: 15.0 },
  'perplexity/llama-3.1-sonar-small-128k-online': { input: 0.2, output: 0.2 }
}

/**
 * Получить цену модели за 1M токенов
 * @param {string} model - Название модели
 * @returns {Object} Цены за входящие и исходящие токены
 */
export const getModelPrice = (model) => {
  return MODEL_PRICES[model] || { input: 1.0, output: 1.0 } // Дефолтная цена
}

/**
 * Рассчитать стоимость запроса в долларах
 * @param {string} model - Название модели
 * @param {number} inputTokens - Количество входящих токенов
 * @param {number} outputTokens - Количество исходящих токенов
 * @returns {number} Стоимость в долларах
 */
export const calculateCostUSD = (model, inputTokens, outputTokens) => {
  const prices = getModelPrice(model)
  
  const inputCost = (inputTokens / 1000000) * prices.input
  const outputCost = (outputTokens / 1000000) * prices.output
  
  return inputCost + outputCost
}

/**
 * Конвертировать доллары в рубли
 * @param {number} usd - Сумма в долларах
 * @returns {number} Сумма в рублях
 */
export const convertToRubles = (usd) => {
  // Используем фиксированный курс для стабильности
  // В реальном приложении можно получать актуальный курс через API
  const USD_TO_RUB = 95.0
  return usd * USD_TO_RUB
}

/**
 * Получить статистику расходов из localStorage
 * @returns {Object} Статистика расходов
 */
export const getCostStats = () => {
  try {
    const stored = localStorage.getItem('ai-coach-cost-stats')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading cost stats:', error)
  }
  
  return {
    totalTokens: 0,
    totalCostUSD: 0,
    totalCostRUB: 0,
    requestsCount: 0,
    lastUpdated: null
  }
}

/**
 * Сохранить статистику расходов в localStorage
 * @param {Object} stats - Статистика расходов
 */
export const saveCostStats = (stats) => {
  try {
    localStorage.setItem('ai-coach-cost-stats', JSON.stringify(stats))
  } catch (error) {
    console.error('Error saving cost stats:', error)
  }
}

/**
 * Обновить статистику расходов после запроса
 * @param {string} model - Название модели
 * @param {number} inputTokens - Количество входящих токенов
 * @param {number} outputTokens - Количество исходящих токенов
 * @returns {Object} Обновленная статистика
 */
export const updateCostStats = (model, inputTokens, outputTokens) => {
  const currentStats = getCostStats()
  
  // Рассчитываем стоимость этого запроса
  const requestCostUSD = calculateCostUSD(model, inputTokens, outputTokens)
  const requestCostRUB = convertToRubles(requestCostUSD)
  const totalTokens = inputTokens + outputTokens
  
  // Обновляем статистику
  const updatedStats = {
    totalTokens: currentStats.totalTokens + totalTokens,
    totalCostUSD: currentStats.totalCostUSD + requestCostUSD,
    totalCostRUB: currentStats.totalCostRUB + requestCostRUB,
    requestsCount: currentStats.requestsCount + 1,
    lastUpdated: new Date().toISOString()
  }
  
  // Сохраняем
  saveCostStats(updatedStats)
  
  return updatedStats
}

/**
 * Сбросить статистику расходов
 */
export const resetCostStats = () => {
  const defaultStats = {
    totalTokens: 0,
    totalCostRUB: 0,
    totalCostUSD: 0,
    requestsCount: 0,
    lastUpdated: null
  }
  saveCostStats(defaultStats)
  return defaultStats
}

/**
 * Форматировать число для отображения
 * @param {number} num - Число
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} Отформатированное число
 */
export const formatNumber = (num, decimals = 2) => {
  return num.toFixed(decimals)
}

/**
 * Форматировать статистику для отображения
 * @param {Object} stats - Статистика расходов
 * @returns {Object} Отформатированная статистика
 */
export const formatCostStats = (stats) => {
  return {
    totalTokens: stats.totalTokens.toLocaleString(),
    totalCostRUB: formatNumber(stats.totalCostRUB),
    totalCostUSD: formatNumber(stats.totalCostUSD),
    requestsCount: stats.requestsCount,
    lastUpdated: stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('ru-RU') : 'Никогда'
  }
}
