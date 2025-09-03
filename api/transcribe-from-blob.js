module.exports = async function handler(req, res) {
  console.log('🚀 Transcribe from Blob API called:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      }
    });
  }

  try {
    const API_KEY = process.env.GROQ_API_KEY;
    console.log('🔑 API Key check:', API_KEY ? 'Present' : 'Missing');
    
    if (!API_KEY) {
      return res.status(500).json({
        error: {
          message: 'Groq API key is not configured on server',
          code: 'MISSING_API_KEY'
        }
      });
    }

    const { blobUrl, options = {} } = req.body;

    if (!blobUrl) {
      return res.status(400).json({
        error: {
          message: 'Blob URL is required',
          code: 'MISSING_BLOB_URL'
        }
      });
    }

    // Blob URL에서 파일 다운로드
    console.log('📥 Downloading file from blob URL:', blobUrl);
    const fileResponse = await fetch(blobUrl);
    
    if (!fileResponse.ok) {
      return res.status(400).json({
        error: {
          message: 'Failed to download file from blob URL',
          code: 'BLOB_DOWNLOAD_FAILED'
        }
      });
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get('content-type') || 'audio/mpeg';
    
    // 파일 크기 검증 (500MB 제한)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileBuffer.byteLength > maxSize) {
      return res.status(413).json({
        error: {
          message: `File too large. Maximum size is 500MB, got ${(fileBuffer.byteLength / 1024 / 1024).toFixed(1)}MB.`,
          code: 'FILE_TOO_LARGE'
        }
      });
    }

    // FormData 생성
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: contentType });
    const filename = blobUrl.split('/').pop() || 'audio.mp3';
    formData.append('file', blob, filename);

    // Groq API 옵션 추가
    formData.append('model', options.model || 'whisper-large-v3');
    if (options.language) formData.append('language', options.language);
    if (options.prompt) formData.append('prompt', options.prompt);
    formData.append('response_format', options.response_format || 'verbose_json');
    if (options.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }

    // Groq API 호출
    console.log('📡 Calling Groq API...');
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });

    console.log('📥 Groq API response:', {
      status: response.status,
      statusText: response.statusText
    });

    const data = await response.json();
    console.log('📋 Groq API data:', { success: response.ok, hasText: !!data.text });
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: {
          message: data.error?.message || 'Transcription failed',
          code: data.error?.code || 'API_ERROR'
        }
      });
    }

    return res.status(200).json(data);
      
  } catch (error) {
    console.error('Transcription from Blob API Error:', error);
    
    return res.status(500).json({
      error: {
        message: 'Internal server error during transcription',
        code: 'INTERNAL_ERROR'
      }
    });
  }
};