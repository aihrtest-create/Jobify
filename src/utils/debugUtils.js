/**
 * Утилиты для отладки и очистки данных
 */

/**
 * Очистить все данные localStorage
 */
export const clearAllData = () => {
  localStorage.removeItem('jobData')
  localStorage.removeItem('resumeData')
  localStorage.removeItem('ai-coach-settings')
  localStorage.removeItem('interviews')
  console.log('✅ Все данные localStorage очищены')
}

/**
 * Показать все данные localStorage
 */
export const showAllData = () => {
  console.log('📊 Данные в localStorage:')
  console.log('jobData:', JSON.parse(localStorage.getItem('jobData') || '{}'))
  console.log('resumeData:', JSON.parse(localStorage.getItem('resumeData') || '{}'))
  console.log('ai-coach-settings:', JSON.parse(localStorage.getItem('ai-coach-settings') || '{}'))
  console.log('interviews:', JSON.parse(localStorage.getItem('interviews') || '[]'))
}

/**
 * Установить тестовые данные для отладки
 */
export const setTestData = () => {
  const testJobData = {
    position: 'Frontend Developer',
    company: 'Tech Company',
    description: 'Разработка пользовательских интерфейсов на React',
    requirements: 'React, JavaScript, TypeScript, CSS',
    jobUrl: ''
  }
  
  const testResumeData = {
    text: 'Опытный Frontend разработчик с 3+ годами опыта работы с React, JavaScript, TypeScript. Участвовал в разработке крупных веб-приложений.',
    uploadedFile: null,
    updatedAt: new Date().toISOString()
  }
  
  localStorage.setItem('jobData', JSON.stringify(testJobData))
  localStorage.setItem('resumeData', JSON.stringify(testResumeData))
  
  console.log('✅ Тестовые данные установлены')
  console.log('jobData:', testJobData)
  console.log('resumeData:', testResumeData)
}

// Добавляем функции в глобальный объект для удобства использования в консоли
if (typeof window !== 'undefined') {
  window.debugUtils = {
    clearAllData,
    showAllData,
    setTestData
  }
  
  console.log('🔧 Debug utils загружены. Используйте:')
  console.log('- debugUtils.clearAllData() - очистить все данные')
  console.log('- debugUtils.showAllData() - показать все данные')
  console.log('- debugUtils.setTestData() - установить тестовые данные')
}
