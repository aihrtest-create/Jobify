import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAllData } from '../utils/debugUtils'
import apiClient from '../utils/apiClient'

/**
 * Главная страница дашборда после ввода данных
 * Показывает доступные действия и статистику пользователя согласно Figma макету
 * @returns {JSX.Element} Компонент дашборда
 */
const DashboardPage = () => {
  const navigate = useNavigate()
  const [hasData, setHasData] = useState({
    job: false,
    resume: false
  })
  const [coverLetter, setCoverLetter] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentInterviews, setRecentInterviews] = useState([])

  useEffect(() => {
    // Проверяем наличие данных
    const jobData = localStorage.getItem('jobData')
    const resumeData = localStorage.getItem('resumeData')
    const savedCoverLetter = localStorage.getItem('coverLetter')
    
    setHasData({
      job: !!jobData,
      resume: !!resumeData
    })
    
    if (savedCoverLetter) {
      setCoverLetter(savedCoverLetter)
    }
    
    // Загружаем последние интервью
    const interviews = JSON.parse(localStorage.getItem('interviews') || '[]')
    setRecentInterviews(interviews.slice(-2).reverse()) // Показываем 2 последних
  }, [])

  /**
   * Обработчик начала нового интервью
   * Проверяет наличие необходимых данных
   */
  const handleStartInterview = () => {
    if (!hasData.job) {
      alert('Сначала заполните данные о вакансии')
      return
    }
    navigate('/interview')
  }

  /**
   * Обработчик генерации сопроводительного письма
   */
  const handleGenerateCoverLetter = async () => {
    if (!hasData.job) return
    
    setIsGenerating(true)
    
    try {
      console.log('🚀 Starting cover letter generation...')
      const result = await apiClient.generateCoverLetter()
      console.log('📨 Cover letter API result:', result)
      
      if (result.success && result.data && result.data.message) {
        console.log('✅ Cover letter generated successfully')
        setCoverLetter(result.data.message)
        localStorage.setItem('coverLetter', result.data.message)
      } else {
        // Fallback на заглушку при ошибке
        const fallbackLetter = `Уважаемый менеджер по найму,

С большим интересом рассматриваю возможность присоединиться к вашей команде на позицию, указанную в вакансии. Мой опыт и навыки идеально соответствуют требованиям данной роли.

Ключевые достижения:
• Опыт работы с современными технологиями
• Успешная реализация проектов различной сложности
• Отличные коммуникативные навыки

Буду рад обсудить, как мой опыт может принести пользу вашей компании.

С уважением,
[Ваше имя]`
        
        setCoverLetter(fallbackLetter)
        localStorage.setItem('coverLetter', fallbackLetter)
        console.error('Cover letter generation failed:', result.error)
      }
    } catch (error) {
      console.error('Cover letter API error:', error)
      
      // Fallback на заглушку при ошибке API
      const fallbackLetter = `Уважаемый менеджер по найму,

С большим интересом рассматриваю возможность присоединиться к вашей команде на позицию, указанную в вакансии. Мой опыт и навыки идеально соответствуют требованиям данной роли.

Ключевые достижения:
• Опыт работы с современными технологиями
• Успешная реализация проектов различной сложности
• Отличные коммуникативные навыки

Буду рад обсудить, как мой опыт может принести пользу вашей компании.

С уважением,
[Ваше имя]`
      
      setCoverLetter(fallbackLetter)
      localStorage.setItem('coverLetter', fallbackLetter)
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Копирование письма в буфер обмена
   */
  const handleCopyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter)
      // Показываем временное уведомление
      const button = document.querySelector('[data-copy-button]')
      if (button) {
        const originalText = button.textContent
        button.textContent = 'Скопировано! ✓'
        button.classList.add('bg-green-100', 'text-green-700', 'border-green-300')
        setTimeout(() => {
          button.textContent = originalText
          button.classList.remove('bg-green-100', 'text-green-700', 'border-green-300')
        }, 2000)
      }
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-extrabold text-black">Привет!</h1>
                <span className="text-4xl">👋</span>
              </div>
              <p className="text-base text-gray-500 max-w-2xl">
                Добро пожаловать в тренировку собеседований на базе ИИ. Начните с подготовки интервью или сгенерируйте сопроводительное письмо для вашей вакансии.
              </p>
            </div>
            
            <button
              onClick={() => {
                if (window.confirm('Вы уверены, что хотите начать с новой вакансией? Все текущие данные будут удалены.')) {
                  clearAllData()
                  navigate('/')
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              🗑️ Новая вакансия
            </button>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Interview Ready Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-black mb-1.5">
                Интервью готово ✅
              </h3>
              <p className="text-sm text-gray-500">
                Вакансия обработана. Можно начинать тренировку. Голос и чат поддерживаются.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleStartInterview}
                disabled={!hasData.job}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  hasData.job
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Начать
              </button>
              <button className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                ⚙️
              </button>
            </div>
          </div>

          {/* Cover Letter Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 sm:p-6 pb-3">
              <h3 className="text-lg sm:text-2xl font-semibold text-black mb-1.5">
                Сопроводительное письмо ✍️
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Письмо появится ниже. Можно копировать или перегенерировать.
              </p>
            </div>
            
            {/* Letter Preview Area */}
            <div className="mx-4 sm:mx-6 mb-3 bg-gray-50/50 border border-gray-200 rounded-2xl h-40 sm:h-48 p-3 sm:p-4 relative overflow-y-auto">
              {coverLetter ? (
                <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {coverLetter}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <span className="text-xs sm:text-sm">Письмо будет отображено здесь</span>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 pt-0">
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={!hasData.job || isGenerating}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
                    hasData.job && !isGenerating
                      ? 'bg-gray-800 text-white hover:bg-black'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isGenerating && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isGenerating ? 'Генерируется...' : 'Сгенерировать'}
                </button>
                <button
                  data-copy-button
                  onClick={handleCopyCoverLetter}
                  disabled={!coverLetter}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border text-xs sm:text-sm font-medium transition-colors ${
                    coverLetter
                      ? 'border-gray-200 text-black hover:bg-gray-50'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Копировать <span className="hidden sm:inline">📋</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-black mb-1.5">
              История тренировок
            </h3>
            <p className="text-sm text-gray-500">
              Завершённые тренировки сохраняются локально на этом устройстве.
            </p>
          </div>

          {/* History Items */}
          <div className="space-y-3">
            {recentInterviews.length > 0 ? (
              <>
                {/* Recent Interview Items */}
                {recentInterviews.map((interview) => (
                  <Link
                    key={interview.id}
                    to={`/feedback/${interview.id}`}
                    className="block bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">✅</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-black text-sm">
                              Интервью #{interview.id}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {new Date(interview.endedAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} • {interview.messagesCount || 0} сообщений
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-11">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Интервью
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Завершено
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-black hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                        Открыть →
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* View All Button */}
                <div className="pt-2">
                  <Link
                    to="/history"
                    className="block text-center px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-200 transition-colors"
                  >
                    Посмотреть все тренировки →
                  </Link>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-400 text-xl">📊</span>
                </div>
                <h4 className="font-medium text-gray-600 mb-1">
                  Пока нет завершённых тренировок
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Начните первую тренировку, чтобы увидеть её здесь
                </p>
                <button
                  onClick={handleStartInterview}
                  disabled={!hasData.job}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    hasData.job
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Начать тренировку
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Warning for missing resume */}
        {!hasData.resume && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              💡 Рекомендация
            </h3>
            <p className="text-blue-700 mb-4">
              Добавьте резюме для более персонализированных интервью и сопроводительных писем
            </p>
            <Link 
              to="/resume-input" 
              className="bg-blue-200 hover:bg-blue-300 px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-blue-900 transition-colors inline-block"
            >
              Добавить резюме
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
