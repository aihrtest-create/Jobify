/**
 * Утилиты для работы с настройками приложения
 * Управление промптами и конфигурацией LLM провайдеров
 */

/**
 * Дефолтные настройки приложения
 */
export const DEFAULT_SETTINGS = {
  // LLM провайдеры
  llm: {
    provider: 'gemini', // gemini, openrouter
    model: 'gemini-1.5-flash-8b', // Используем Flash 8B модель - быстрая и с высокими лимитами
    temperature: 0.7,
    maxTokens: 1000
  },
  
  // Системные промпты
  prompts: {
    // Основной промпт для интервью
    interviewer: `Ты — Аня, опытный и дружелюбный AI-интервьюер. Проводи естественное собеседование, адаптируясь под вакансию и кандидата.

ВАКАНСИЯ: {jobText}
РЕЗЮМЕ: {resumeText}

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

КРИТИЧЕСКИ ВАЖНО: Отвечай ТОЛЬКО текстом без префиксов! НИКОГДА не используй "Интервьюер:", "Аня:", "AI:" или любые другие префиксы. Начинай ответ сразу с содержания!`,

    // Промпт для обратной связи
    feedback: `Ты HR-эксперт, который анализирует результаты собеседования и дает конструктивную обратную связь.

ВАКАНСИЯ: {jobText}
РЕЗЮМЕ: {resumeText}
ДИАЛОГ: {conversation}

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
**Обоснование**: [краткое объяснение решения]`,

    // Промпт для сопроводительного письма
    coverLetter: `Напиши профессиональное сопроводительное письмо для данной вакансии.

ВАКАНСИЯ: {jobText}
РЕЗЮМЕ: {resumeText}

Создай письмо из 3-4 абзацев:
1. Приветствие и интерес к позиции
2. Релевантный опыт и навыки из резюме
3. Мотивация и ценность для компании
4. Призыв к действию

Тон: профессиональный, но живой. Подчеркни соответствие требованиям вакансии.`
  }
}

/**
 * Получить настройки из localStorage
 * @returns {Object} Объект с настройками
 */
export const getSettings = () => {
  try {
    const stored = localStorage.getItem('ai-coach-settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Объединяем с дефолтными настройками для новых полей
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  return DEFAULT_SETTINGS
}

/**
 * Сохранить настройки в localStorage
 * @param {Object} settings - Объект с настройками
 */
export const saveSettings = (settings) => {
  try {
    localStorage.setItem('ai-coach-settings', JSON.stringify(settings))
    return true
  } catch (error) {
    console.error('Error saving settings:', error)
    return false
  }
}

/**
 * Получить системный промпт по типу
 * @param {string} type - Тип промпта (interviewer, feedback, coverLetter)
 * @param {Object} context - Контекст для подстановки в промпт
 * @returns {string} Обработанный промпт
 */
export const getPrompt = (type, context = {}) => {
  const settings = getSettings()
  let prompt = settings.prompts[type] || ''
  
  // Заменяем плейсхолдеры в промпте
  Object.keys(context).forEach(key => {
    const placeholder = `{${key}}`
    prompt = prompt.replace(new RegExp(placeholder, 'g'), context[key] || '')
  })
  
  return prompt
}

/**
 * Получить настройки LLM провайдера
 * @returns {Object} Настройки LLM
 */
export const getLLMSettings = () => {
  const settings = getSettings()
  return settings.llm
}

/**
 * Обновить настройки LLM
 * @param {Object} llmSettings - Новые настройки LLM
 */
export const updateLLMSettings = (llmSettings) => {
  const settings = getSettings()
  settings.llm = { ...settings.llm, ...llmSettings }
  return saveSettings(settings)
}

/**
 * Обновить промпт
 * @param {string} type - Тип промпта
 * @param {string} content - Содержимое промпта
 */
export const updatePrompt = (type, content) => {
  const settings = getSettings()
  settings.prompts[type] = content
  return saveSettings(settings)
}

/**
 * Сбросить настройки к дефолтным
 */
export const resetSettings = () => {
  return saveSettings(DEFAULT_SETTINGS)
}

/**
 * Экспортировать настройки
 * @returns {string} JSON строка с настройками
 */
export const exportSettings = () => {
  const settings = getSettings()
  return JSON.stringify(settings, null, 2)
}

/**
 * Импортировать настройки
 * @param {string} settingsJson - JSON строка с настройками
 * @returns {boolean} Успешность импорта
 */
export const importSettings = (settingsJson) => {
  try {
    const imported = JSON.parse(settingsJson)
    return saveSettings(imported)
  } catch (error) {
    console.error('Error importing settings:', error)
    return false
  }
}

/**
 * Получить приветственное сообщение
 * @param {Object} context - Контекст для подстановки (positionName)
 * @returns {string} Приветственное сообщение
 */
export const getGreeting = (context = {}) => {
  const positionName = context.positionName || 'интересующую вас позицию'
  return `Приветствую! Меня зовут Аня и сейчас мы проведем собеседование на позицию ${positionName}. Вы готовы начать?`
}

/**
 * Валидация контекста для интервью
 * @param {Object} context - Контекст интервью
 * @returns {Object} Результат валидации с флагами и сообщениями
 */
export const validateInterviewContext = (context = {}) => {
  const validation = {
    isValid: true,
    hasJob: false,
    hasResume: false,
    warnings: [],
    canProceed: true
  }
  
  // Проверяем наличие вакансии
  if (context.jobText && context.jobText.trim().length > 10) {
    validation.hasJob = true
  } else {
    validation.warnings.push('Нет информации о вакансии - будут общие вопросы')
  }
  
  // Проверяем наличие резюме
  if (context.resumeText && context.resumeText.trim().length > 10) {
    validation.hasResume = true
  } else {
    validation.warnings.push('Нет резюме - фокус на вакансии и общих вопросах')
  }
  
  // Можем проводить интервью даже без данных
  validation.canProceed = true
  
  return validation
}

