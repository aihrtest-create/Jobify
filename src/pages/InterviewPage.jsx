import React, { useReducer, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../utils/apiClient'
import { validateInterviewContext } from '../utils/settings'

/**
 * Начальное состояние интервью
 */
const initialState = {
  phase: 'initializing', // 'initializing' | 'planning' | 'interviewing' | 'completed' | 'error'
  messages: [],
  interviewPlan: null,
  inputText: '',
  isLoading: false,
  isRecording: false,
  recordingTime: 0,
  isTyping: false,
  error: null,
  progress: {
    questionsAsked: 0,
    canComplete: false,
    isAISuggestingCompletion: false,
    completionReason: null
  },
  context: {
    hasJob: false,
    hasResume: false,
    warnings: []
  }
}

/**
 * Reducer для управления состоянием интервью
 * @param {Object} state - Текущее состояние
 * @param {Object} action - Действие
 * @returns {Object} Новое состояние
 */
const interviewReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload, error: null }
    
    case 'SET_CONTEXT':
      return { ...state, context: action.payload }
    
    case 'SET_PLAN':
      return { ...state, interviewPlan: action.payload, phase: 'interviewing' }
    
    case 'ADD_MESSAGE':
      // Проверяем, нет ли уже такого сообщения (по ID)
      const messageExists = state.messages.some(msg => msg.id === action.payload.id)
      if (messageExists) {
        console.warn('Message already exists, skipping:', action.payload.id)
        return state
      }
      
      const newMessages = [...state.messages, action.payload]
      return { 
        ...state, 
        messages: newMessages,
        progress: {
          ...state.progress,
          questionsAsked: action.payload.sender === 'ai' ? state.progress.questionsAsked + 1 : state.progress.questionsAsked
        }
      }
    
    case 'SET_INPUT_TEXT':
      return { ...state, inputText: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload }
    
    case 'SET_RECORDING':
      return { 
        ...state, 
        isRecording: action.payload.isRecording,
        recordingTime: action.payload.recordingTime || 0
      }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isTyping: false }
    
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    
    case 'UPDATE_PROGRESS':
      return { 
        ...state, 
        progress: { ...state.progress, ...action.payload }
      }
    
    case 'SET_COMPLETION':
      return {
        ...state,
        phase: 'completed',
        progress: {
          ...state.progress,
          canComplete: true,
          completionReason: action.payload.reason
        }
      }
    
    case 'RESET':
      return initialState
    
    default:
      console.warn('Unknown action type:', action.type)
      return state
  }
}

/**
 * Страница интервью с ИИ-собеседником
 * Современный интерфейс чата для проведения собеседования с голосовым вводом
 * @returns {JSX.Element} Компонент страницы интервью
 */
