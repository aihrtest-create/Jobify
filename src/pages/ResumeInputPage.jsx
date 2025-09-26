import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Страница ввода резюме пользователя с возможностью загрузки файла
 * Позволяет ввести или загрузить резюме для анализа
 * @returns {JSX.Element} Компонент страницы ввода резюме
 */
const ResumeInputPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [resumeText, setResumeText] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Загружаем существующие данные резюме при загрузке страницы
  React.useEffect(() => {
    try {
      const existingResumeData = JSON.parse(localStorage.getItem('resumeData') || '{}')
      if (existingResumeData.text) {
        setResumeText(existingResumeData.text)
        console.log('📝 Загружены существующие данные резюме для редактирования')
      }
    } catch (error) {
      console.error('Ошибка загрузки данных резюме:', error)
    }
  }, [])

  /**
   * Обработчик изменения текста резюме
   * @param {Event} e - Событие изменения textarea
   */
  const handleChange = (e) => {
    setResumeText(e.target.value)
  }

  /**
   * Обработчик загрузки файла
   * @param {Event} e - Событие выбора файла
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadedFile(file)
      // TODO: Здесь будет обработка файла (извлечение текста)
      console.log('Файл резюме загружен:', file.name)
    }
  }

  /**
   * Обработчик drag and drop
   * @param {Event} e - Событие перетаскивания
   */
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setUploadedFile(file)
      console.log('Файл резюме перетащен:', file.name)
    }
  }

  /**
   * Обработчик отправки формы
   * Сохраняет резюме и переходит к дашборду
   * @param {Event} e - Событие отправки формы
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!resumeText.trim() && !uploadedFile) {
      alert('Пожалуйста, введите текст резюме или загрузите файл')
      return
    }
    
    // Очищаем старые данные резюме и интервью перед сохранением новых
    localStorage.removeItem('resumeData')
    localStorage.removeItem('interviews')
    console.log('🗑️ Старые данные резюме и интервью очищены')
    
    // Сохраняем новые данные резюме в localStorage в новом формате
    const newResumeData = {
      // Новый формат: основное поле для API
      text: resumeText, // Это будет использоваться как resumeText в API
      content: resumeText, // Дублируем для совместимости
      
      // Метаданные
      uploadedFile: uploadedFile ? uploadedFile.name : null,
      updatedAt: new Date().toISOString()
    }
    
    localStorage.setItem('resumeData', JSON.stringify(newResumeData))
    console.log('✅ Новые данные резюме сохранены:', newResumeData)
    
    // Переходим к дашборду
    navigate('/dashboard')
  }

  /**
   * Обработчик пропуска ввода резюме
   * Переходит к дашборду без сохранения данных
   */
  const handleSkip = () => {
    // Переходим к дашборду без сохранения резюме
    navigate('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-3 sm:mb-4">
          Ваше резюме
        </h1>
        <p className="text-sm sm:text-base text-primary-500">
          Вставьте текст вашего резюме для персонализированной подготовки к интервью
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 sm:space-y-6">
        {/* Загрузка файла */}
        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Загрузить файл резюме (опционально)
          </label>
          <div
            className={`border-2 border-dashed rounded-2xl p-4 text-center transition-colors ${
              isDragOver 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="text-primary-900 font-medium">
                  📄 {uploadedFile.name}
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="text-sm text-primary-500 hover:text-primary-700"
                >
                  Удалить файл
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-3xl">📁</div>
                <div className="text-primary-900 font-medium text-sm">
                  Перетащите файл сюда или
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-500 hover:text-primary-700 underline text-sm"
                >
                  выберите файл
                </button>
                <div className="text-xs text-primary-400">
                  PDF, DOC, DOCX, TXT
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="text-center text-sm text-primary-500">
          или введите текст ниже
        </div>

        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-primary-900 mb-2">
            Текст резюме
          </label>
          <textarea
            id="resume"
            name="resume"
            value={resumeText}
            onChange={handleChange}
            rows={5}
            className="input-field"
            placeholder="Вставьте текст вашего резюме здесь..."
          />
          <p className="text-xs sm:text-sm text-primary-400 mt-2">
            Включите информацию о образовании, опыте работы, навыках и достижениях
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 Совет
          </h3>
          <p className="text-xs sm:text-sm text-blue-700">
            Чем подробнее будет ваше резюме, тем более точные вопросы сможет задать ИИ-интервьюер 
            и тем полезнее будет обратная связь.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary text-sm py-2 px-4 order-3 sm:order-1"
          >
            ← Назад
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="btn-secondary text-sm py-2 px-4 order-2 sm:order-2 border-dashed border-2 border-gray-300 hover:border-gray-400"
          >
            Пропустить
          </button>
          <button
            type="submit"
            className="btn-accent text-sm py-2 px-6 order-1 sm:order-3 flex-1"
          >
            Сохранить и продолжить →
          </button>
        </div>
      </form>
    </div>
  )
}

export default ResumeInputPage
