const { IncomingForm } = require('formidable');
const fs = require('fs');

// Vercel에서 body parser 비활성화
const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
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

    // formidable을 사용해 multipart 데이터 파싱
    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const audioFile = files.file;
    if (!audioFile) {
      return res.status(400).json({
        error: {
          message: 'No audio file provided',
          code: 'MISSING_FILE'
        }
      });
    }

    // FormData 생성
    const formData = new FormData();
    
    // 파일 읽기 및 추가
    const fileBuffer = fs.readFileSync(audioFile.filepath);
    const blob = new Blob([fileBuffer], { type: audioFile.mimetype });
    formData.append('file', blob, audioFile.originalFilename);
    
    // 다른 필드 추가
    formData.append('model', fields.model || 'whisper-large-v3');
    if (fields.language) formData.append('language', fields.language);
    if (fields.prompt) formData.append('prompt', fields.prompt);
    formData.append('response_format', fields.response_format || 'verbose_json');
    if (fields.temperature) formData.append('temperature', fields.temperature);

    // Groq API 호출
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });

    const data = await response.json();
    
    // 임시 파일 정리
    fs.unlinkSync(audioFile.filepath);
    
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
    console.error('Transcription API Error:', error);
    
    return res.status(500).json({
      error: {
        message: 'Internal server error during transcription',
        code: 'INTERNAL_ERROR'
      }
    });
  }
};

module.exports.config = config;