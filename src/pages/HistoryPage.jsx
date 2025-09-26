import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/**
 * Страница истории всех тренировок
 * Показывает полный список завершенных интервью с возможностью поиска и фильтрации
 * @returns {JSX.Element} Компонент страницы истории
 */
const HistoryPage = () => {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [filteredInterviews, setFilteredInterviews] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date') // date, score, messages
  const [sortOrder, setSortOrder] = useState('desc') // desc, asc

  useEffect(() => {
    // Загружаем все интервью из localStorage
    const savedInterviews = JSON.parse(localStorage.getItem('interviews') || '[]')
    setInterviews(savedInterviews)
    setFilteredInterviews(savedInterviews)
  }, [])

  useEffect(() => {
    // Фильтрация и сортировка
    let filtered = interviews.filter(interview => {
      // Поиск по содержимому сообщений или дате
      const searchLower = searchTerm.toLowerCase()
      const dateString = new Date(interview.endedAt).toLocaleDateString('ru-RU')
      const messagesContent = interview.messages?.map(m => m.text).join(' ').toLowerCase() || ''
      
      return dateString.includes(searchLower) || messagesContent.includes(searchLower)
    })

    // Сортировка
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.endedAt).getTime()
          bValue = new Date(b.endedAt).getTime()
          break
        case 'messages':
          aValue = a.messagesCount || 0
          bValue = b.messagesCount || 0
          break
        case 'score':
          // Пока используем случайную оценку, в будущем будет из фидбека
          aValue = Math.random() * 10
          bValue = Math.random() * 10
          break
        default:
          aValue = new Date(a.endedAt).getTime()
          bValue = new Date(b.endedAt).getTime()
      }

      if (sortOrder === 'desc') {
        return bValue - aValue
      } else {
        return aValue - bValue
      }
    })

    setFilteredInterviews(filtered)
  }, [interviews, searchTerm, sortBy, sortOrder])

  /**
   * Получение статуса интервью
   * @param {Object} interview - данные интервью
   * @returns {Object} объект с иконкой и цветом статуса
   */
  const getInterviewStatus = (interview) => {
    const messageCount = interview.messagesCount || 0
    
    if (messageCount >= 10) {
      return { icon: '✅', color: 'bg-green-100 text-green-600', label: 'Завершено' }
    } else if (messageCount >= 5) {
      return { icon: '⚡', color: 'bg-yellow-100 text-yellow-600', label: 'Хорошо' }
    } else {
      return { icon: '⏱️', color: 'bg-blue-100 text-blue-600', label: 'Короткое' }
    }
  }

  /**
   * Получение случайных тегов для демонстрации
   * В будущем будут генерироваться на основе анализа содержимого
   */
  const getRandomTags = () => {
    const allTags = [
      { text: 'Frontend', color: 'bg-blue-100 text-blue-700' },
      { text: 'React', color: 'bg-purple-100 text-purple-700' },
      { text: 'JavaScript', color: 'bg-yellow-100 text-yellow-700' },
      { text: 'Node.js', color: 'bg-green-100 text-green-700' },
      { text: 'TypeScript', color: 'bg-indigo-100 text-indigo-700' },
      { text: 'Backend', color: 'bg-red-100 text-red-700' },
    ]
    
    // Возвращаем случайные 1-2 тега
    const shuffled = allTags.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.random() > 0.5 ? 2 : 1)
  }

  /**
   * Получение общей статистики
   */
  const getStatistics = () => {
    const totalInterviews = interviews.length
    const totalMessages = interviews.reduce((sum, interview) => sum + (interview.messagesCount || 0), 0)
    const avgMessages = totalInterviews > 0 ? Math.round(totalMessages / totalInterviews) : 0
    
    return { totalInterviews, totalMessages, avgMessages }
  }

  const stats = getStatistics()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
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
                История тренировок
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Все ваши завершенные интервью и их результаты
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-black">{stats.totalInterviews}</div>
              <div className="text-sm text-gray-500">Всего тренировок</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-black">{stats.totalMessages}</div>
              <div className="text-sm text-gray-500">Всего сообщений</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-black">{stats.avgMessages}</div>
              <div className="text-sm text-gray-500">В среднем за тренировку</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Поиск по содержимому или дате..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  />
                </div>
              </div>
              
              {/* Sort Options */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                >
                  <option value="date">По дате</option>
                  <option value="messages">По сообщениям</option>
                  <option value="score">По оценке</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  title={sortOrder === 'desc' ? 'По убыванию' : 'По возрастанию'}
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interviews List */}
        <div className="space-y-4">
          {filteredInterviews.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm ? 'Ничего не найдено' : 'Пока нет тренировок'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Начните первую тренировку, чтобы увидеть её здесь'
                }
              </p>
              {!searchTerm && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm"
                >
                  Перейти к дашборду
                </Link>
              )}
            </div>
          ) : (
            /* Interview Items */
            filteredInterviews.map((interview) => {
              const status = getInterviewStatus(interview)
              const tags = getRandomTags()
              
              return (
                <Link
                  key={interview.id}
                  to={`/feedback/${interview.id}`}
                  className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color}`}>
                          <span className="text-lg">{status.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-black text-lg group-hover:text-gray-600 transition-colors">
                            Интервью #{interview.id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(interview.endedAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} • {interview.messagesCount || 0} сообщений • Статус: {status.label}
                          </p>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex gap-2 mb-3">
                        {tags.map((tag, index) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}>
                            {tag.text}
                          </span>
                        ))}
                      </div>
                      
                      {/* Preview of first message */}
                      {interview.messages && interview.messages.length > 1 && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {interview.messages[1].text.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center text-gray-400 group-hover:text-black transition-colors ml-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Action Button */}
        {interviews.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/interview"
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
            >
              <span className="mr-2">+</span>
              Начать новую тренировку
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage