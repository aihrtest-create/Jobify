import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

/**
 * Страница обратной связи после завершения интервью
 * Показывает результаты интервью, оценки и рекомендации
 * @returns {JSX.Element} Компонент страницы обратной связи
 */
const FeedbackPage = () => {
  const { interviewId } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)

  useEffect(() => {
    // Загружаем данные интервью из localStorage
    const interviews = JSON.parse(localStorage.getItem('interviews') || '[]')
    const currentInterview = interviews.find(item => item.id === parseInt(interviewId))
    
    if (!currentInterview) {
      // Если интервью не найдено, перенаправляем на дашборд
      navigate('/dashboard')
      return
    }

    setInterview(currentInterview)
    
    // Проверяем, есть ли уже сгенерированный фидбек
    const savedFeedback = localStorage.getItem(`feedback_${interviewId}`)
    if (savedFeedback) {
      setFeedback(JSON.parse(savedFeedback))
    } else {
      // Генерируем фидбек автоматически
      generateFeedback(currentInterview)
    }
  }, [interviewId, navigate])

  /**
   * Генерация фидбека на основе интервью
   * В будущем будет использовать LLM API
   * @param {Object} interviewData - данные интервью
   */
  const generateFeedback = async (interviewData) => {
    setIsGeneratingFeedback(true)
    
    // TODO: Здесь будет интеграция с LLM API для анализа интервью
    // Пока используем заглушку
    setTimeout(() => {
      const mockFeedback = {
        overallScore: 7.8,
        scores: {
          technical: 8.2,
          communication: 7.5,
          problemSolving: 8.0,
          cultural: 7.3
        },
        strengths: [
          'Отличное понимание технических концепций',
          'Структурированные и четкие ответы',
          'Хорошие примеры из практического опыта'
        ],
        improvements: [
          'Больше деталей при объяснении архитектурных решений',
          'Активнее задавать уточняющие вопросы',
          'Улучшить навыки презентации своих достижений'
        ],
        recommendations: [
          'Изучить паттерны проектирования более глубоко',
          'Практиковаться в объяснении сложных концепций простыми словами',
          'Подготовить больше конкретных примеров проектов'
        ],
        nextSteps: 'Продолжайте практиковаться! Особое внимание уделите объяснению архитектурных решений и их обоснованию.'
      }
      
      setFeedback(mockFeedback)
      localStorage.setItem(`feedback_${interviewId}`, JSON.stringify(mockFeedback))
      setIsGeneratingFeedback(false)
    }, 3000)
  }

  /**
   * Получение цвета для оценки
   * @param {number} score - оценка от 0 до 10
   * @returns {string} CSS классы для цвета
   */
  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  /**
   * Получение ширины прогресс-бара
   * @param {number} score - оценка от 0 до 10
   * @returns {string} CSS класс для ширины
   */
  const getProgressWidth = (score) => {
    return `${(score / 10) * 100}%`
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка интервью...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              to="/dashboard"
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Вернуться к дашборду"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                Результаты интервью
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(interview.endedAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {isGeneratingFeedback ? (
          /* Loading State */
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-black mb-2">
              Анализируем ваше интервью
            </h3>
            <p className="text-gray-500">
              ИИ обрабатывает ваши ответы и готовит персональные рекомендации...
            </p>
          </div>
        ) : feedback && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full text-white text-2xl font-bold mb-4">
                  {feedback.overallScore}
                </div>
                <h2 className="text-xl font-semibold text-black mb-2">
                  Общая оценка
                </h2>
                <p className="text-gray-500 text-sm">
                  Отличный результат! Вы продемонстрировали хорошие навыки.
                </p>
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-6">
                Детальная оценка
              </h3>
              <div className="space-y-4">
                {Object.entries({
                  technical: 'Технические навыки',
                  communication: 'Коммуникация',
                  problemSolving: 'Решение задач',
                  cultural: 'Культурное соответствие'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(feedback.scores[key])}`}>
                          {feedback.scores[key]}/10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-black h-2 rounded-full transition-all duration-500"
                          style={{ width: getProgressWidth(feedback.scores[key]) }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <span className="text-green-500">💪</span>
                Ваши сильные стороны
              </h3>
              <ul className="space-y-3">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span className="text-gray-700 text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <span className="text-blue-500">🎯</span>
                Области для улучшения
              </h3>
              <ul className="space-y-3">
                {feedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs">→</span>
                    </div>
                    <span className="text-gray-700 text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <span className="text-purple-500">💡</span>
                Рекомендации
              </h3>
              <ul className="space-y-3">
                {feedback.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 text-xs">★</span>
                    </div>
                    <span className="text-gray-700 text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>🚀</span>
                Следующие шаги
              </h3>
              <p className="text-gray-200 leading-relaxed">
                {feedback.nextSteps}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/dashboard"
                className="flex-1 bg-black text-white px-6 py-3 rounded-full text-center font-medium hover:bg-gray-800 transition-colors"
              >
                Вернуться к дашборду
              </Link>
              <Link
                to="/interview"
                className="flex-1 bg-white border border-gray-200 text-black px-6 py-3 rounded-full text-center font-medium hover:bg-gray-50 transition-colors"
              >
                Новое интервью
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackPage