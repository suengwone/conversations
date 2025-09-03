const { put } = require('@vercel/blob');
const { IncomingForm } = require('formidable');
const fs = require('fs');

// Vercel에서 body parser 비활성화
const config = {
  api: {
    bodyParser: false,
    responseLimit: false
  },
  maxDuration: 300,
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
    // formidable로 파일 파싱 (500MB limit)
    const form = new IncomingForm({
      maxFileSize: 500 * 1024 * 1024, // 500MB
      maxFields: 10,
      multiples: false,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
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

    // 파일을 Vercel Blob에 업로드
    const fileBuffer = fs.readFileSync(audioFile.filepath);
    const filename = `audio-uploads/${Date.now()}-${audioFile.originalFilename || 'audio.mp3'}`;
    
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: audioFile.mimetype || 'audio/mpeg'
    });

    // 임시 파일 정리
    try {
      if (audioFile.filepath && fs.existsSync(audioFile.filepath)) {
        fs.unlinkSync(audioFile.filepath);
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }

    return res.status(200).json({
      url: blob.url
    });

  } catch (error) {
    console.error('Blob upload error:', error);
    
    return res.status(500).json({
      error: {
        message: `Failed to upload file to blob storage: ${error.message}`,
        code: 'BLOB_UPLOAD_FAILED'
      }
    });
  }
};

module.exports.config = config;