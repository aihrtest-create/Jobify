/**
 * Health check endpoint for Vercel Functions
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default function handler(req, res) {
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

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Jobify.ai API is running on Vercel',
    environment: process.env.NODE_ENV || 'development'
  })
}
