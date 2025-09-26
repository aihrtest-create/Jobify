import { getLLMService } from './utils/llmService.js'

/**
 * Connection test endpoint for Vercel Functions
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
    const { settings = {} } = req.body
    const { provider = 'gemini' } = settings
    
    console.log('Testing connection for provider:', provider)
    
    const llmService = getLLMService(settings)
    const result = await llmService.testConnection()
    
    res.json(result)
  } catch (error) {
    console.error('Connection test error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
