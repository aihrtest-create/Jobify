import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ResumeInputPage from './pages/ResumeInputPage'
import DashboardPage from './pages/DashboardPage'
import InterviewPage from './pages/InterviewPage'
import FeedbackPage from './pages/FeedbackPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

/**
 * Главный компонент приложения с маршрутизацией
 * Определяет все доступные страницы и их пути
 * @returns {JSX.Element} Компонент приложения с роутингом
 */
const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/resume-input" element={<ResumeInputPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/feedback/:interviewId" element={<FeedbackPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}

export default App
