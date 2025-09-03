module.exports = async function handler(req, res) {
  console.log('🧪 Test API called:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.GROQ_API_KEY;
  
  return res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasApiKey: !!API_KEY,
      apiKeyPrefix: API_KEY ? `${API_KEY.substring(0, 8)}...` : 'Not set'
    }
  });
};