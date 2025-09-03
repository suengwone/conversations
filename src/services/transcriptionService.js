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
   * Transcribe audio file using Groq Whisper API
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

    // Validate file size (10MB limit - practical limit for Vercel)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new TranscriptionError(
        `File too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB. Please compress your audio file or use a shorter recording.`,
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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', options.model || 'whisper-large-v3');
    
    // Optional parameters
    if (options.language) {
      formData.append('language', options.language);
    }
    
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }
    
    if (options.response_format) {
      formData.append('response_format', options.response_format);
    } else {
      formData.append('response_format', 'verbose_json'); // Default to verbose for timestamps
    }
    
    if (options.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }

    try {
      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(Math.round(progress));
            }
          });
        }

        // Handle response
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (parseError) {
              reject(new TranscriptionError(
                'Failed to parse API response',
                xhr.status,
                'PARSE_ERROR'
              ));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              let errorMessage = errorData.error?.message || 'Transcription failed';
              
              // HTTP 413 에러에 대한 특별 처리
              if (xhr.status === 413) {
                errorMessage = 'File too large for upload. The server has a size limit. Please try compressing your audio file or using a shorter recording (recommended: under 10MB).';
              }
              
              reject(new TranscriptionError(
                errorMessage,
                xhr.status,
                errorData.error?.code || 'API_ERROR'
              ));
            } catch {
              let errorMessage = `HTTP ${xhr.status}: ${xhr.statusText}`;
              
              // HTTP 413 에러에 대한 기본 메시지
              if (xhr.status === 413) {
                errorMessage = 'File too large for upload. Please try a smaller audio file (recommended: under 10MB).';
              }
              
              reject(new TranscriptionError(
                errorMessage,
                xhr.status,
                'HTTP_ERROR'
              ));
            }
          }
        });

        // Handle network errors
        xhr.addEventListener('error', () => {
          reject(new TranscriptionError(
            'Network error occurred during transcription. Please check your internet connection.',
            0,
            'NETWORK_ERROR'
          ));
        });

        // Handle timeout
        xhr.addEventListener('timeout', () => {
          reject(new TranscriptionError(
            'Request timeout after 5 minutes. The audio file might be too long or the server is busy. Please try with a shorter audio file.',
            0,
            'TIMEOUT'
          ));
        });

        // Setup request
        const requestUrl = `${API_BASE_URL}/transcribe`;
        console.log('📡 Making request to:', requestUrl);
        
        xhr.open('POST', requestUrl);
        xhr.timeout = 300000; // 5 minutes timeout
        
        // Send request
        console.log('📤 Sending formData:', {
          fileSize: formData.get('file')?.size || 'unknown',
          model: formData.get('model'),
          responseFormat: formData.get('response_format')
        });
        xhr.send(formData);
      });
      
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