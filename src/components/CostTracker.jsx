import React, { useState, useEffect } from 'react'
import { getCostStats, formatCostStats, resetCostStats } from '../utils/costTracker'

/**
 * Компонент для отображения статистики расходов на LLM
 * Показывает общие затраты в рублях и токенах
 * @returns {JSX.Element} Компонент трекера расходов
 */
const CostTracker = () => {
  const [stats, setStats] = useState(getCostStats())
  const [isExpanded, setIsExpanded] = useState(false)

  /**
   * Обновить статистику
   */
  const updateStats = () => {
    setStats(getCostStats())
  }

  /**
   * Сбросить статистику
   */
  const handleReset = () => {
    if (window.confirm('Вы уверены, что хотите сбросить статистику расходов?')) {
      const newStats = resetCostStats()
      setStats(newStats)
    }
  }

  // Обновляем статистику при изменении localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      updateStats()
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Обновляем каждые 5 секунд для синхронизации
    const interval = setInterval(updateStats, 5000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const formattedStats = formatCostStats(stats)

  // Не показываем компонент, если нет расходов
  if (stats.totalTokens === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        {/* Заголовок */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              Расходы на ИИ
            </span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              ₽{formattedStats.totalCostRUB}
            </div>
            <div className="text-xs text-gray-500">
              {formattedStats.totalTokens} токенов
            </div>
          </div>
          <button className="ml-2 text-gray-400 hover:text-gray-600">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Развернутая информация */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Запросов:</div>
                <div className="font-medium">{formattedStats.requestsCount}</div>
              </div>
              <div>
                <div className="text-gray-500">Токенов:</div>
                <div className="font-medium">{formattedStats.totalTokens}</div>
              </div>
              <div>
                <div className="text-gray-500">Рубли:</div>
                <div className="font-medium">₽{formattedStats.totalCostRUB}</div>
              </div>
              <div>
                <div className="text-gray-500">Доллары:</div>
                <div className="font-medium">${formattedStats.totalCostUSD}</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Обновлено: {formattedStats.lastUpdated}
            </div>

            {/* Кнопка сброса */}
            <button
              onClick={handleReset}
              className="w-full mt-3 px-3 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              Сбросить статистику
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CostTracker
