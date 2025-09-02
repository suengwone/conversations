const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.groq.com/openai/v1';
const API_KEY = process.env.REACT_APP_GROQ_API_KEY;

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
    if (!API_KEY) {
      throw new TranscriptionError(
        'Groq API key is not configured. Please set REACT_APP_GROQ_API_KEY in your environment variables.',
        400,
        'MISSING_API_KEY'
      );
    }

    if (!file) {
      throw new TranscriptionError('No audio file provided', 400, 'MISSING_FILE');
    }

    // Validate file size (25MB limit for Groq Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      throw new TranscriptionError(
        `File too large. Maximum size is 25MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`,
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
              reject(new TranscriptionError(
                errorData.error?.message || 'Transcription failed',
                xhr.status,
                errorData.error?.code || 'API_ERROR'
              ));
            } catch {
              reject(new TranscriptionError(
                `HTTP ${xhr.status}: ${xhr.statusText}`,
                xhr.status,
                'HTTP_ERROR'
              ));
            }
          }
        });

        // Handle network errors
        xhr.addEventListener('error', () => {
          reject(new TranscriptionError(
            'Network error occurred during transcription',
            0,
            'NETWORK_ERROR'
          ));
        });

        // Handle timeout
        xhr.addEventListener('timeout', () => {
          reject(new TranscriptionError(
            'Request timeout. The audio file might be too long or the server is busy.',
            0,
            'TIMEOUT'
          ));
        });

        // Setup request
        xhr.open('POST', `${API_BASE_URL}/audio/transcriptions`);
        xhr.setRequestHeader('Authorization', `Bearer ${API_KEY}`);
        xhr.timeout = 300000; // 5 minutes timeout
        
        // Send request
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
  }
};

export { TranscriptionError };
export default transcriptionService;