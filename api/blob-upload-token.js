const { handleUpload } = require('@vercel/blob/client');

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
    const { filename, contentType } = req.body;

    if (!filename) {
      return res.status(400).json({
        error: {
          message: 'Filename is required',
          code: 'MISSING_FILENAME'
        }
      });
    }

    // Vercel Blob에 업로드 토큰 요청
    const blob = await handleUpload({
      body: req,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/m4a',
            'audio/mp4',
            'audio/webm',
            'audio/ogg'
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
        };
      },
    });

    return res.status(200).json({
      url: blob.url,
      uploadUrl: blob.uploadUrl,
      token: blob.token
    });

  } catch (error) {
    console.error('Blob upload token error:', error);
    
    return res.status(500).json({
      error: {
        message: 'Failed to generate upload token',
        code: 'TOKEN_GENERATION_FAILED'
      }
    });
  }
};