const InterviewPage = () => {
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  
  const [state, dispatch] = useReducer(interviewReducer, initialState)

  // Инициализация интервью при загрузке компонента
  useEffect(() => {
    let isInitialized = false
    
    const initializeInterview = async () => {
      if (isInitialized) {
        console.log('Interview already initialized, skipping...')
        return
      }
      
      isInitialized = true
      
      try {
        console.log('Starting interview initialization...')
        dispatch({ type: 'SET_PHASE', payload: 'initializing' })
        
        // Валидация контекста
        const context = apiClient.getContext()
        const validation = validateInterviewContext(context)
        
        dispatch({ type: 'SET_CONTEXT', payload: validation })
        
        console.log('Interview context validation:', validation)
        
        if (!validation.canProceed) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: 'Невозможно начать интервью: ' + validation.warnings.join(', ')
          })
          return
        }
        
        // Планирование интервью
        dispatch({ type: 'SET_PHASE', payload: 'planning' })
        dispatch({ type: 'SET_LOADING', payload: true })
        
        console.log('Starting interview planning...')
        const planResult = await apiClient.planInterview(context)
        
        if (planResult.success) {
          // Используем универсальную структуру плана
          const plan = planResult.data
          
          dispatch({ type: 'SET_PLAN', payload: plan })
          console.log('Interview plan created:', {
            summary: plan.summary,
            questionsCount: plan.questions?.length || 0
          })
        } else {
          console.warn('Planning failed, proceeding without plan:', planResult.error)
          dispatch({ type: 'SET_PLAN', payload: null })
        }
        
        // Добавляем приветственное сообщение
        const greeting = apiClient.getGreeting({ positionName: context.position })
        const greetingMessage = {
          id: `greeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: greeting,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          isGreeting: true
        }
        
        dispatch({ type: 'ADD_MESSAGE', payload: greetingMessage })
        dispatch({ type: 'SET_LOADING', payload: false })
        
        console.log('Interview initialization completed')
        
      } catch (error) {
        console.error('Interview initialization error:', error)
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Ошибка инициализации интервью. Попробуйте обновить страницу.' 
        })
        isInitialized = false // Разрешаем повторную инициализацию при ошибке
      }
    }
    
    initializeInterview()
    
    // Cleanup функция
    return () => {
      isInitialized = false
    }
  }, []) // Пустой массив зависимостей

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.messages])

  // Автоматическое изменение высоты textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [state.inputText])

  /**
   * Обработчик отправки сообщения
   * Добавляет сообщение пользователя и запрашивает ответ от ИИ
   * @param {Event} e - Событие отправки формы
   */
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!state.inputText.trim() || state.isLoading || state.phase !== 'interviewing') return

    const userMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: state.inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage })
    const messageText = state.inputText.trim()
    dispatch({ type: 'SET_INPUT_TEXT', payload: '' })
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_TYPING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })

    try {
      // Отправляем запрос к API с планом интервью
      const result = await apiClient.sendChatMessage(
        messageText, 
        state.messages, 
        state.interviewPlan
      )
      
      dispatch({ type: 'SET_TYPING', payload: false })
      
      if (result.success) {
        const aiMessage = {
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: result.data.message,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          model: result.data.model,
          usage: result.data.usage,
          isCompletionSuggested: result.data.isCompletionSuggested
        }
        
        dispatch({ type: 'ADD_MESSAGE', payload: aiMessage })
        
        // Проверяем, предлагает ли ИИ завершение
        if (result.data.isCompletionSuggested) {
          dispatch({ 
            type: 'UPDATE_PROGRESS', 
            payload: { 
              isAISuggestingCompletion: true,
              canComplete: true 
            }
          })
        }
        
      } else {
        // Обработка ошибок API
        const errorMessage = result.error || 'Произошла ошибка при обращении к ИИ'
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        console.error('API Error:', result)
        
        // Если можно повторить - показываем кнопку
        if (result.canRetry) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: errorMessage + ' (Нажмите для повтора)'
          })
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_TYPING', payload: false })
      dispatch({ type: 'SET_ERROR', payload: 'Ошибка подключения к серверу' })
      console.error('Send message error:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  /**
   * Обработчик голосового ввода
   * Запускает/останавливает запись голоса
   */
  const handleVoiceToggle = () => {
    if (state.isRecording) {
      dispatch({ type: 'SET_RECORDING', payload: { isRecording: false, recordingTime: 0 }})
      // TODO: Здесь будет остановка записи и распознавание речи
      // Пока что имитируем
      setTimeout(() => {
        dispatch({ type: 'SET_INPUT_TEXT', payload: 'Это пример распознанного текста из голосового сообщения' })
      }, 500)
    } else {
      dispatch({ type: 'SET_RECORDING', payload: { isRecording: true, recordingTime: 0 }})
      // TODO: Здесь будет запуск записи - пока упрощенная версия
    }
  }

  /**
   * Обработчик завершения интервью
   * Сохраняет результаты и переходит к дашборду
   */
  const handleEndInterview = () => {
    const reason = state.progress.isAISuggestingCompletion ? 'ai_suggested' : 'user_requested'
    const confirmMessage = state.progress.isAISuggestingCompletion 
      ? 'ИИ предлагает завершить интервью. Продолжить?'
      : 'Вы уверены, что хотите завершить интервью? Это действие нельзя отменить.'
    
    if (window.confirm(confirmMessage)) {
      // Сохраняем интервью в localStorage
      const interview = {
        id: Date.now(),
        messages: state.messages,
        interviewPlan: state.interviewPlan,
        startedAt: state.messages[0]?.timestamp || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        status: 'completed',
        messagesCount: state.messages.length,
        questionsAsked: state.progress.questionsAsked,
        completionReason: reason,
        context: state.context
      }
      
      const interviews = JSON.parse(localStorage.getItem('interviews') || '[]')
      interviews.push(interview)
      localStorage.setItem('interviews', JSON.stringify(interviews))
      
      dispatch({ type: 'SET_COMPLETION', payload: { reason } })
      
      // Переходим к странице обратной связи
      navigate(`/feedback/${interview.id}`)
    }
  }

  /**
   * Обработчик нажатия Enter в textarea
   * Отправляет сообщение при нажатии Enter (но не Shift+Enter)
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  /**
   * Обработчик изменения текста ввода
   */
  const handleInputChange = (e) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: e.target.value })
  }

  /**
   * Обработчик очистки ошибки
   */
  const handleClearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      {/* Chat Header - Зафиксированная шапка с правильными отступами */}
      <div className="flex-shrink-0 pt-20 pb-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-300 rounded-full px-4 sm:px-8 py-3 sm:py-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-black rounded-full p-2 sm:px-3 sm:py-2">
                <span className="text-white text-base sm:text-lg font-bold">💬</span>
              </div>
              <h1 className="text-base sm:text-xl font-semibold text-black">
                Тренировка 1
              </h1>
            </div>
            
            <button
              onClick={handleEndInterview}
              disabled={state.phase !== 'interviewing'}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                state.progress.isAISuggestingCompletion
                  ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                  : 'bg-black hover:bg-gray-800 text-white'
              } ${
                state.phase !== 'interviewing' 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              {state.progress.isAISuggestingCompletion ? 'Завершить ✨' : 'Завершить'} 
              <span className="hidden sm:inline">
                {state.progress.isAISuggestingCompletion ? '' : ' ✍️'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area - Скроллируемая область */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Индикатор состояния */}
          {state.phase === 'initializing' && (
            <div className="flex items-center justify-center py-8">
              <div className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-slate-600">Инициализация интервью...</span>
                </div>
              </div>
            </div>
          )}

          {state.phase === 'planning' && (
            <div className="flex items-center justify-center py-8">
              <div className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <span className="text-slate-600">Анализируем вакансию и резюме...</span>
                </div>
                {state.context.warnings.length > 0 && (
                  <div className="mt-2 text-xs text-amber-600">
                    {state.context.warnings.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Сообщения */}
          {state.messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 sm:space-x-4 animate-fadeIn ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              }`}>
                {message.sender === 'user' ? '👤' : '🤖'}
              </div>
              
              <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                <div className={`rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 max-w-lg inline-block shadow-sm border ${
                  message.sender === 'user'
                    ? 'bg-black text-white border-black ml-auto'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{message.text}</p>
                </div>
                <span className={`text-xs text-slate-400 mt-2 block ${
                  message.sender === 'user' ? 'mr-2' : 'ml-2'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {state.isTyping && (
            <div className="flex items-start space-x-2 sm:space-x-4 animate-fadeIn">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm sm:text-lg">🤖</span>
              </div>
              <div className="bg-white rounded-xl sm:rounded-2xl px-6 py-4 shadow-sm border border-slate-200">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area - Зафиксированное поле ввода с правильными отступами */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-300 rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-sm flex items-center space-x-2 sm:space-x-4">
            {/* Text Input */}
            <div className="flex-1">
              <input
                type="text"
                value={state.inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  state.phase === 'interviewing' 
                    ? "Напишите сообщение" 
                    : state.phase === 'planning'
                    ? "Анализируем данные..."
                    : "Инициализация..."
                }
                className="w-full bg-transparent text-slate-700 placeholder-slate-500 focus:outline-none text-base"
                disabled={state.isLoading || state.isRecording || state.phase !== 'interviewing'}
              />
            </div>

            {/* Voice Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                state.isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              disabled={state.isLoading || state.phase !== 'interviewing'}
              aria-label={state.isRecording ? 'Остановить запись' : 'Начать запись голоса'}
            >
              <span className="text-sm sm:text-base">{state.isRecording ? '⏹️' : '🎤'}</span>
            </button>

            {/* Send Button */}
            <button
              type="submit"
              onClick={handleSendMessage}
              disabled={!state.inputText.trim() || state.isLoading || state.isRecording || state.phase !== 'interviewing'}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                state.inputText.trim() && !state.isLoading && !state.isRecording && state.phase === 'interviewing'
                  ? 'bg-black hover:bg-gray-800 text-white shadow-md hover:scale-105'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              aria-label="Отправить сообщение"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>

          {/* Recording Timer */}
          {state.isRecording && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                🔴 Запись: {state.recordingTime}s
              </div>
            </div>
          )}

          {/* Error Message */}
          {state.error && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium max-w-md">
                ⚠️ {state.error}
                <button
                  onClick={handleClearError}
                  className="ml-2 text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InterviewPage
