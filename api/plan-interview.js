import geminiService from './services/geminiService.js'

/**
 * Interview planning endpoint for Vercel Functions
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { context = {}, settings = {} } = req.body
    
    console.log('Interview planning request:', {
      hasJob: !!context.jobText,
      hasResume: !!context.resumeText,
      jobLength: context.jobText?.length || 0
    })
    
    const result = await geminiService.planInterview(context, settings)
    
    console.log('Interview plan generated:', {
      success: result.success,
      hasQuestions: !!result.data?.questions
    })
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Interview planning error:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при планировании интервью',
      details: error.message
    })
  }
}
