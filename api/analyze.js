export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      }
    });
  }

  try {
    const API_KEY = process.env.GROQ_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        error: {
          message: 'Groq API key is not configured on server',
          code: 'MISSING_API_KEY'
        }
      });
    }

    const { prompt, options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: {
          message: 'Prompt is required',
          code: 'MISSING_PROMPT'
        }
      });
    }

    const requestBody = {
      model: options.model || 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4000,
      top_p: options.top_p || 0.9,
      stream: false
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: {
          message: data.error?.message || 'AI analysis failed',
          code: data.error?.code || 'API_ERROR'
        }
      });
    }

    // AI 응답에서 텍스트 추출
    const aiResponse = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({
      response: aiResponse,
      usage: data.usage,
      model: data.model
    });

  } catch (error) {
    console.error('AI Analysis API Error:', error);
    
    return res.status(500).json({
      error: {
        message: 'Internal server error during AI analysis',
        code: 'INTERNAL_ERROR'
      }
    });
  }
}