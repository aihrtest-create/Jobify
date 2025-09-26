import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Компонент шапки сайта с логотипом и основной навигацией
 * Отображается на всех страницах приложения в стиле Figma дизайна
 * @returns {JSX.Element} Компонент шапки
 */
const Header = () => {
  return (
    <header className="header-glass fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Логотип */}
          <Link 
            to="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-primary-900 text-white rounded-full p-1 text-sm font-bold">
              💬
            </div>
            <span className="text-base sm:text-lg font-semibold text-primary-900 tracking-tight">
              Jobify.ai
            </span>
          </Link>
          
          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-2">
            <Link 
              to="/settings" 
              className="p-2 text-primary-500 hover:text-primary-900 hover:bg-gray-100 rounded-full transition-colors"
              title="Настройки"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link 
              to="/dashboard" 
              className="btn-accent ml-2 text-xs sm:text-sm px-3 sm:px-6"
            >
              <span className="hidden sm:inline">Перейти в дашборд →</span>
              <span className="sm:hidden">Дашборд →</span>
            </Link>
          </nav>
          
          {/* Мобильное меню */}
          <div className="md:hidden flex items-center gap-3">
            <Link 
              to="/settings" 
              className="p-2 text-primary-500 hover:text-primary-900 transition-colors"
              title="Настройки"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link 
              to="/dashboard" 
              className="text-sm font-medium text-primary-900 hover:text-primary-700 transition-colors"
            >
              Дашборд
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
