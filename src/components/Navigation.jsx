import React from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Компонент хлебных крошек для навигации
 * Показывает текущее местоположение пользователя в приложении
 * @returns {JSX.Element} Компонент навигации
 */
const Navigation = () => {
  const location = useLocation()
  
  const getPageTitle = (pathname) => {
    const routes = {
      '/': 'Главная',
      '/resume-input': 'Ввод резюме',
      '/dashboard': 'Дашборд',
      '/interview': 'Интервью',
      '/history': 'История тренировок',
      '/settings': 'Настройки'
    }
    
    if (pathname.startsWith('/feedback/')) {
      return 'Обратная связь'
    }
    
    return routes[pathname] || 'Страница'
  }

  return (
    <nav className="bg-gray-100 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-12">
          <span className="text-sm text-gray-600">
            {getPageTitle(location.pathname)}
          </span>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
