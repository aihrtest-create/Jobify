import geminiService from './services/geminiService.js'

/**
 * Gemini API test endpoint for Vercel Functions
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

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const result = await geminiService.testConnection()
    res.status(200).json(result)
  } catch (error) {
    console.error('Gemini test error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
