import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Главная страница приложения в стиле Figma дизайна
 * Точное воспроизведение макета с InterviewEcho брендингом и адаптивностью
 * @returns {JSX.Element} Компонент главной страницы
 */
const HomePage = () => {
  const navigate = useNavigate()
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')

  /**
   * Обработчик отправки формы с главной страницы
   * Сохраняет данные вакансии и переходит к вводу резюме
   * @param {Event} e - Событие отправки формы
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!jobDescription.trim() && !jobUrl.trim()) {
      alert('Пожалуйста, введите описание вакансии или ссылку на неё')
      return
    }

    // Очищаем все старые данные перед сохранением новых
    localStorage.removeItem('jobData')
    localStorage.removeItem('resumeData')
    localStorage.removeItem('interviews')
    console.log('🗑️ Старые данные очищены перед сохранением новой вакансии с главной страницы')
    
    // Парсим описание вакансии для извлечения базовой информации
    const description = jobDescription.trim()
    let position = ''
    let company = ''
    
    // Простое извлечение названия позиции и компании из текста
    const lines = description.split('\n')
    const firstLine = lines[0]?.trim() || ''
    
    // Ищем паттерны типа "Frontend Developer в Яндекс" или "Яндекс - Frontend Developer"
    if (firstLine.includes(' в ')) {
      const parts = firstLine.split(' в ')
      position = parts[0]?.trim() || ''
      company = parts[1]?.trim() || ''
    } else if (firstLine.includes(' - ')) {
      const parts = firstLine.split(' - ')
      company = parts[0]?.trim() || ''
      position = parts[1]?.trim() || ''
    } else {
      // Если паттерн не найден, используем первую строку как позицию
      position = firstLine
    }
    
    // Сохраняем новые данные вакансии в новом формате
    const newJobData = {
      // Новый формат: сохраняем полный текст как description (будет использоваться как jobText)
      description: description, // Это будет использоваться как jobText в API
      text: description, // Дублируем для совместимости
      
      // Извлеченные поля для UI
      position: position || 'Не указано',
      company: company || '',
      requirements: '', // Можно позже добавить автоматическое извлечение
      jobUrl: jobUrl.trim(),
      createdAt: new Date().toISOString()
    }
    
    localStorage.setItem('jobData', JSON.stringify(newJobData))
    console.log('✅ Новые данные вакансии сохранены с главной страницы:', newJobData)
    
    // Переходим к вводу резюме
    navigate('/resume-input')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
      {/* Основной контент */}
      <div className="flex flex-col items-center gap-6 sm:gap-8 pb-12 sm:pb-16">
        {/* Hero секция */}
        <div className="flex flex-col items-center gap-4 sm:gap-5 max-w-4xl w-full">
          {/* Бейдж */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
            <span>🚀</span>
            <span className="text-xs sm:text-sm text-primary-500">
              Готовся к собеседованию с помощью ИИ
            </span>
          </div>
          
          {/* Заголовок */}
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-none tracking-tight text-center text-primary-900 px-4">
            Ваш тренер по собеседованиям c ИИ 💡
          </h1>
          
          {/* Подзаголовок */}
          <p className="text-sm sm:text-base text-primary-500 text-center max-w-2xl px-4">
            Вставьте описание вакансии и, по желанию, резюме — мы подготовим вопросы, 
            потренируем голосом и поможем с письмами.
          </p>
          
          {/* CTA кнопка - скролл к форме */}
          <button 
            onClick={() => document.getElementById('job-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-accent text-sm mt-2"
          >
            Начать бесплатно ✨
          </button>
        </div>
        
        {/* Карточка со Step 1 */}
        <form id="job-form" onSubmit={handleSubmit} className="card-elevated w-full max-w-5xl mx-4">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Заголовок Step 1 */}
            <div className="flex flex-col gap-2">
              <div className="badge w-fit">
                STEP 1
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary-900 leading-tight tracking-tight">
                Вставьте вакансию 📄
              </h3>
              <p className="text-sm text-primary-500">
                Можно вставить ссылку на вакансию или сам текст.
              </p>
            </div>
            
            {/* Форма */}
            <div className="space-y-4">
              {/* Основное поле ввода */}
              <div className="min-h-[100px] sm:min-h-[120px] border border-gray-200 rounded-2xl p-3 sm:p-4 bg-white">
                <textarea 
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Вставьте описание вакансии здесь..."
                  className="w-full h-full resize-none border-none outline-none text-sm text-primary-900 placeholder-gray-400"
                  rows={3}
                />
              </div>
              
              {/* Поле для ссылки */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:relative">
                <input 
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="Ссылка на вакансию (опционально)"
                  className="input-field text-sm placeholder-gray-400 sm:pr-24"
                />
                <button 
                  type="submit"
                  className="btn-accent text-xs py-2 px-4 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 self-center"
                >
                  Далее →
                </button>
              </div>
            </div>
          </div>
        </form>
        
        {/* Нижний текст */}
        <p className="text-xs sm:text-sm text-primary-500 text-center max-w-2xl px-4">
          Работает без регистрации • Ничего никуда не отправляем • Можно вернуться и отредактировать
        </p>
      </div>
    </div>
  )
}

export default HomePage
