// Vercel API 엔드포인트 사용 (개발/배포 환경에 따라 자동 감지)
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api'
  : '/api';

class TranscriptionError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'TranscriptionError';
    this.status = status;
    this.code = code;
  }
}

export const transcriptionService = {
  /**
   * Transcribe audio file using Groq Whisper API via Vercel Blob Storage
   * @param {File} file - Audio file to transcribe
   * @param {Object} options - Transcription options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(file, options = {}, onProgress = null) {
    console.log('🎯 TranscriptionService.transcribeAudio called:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      apiBaseUrl: API_BASE_URL,
      nodeEnv: process.env.NODE_ENV,
      options
    });

    if (!file) {
      throw new TranscriptionError('No audio file provided', 400, 'MISSING_FILE');
    }

    // Validate file size (500MB limit with Vercel Blob)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      throw new TranscriptionError(
        `File too large. Maximum size is 500MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB. Please compress your audio file.`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    // Validate file type
    const supportedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/mp4',
      'audio/webm',
      'audio/ogg'
    ];
    
    if (!supportedTypes.includes(file.type)) {
      throw new TranscriptionError(
        `Unsupported file type: ${file.type}. Supported types: ${supportedTypes.join(', ')}`,
        400,
        'UNSUPPORTED_FILE_TYPE'
      );
    }

    try {
      // Step 1: Upload file to Vercel Blob Storage
      console.log('📤 Uploading to Vercel Blob...');
      
      if (onProgress) {
        onProgress(10); // Show initial progress
      }

      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to Vercel Blob
      const uploadResponse = await fetch(`${API_BASE_URL}/blob-upload-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      });

      if (!uploadResponse.ok) {
        throw new TranscriptionError(
          'Failed to get upload token from server',
          uploadResponse.status,
          'UPLOAD_TOKEN_FAILED'
        );
      }

      const { url, uploadUrl } = await uploadResponse.json();
      
      if (onProgress) {
        onProgress(30); // Upload token received
      }

      // Upload file directly to Vercel Blob
      const blobUploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!blobUploadResponse.ok) {
        throw new TranscriptionError(
          'Failed to upload file to blob storage',
          blobUploadResponse.status,
          'BLOB_UPLOAD_FAILED'
        );
      }

      if (onProgress) {
        onProgress(60); // File uploaded to blob
      }

      // Step 2: Process file from blob URL
      console.log('📡 Processing file from blob URL...');
      
      const transcribeResponse = await fetch(`${API_BASE_URL}/transcribe-from-blob`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blobUrl: url,
          options: {
            model: options.model || 'whisper-large-v3',
            language: options.language,
            prompt: options.prompt,
            response_format: options.response_format || 'verbose_json',
            temperature: options.temperature
          }
        })
      });

      if (onProgress) {
        onProgress(90); // Transcription in progress
      }

      const data = await transcribeResponse.json();

      if (!transcribeResponse.ok) {
        throw new TranscriptionError(
          data.error?.message || 'Transcription failed',
          transcribeResponse.status,
          data.error?.code || 'API_ERROR'
        );
      }

      if (onProgress) {
        onProgress(100); // Complete
      }

      return data;
      
    } catch (error) {
      if (error instanceof TranscriptionError) {
        throw error;
      }
      
      throw new TranscriptionError(
        `Unexpected error: ${error.message}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  },

  /**
   * Get supported languages for transcription
   */
  getSupportedLanguages() {
    return {
      'ko': 'Korean (한국어)',
      'en': 'English',
      'ja': 'Japanese (日本語)',
      'zh': 'Chinese (中文)',
      'es': 'Spanish (Español)',
      'fr': 'French (Français)',
      'de': 'German (Deutsch)',
      'ru': 'Russian (Русский)',
      'auto': 'Auto-detect'
    };
  },

  /**
   * Get available response formats
   */
  getResponseFormats() {
    return {
      'json': 'JSON (text only)',
      'verbose_json': 'Verbose JSON (with timestamps)',
      'text': 'Plain text',
      'srt': 'SRT subtitle format',
      'vtt': 'WebVTT subtitle format'
    };
  },

  /**
   * Estimate transcription time based on audio duration
   * @param {number} audioDuration - Duration in seconds
   * @returns {number} Estimated time in seconds
   */
  estimateTranscriptionTime(audioDuration) {
    // Rough estimate: Whisper processes about 1 minute of audio in 2-5 seconds
    return Math.ceil(audioDuration * 0.1) + 10; // Add 10 seconds buffer
  },

  /**
   * Get audio compression tips for users
   * @returns {Array} Array of compression tips
   */
  getCompressionTips() {
    return [
      '🎵 Convert to MP3 format for better compression',
      '📉 Reduce bit rate to 64-128 kbps for voice recordings',
      '⏱️ Consider splitting long recordings into shorter segments',
      '🔧 Use audio editing software like Audacity (free)',
      '📱 Record at lower quality on mobile devices',
      '💡 Remove silence at the beginning and end of recordings'
    ];
  }
};

export { TranscriptionError };
export default transcriptionService;