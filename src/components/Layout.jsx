import React from 'react'
import Header from './Header'
import Navigation from './Navigation'

/**
 * Основной макет приложения с фиксированной шапкой в стиле Figma дизайна
 * Оборачивает все страницы в единую структуру с белым фоном
 * @param {Object} props - Пропсы компонента
 * @param {React.ReactNode} props.children - Дочерние элементы для отображения
 * @returns {JSX.Element} Компонент макета
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-14 sm:pt-16 pb-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
