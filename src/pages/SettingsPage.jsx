import React, { useState, useEffect } from 'react'
import { 
  getSettings, 
  saveSettings, 
  updateLLMSettings, 
  updatePrompt, 
  resetSettings,
  exportSettings,
  importSettings 
} from '../utils/settings'
import apiClient from '../utils/apiClient'
import { clearAllData, showAllData, setTestData } from '../utils/debugUtils'

/**
 * Страница настроек приложения (админ-панель)
 * Управление промптами, API ключами и конфигурацией
 * @returns {JSX.Element} Компонент страницы настроек
 */
const SettingsPage = () => {
  const [settings, setSettings] = useState(getSettings())
  const [activeTab, setActiveTab] = useState('llm')
  const [saveStatus, setSaveStatus] = useState('')
  const [testStatus, setTestStatus] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  /**
   * Обработчик изменения настроек LLM
   * @param {string} field - Поле для изменения
   * @param {string} value - Новое значение
   */
  const handleLLMChange = (field, value) => {
    const newLLMSettings = { ...settings.llm, [field]: value }
    const newSettings = { ...settings, llm: newLLMSettings }
    setSettings(newSettings)
    
    if (updateLLMSettings(newLLMSettings)) {
      setSaveStatus('Сохранено ✓')
      setTimeout(() => setSaveStatus(''), 2000)
    }
  }

  /**
   * Обработчик изменения промпта
   * @param {string} type - Тип промпта
   * @param {string} content - Содержимое промпта
   */
  const handlePromptChange = (type, content) => {
    const newPrompts = { ...settings.prompts, [type]: content }
    const newSettings = { ...settings, prompts: newPrompts }
    setSettings(newSettings)
    
    if (updatePrompt(type, content)) {
      setSaveStatus('Сохранено ✓')
      setTimeout(() => setSaveStatus(''), 2000)
    }
  }

  /**
   * Сброс настроек к дефолтным
   */
  const handleReset = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все настройки?')) {
      if (resetSettings()) {
        setSettings(getSettings())
        setSaveStatus('Настройки сброшены ✓')
        setTimeout(() => setSaveStatus(''), 2000)
      }
    }
  }

  /**
   * Экспорт настроек
   */
  const handleExport = () => {
    const exported = exportSettings()
    const blob = new Blob([exported], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-coach-settings.json'
    a.click()
    URL.revokeObjectURL(url)
    
    setSaveStatus('Настройки экспортированы ✓')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  /**
   * Импорт настроек
   * @param {Event} e - Событие выбора файла
   */
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (importSettings(event.target.result)) {
          setSettings(getSettings())
          setSaveStatus('Настройки импортированы ✓')
          setTimeout(() => setSaveStatus(''), 2000)
        } else {
          setSaveStatus('Ошибка импорта ✗')
          setTimeout(() => setSaveStatus(''), 2000)
        }
      }
      reader.readAsText(file)
    }
    e.target.value = '' // Сброс input
  }

  /**
   * Тестирование подключения к выбранному LLM провайдеру
   */
  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestStatus('')
    
    try {
      const result = await apiClient.testConnection(settings.llm.provider)
      
      if (result.success) {
        const providerName = settings.llm.provider === 'gemini' ? 'Gemini' : 'OpenRouter'
        setTestStatus(`✅ Подключение к ${providerName} API успешно!`)
      } else {
        setTestStatus(`❌ ${result.error || 'Ошибка подключения'}`)
      }
    } catch (error) {
      setTestStatus('❌ Ошибка тестирования подключения')
    } finally {
      setIsTesting(false)
      setTimeout(() => setTestStatus(''), 5000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Настройки
            </h1>
            <p className="text-gray-600">
              Управление промптами и конфигурацией системы
            </p>
          </div>
          {saveStatus && (
            <div className="text-green-600 font-medium">
              {saveStatus}
            </div>
          )}
        </div>
      </div>

      {/* Табы */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'llm', label: 'LLM Провайдеры', icon: '🤖' },
            { id: 'prompts', label: 'Промпты', icon: '📝' },
            { id: 'system', label: 'Система', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Контент табов */}
      {activeTab === 'llm' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Настройки LLM</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Провайдер */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Провайдер
                </label>
                <select
                  value={settings.llm.provider}
                  onChange={(e) => handleLLMChange('provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              {/* Модель */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Модель
                </label>
                <select
                  value={settings.llm.model}
                  onChange={(e) => handleLLMChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {settings.llm.provider === 'gemini' ? (
                    <>
                      <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B (рекомендуется)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (ограниченная квота)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (платная)</option>
                    </>
                  ) : (
                    <>
                      {/* Claude модели - отличные для собеседований */}
                      <option value="anthropic/claude-3-haiku">Claude 3 Haiku (быстрая, экономичная)</option>
                      <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet (балансированная)</option>
                      <option value="anthropic/claude-3-opus">Claude 3 Opus (мощная, для сложных интервью)</option>
                      
                      {/* GPT модели */}
                      <option value="openai/gpt-4">GPT-4 (премиум качество)</option>
                      <option value="openai/gpt-4-turbo">GPT-4 Turbo (быстрая GPT-4)</option>
                      <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo (быстрая, экономичная)</option>
                      
                      {/* Google модели */}
                      <option value="google/gemini-pro">Gemini Pro (через OpenRouter)</option>
                      <option value="google/gemini-pro-vision">Gemini Pro Vision</option>
                      
                      {/* Meta модели */}
                      <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B (быстрая, бесплатная)</option>
                      <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B (мощная)</option>
                      
                      {/* Mistral модели */}
                      <option value="mistralai/mistral-7b-instruct">Mistral 7B (быстрая)</option>
                      <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B (экспертная)</option>
                      
                      {/* Специализированные модели */}
                      <option value="cohere/command-r-plus">Cohere Command R+ (для диалогов)</option>
                      <option value="perplexity/llama-3.1-sonar-small-128k-online">Perplexity Sonar (с интернетом)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {settings.llm.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.llm.temperature}
                  onChange={(e) => handleLLMChange('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Консервативно</span>
                  <span>Креативно</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Максимум токенов
                </label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  step="100"
                  value={settings.llm.maxTokens}
                  onChange={(e) => handleLLMChange('maxTokens', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* API ключи */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium mb-4">API ключи</h4>
              <div className="space-y-4">
                {/* Gemini API Key */}
                {settings.llm.provider === 'gemini' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Gemini API ключ
                    </label>
                    <input
                      type="password"
                      value={settings.llm.geminiApiKey || ''}
                      onChange={(e) => handleLLMChange('geminiApiKey', e.target.value)}
                      placeholder="Введите ваш API ключ Gemini"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Получить можно на <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
                    </p>
                  </div>
                )}

                {/* OpenRouter API Key */}
                {settings.llm.provider === 'openrouter' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenRouter API ключ
                    </label>
                    <input
                      type="password"
                      value={settings.llm.openrouterApiKey || ''}
                      onChange={(e) => handleLLMChange('openrouterApiKey', e.target.value)}
                      placeholder="Введите ваш API ключ OpenRouter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Получить можно на <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter Dashboard</a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Тестирование подключения */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium mb-4">Тестирование подключения</h4>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isTesting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isTesting ? '🔄 Тестирование...' : `🧪 Тестировать ${settings.llm.provider === 'gemini' ? 'Gemini' : 'OpenRouter'} API`}
                </button>
                
                {settings.llm.provider === 'gemini' && settings.llm.model !== 'gemini-1.5-flash' && (
                  <button
                    onClick={() => handleLLMChange('model', 'gemini-1.5-flash')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    ⚡ Переключить на Flash
                  </button>
                )}
                
                {testStatus && (
                  <div className={`text-sm font-medium ${
                    testStatus.includes('✅') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testStatus}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Проверяет подключение к выбранному LLM провайдеру
              </p>
              
              {settings.llm.provider === 'gemini' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Совет:</strong> Gemini 1.5 Flash 8B имеет самые высокие лимиты бесплатного уровня. 
                    При превышении квоты автоматически переключается на резервную модель.
                  </p>
                </div>
              )}

              {settings.llm.provider === 'openrouter' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>🎯 Рекомендации для собеседований:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1">
                    <li>• <strong>Claude 3 Haiku</strong> - быстрая и экономичная для базовых интервью</li>
                    <li>• <strong>Claude 3 Sonnet</strong> - лучший баланс качества и скорости</li>
                    <li>• <strong>GPT-4</strong> - премиум качество для сложных технических интервью</li>
                    <li>• <strong>Llama 3 8B</strong> - бесплатная альтернатива</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-2">
                    💰 Стоимость варьируется от $0.25 до $30 за 1M токенов
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="space-y-6">
          {/* Показываем только основные промпты */}
          {['interviewer', 'feedback', 'coverLetter'].map(type => {
            const content = settings.prompts[type] || ''
            const titles = {
              interviewer: 'Промпт для интервью',
              feedback: 'Промпт для обратной связи',
              coverLetter: 'Промпт для сопроводительного письма'
            }
            const descriptions = {
              interviewer: 'Основной промпт для проведения собеседования. Автоматически адаптируется под вакансию и кандидата.',
              feedback: 'Промпт для анализа результатов интервью и генерации обратной связи.',
              coverLetter: 'Промпт для создания персонализированного сопроводительного письма.'
            }
            
            return (
              <div key={type} className="card">
                <h3 className="text-xl font-semibold mb-2">{titles[type]}</h3>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Описание:</strong> {descriptions[type]}
                  </p>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => handlePromptChange(type, e.target.value)}
                  rows={type === 'interviewer' ? 15 : 12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
                  placeholder="Введите промпт..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Плейсхолдеры: {type === 'feedback' ? '{jobText}, {resumeText}, {conversation}' : '{jobText}, {resumeText}'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Управление настройками</h3>
            
            <div className="space-y-4">
              {/* Экспорт/Импорт */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleExport}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  📥 Экспортировать настройки
                </button>
                
                <label className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors cursor-pointer">
                  📤 Импортировать настройки
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Сброс */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-4">
                  <div>
                    <button
                      onClick={handleReset}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      🔄 Сбросить все настройки
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Это действие нельзя отменить. Все настройки будут возвращены к значениям по умолчанию.
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-md font-medium mb-3">Отладка данных</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          clearAllData()
                          setSaveStatus('Все данные очищены ✓')
                          setTimeout(() => setSaveStatus(''), 2000)
                        }}
                        className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                      >
                        🗑️ Очистить все данные
                      </button>
                      
                      <button
                        onClick={() => {
                          showAllData()
                          setSaveStatus('Данные выведены в консоль ✓')
                          setTimeout(() => setSaveStatus(''), 2000)
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        📊 Показать данные
                      </button>
                      
                      <button
                        onClick={() => {
                          setTestData()
                          setSaveStatus('Тестовые данные установлены ✓')
                          setTimeout(() => setSaveStatus(''), 2000)
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        🧪 Тестовые данные
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Используйте для отладки проблем с сохранением данных. Также доступно в консоли: debugUtils.*
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
