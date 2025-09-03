const { IncomingForm } = require('formidable');
const fs = require('fs');

// Vercel에서 body parser 비활성화
const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 300,
};

module.exports = async function handler(req, res) {
  console.log('🚀 Transcribe API called:', {
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
    console.log('📊 Environment variables:', {
      GROQ_API_KEY: API_KEY ? `${API_KEY.substring(0, 8)}...` : 'undefined',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    if (!API_KEY) {
      return res.status(500).json({
        error: {
          message: 'Groq API key is not configured on server',
          code: 'MISSING_API_KEY'
        }
      });
    }

    // formidable 설정으로 파일 처리 (15MB limit)
    const form = new IncomingForm({
      maxFileSize: 15 * 1024 * 1024, // 15MB
      maxFields: 10,
      multiples: false,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          if (err.code === 'LIMIT_FILE_SIZE') {
            reject(new Error('FILE_TOO_LARGE'));
          } else {
            reject(err);
          }
        } else {
          resolve([fields, files]);
        }
      });
    });

    const audioFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!audioFile) {
      return res.status(400).json({
        error: {
          message: 'No audio file provided',
          code: 'MISSING_FILE'
        }
      });
    }

    // 파일 크기 검증
    if (audioFile.size > 15 * 1024 * 1024) {
      return res.status(413).json({
        error: {
          message: `File too large. Maximum size is 15MB, got ${(audioFile.size / 1024 / 1024).toFixed(1)}MB`,
          code: 'FILE_TOO_LARGE'
        }
      });
    }

    // FormData 생성
    const formData = new FormData();
    
    try {
      // 파일 읽기 및 추가
      const fileBuffer = fs.readFileSync(audioFile.filepath);
      const blob = new Blob([fileBuffer], { type: audioFile.mimetype || 'audio/mpeg' });
      formData.append('file', blob, audioFile.originalFilename || 'audio.mp3');
      
      // 다른 필드 추가 (배열인 경우 첫 번째 값 사용)
      const getFieldValue = (field) => Array.isArray(field) ? field[0] : field;
      
      formData.append('model', getFieldValue(fields.model) || 'whisper-large-v3');
      if (fields.language) formData.append('language', getFieldValue(fields.language));
      if (fields.prompt) formData.append('prompt', getFieldValue(fields.prompt));
      formData.append('response_format', getFieldValue(fields.response_format) || 'verbose_json');
      if (fields.temperature) formData.append('temperature', getFieldValue(fields.temperature));

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
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
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
      
    } finally {
      // 임시 파일 정리 (항상 실행)
      try {
        if (audioFile.filepath && fs.existsSync(audioFile.filepath)) {
          fs.unlinkSync(audioFile.filepath);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
    }
    
  } catch (error) {
    console.error('Transcription API Error:', error);
    
    if (error.message === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        error: {
          message: 'File too large. Maximum size is 15MB.',
          code: 'FILE_TOO_LARGE'
        }
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Internal server error during transcription',
        code: 'INTERNAL_ERROR'
      }
    });
  }
};

module.exports.config = config;