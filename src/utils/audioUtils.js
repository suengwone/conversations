/**
 * Audio processing utilities for file analysis and Web Audio API integration
 */

export class AudioProcessor {
  constructor() {
    this.audioContext = null;
  }

  /**
   * Extract comprehensive metadata from audio file
   * @param {File} file - Audio file to analyze
   * @returns {Promise<Object>} Audio metadata
   */
  async extractMetadata(file) {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      const url = URL.createObjectURL(file);
      
      const cleanup = () => {
        URL.revokeObjectURL(url);
        audio.remove();
      };

      const handleMetadata = () => {
        try {
          const metadata = {
            // Basic info
            duration: audio.duration || 0,
            
            // File info
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            
            // Audio properties (available from HTML audio element)
            seekable: audio.seekable.length > 0,
            buffered: audio.buffered.length > 0,
            
            // Calculated properties
            bitrate: this.calculateBitrate(file.size, audio.duration),
            formattedDuration: this.formatDuration(audio.duration),
            formattedSize: this.formatFileSize(file.size),
            
            // Additional info
            canPlay: audio.canPlayType(file.type) !== '',
            readyState: audio.readyState,
            networkState: audio.networkState
          };
          
          cleanup();
          resolve(metadata);
        } catch (error) {
          cleanup();
          reject(new Error(`Failed to extract metadata: ${error.message}`));
        }
      };

      const handleError = (error) => {
        cleanup();
        reject(new Error(`Audio file loading failed: ${error.message || 'Unknown error'}`));
      };

      // Set up event listeners
      audio.addEventListener('loadedmetadata', handleMetadata);
      audio.addEventListener('error', handleError);
      audio.addEventListener('abort', () => handleError(new Error('Loading aborted')));
      
      // Start loading
      audio.preload = 'metadata';
      audio.src = url;
    });
  }

  /**
   * Convert file to ArrayBuffer for processing
   * @param {File} file - File to convert
   * @returns {Promise<ArrayBuffer>} File as ArrayBuffer
   */
  async fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result);
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
      };
      
      reader.onabort = () => {
        reject(new Error('File reading was aborted'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Initialize and get Web Audio API context
   * @returns {AudioContext} Web Audio API context
   */
  getAudioContext() {
    if (!this.audioContext) {
      try {
        // Try standard AudioContext first, then webkit fallback
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        
        if (!AudioContextClass) {
          throw new Error('Web Audio API not supported in this browser');
        }
        
        this.audioContext = new AudioContextClass();
        
        // Handle suspended context (required for autoplay policies)
        if (this.audioContext.state === 'suspended') {
          console.log('AudioContext suspended, will resume when user interacts');
        }
      } catch (error) {
        throw new Error(`Failed to create AudioContext: ${error.message}`);
      }
    }
    
    return this.audioContext;
  }

  /**
   * Analyze audio file using Web Audio API
   * @param {File} file - Audio file to analyze
   * @returns {Promise<Object>} Audio analysis data
   */
  async analyzeAudioFile(file) {
    try {
      const audioContext = this.getAudioContext();
      
      // Resume context if suspended (for autoplay policy compliance)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await this.fileToArrayBuffer(file);
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      return {
        // Buffer properties
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length,
        
        // Calculated properties
        bitDepth: this.estimateBitDepth(file.size, audioBuffer.duration, audioBuffer.sampleRate, audioBuffer.numberOfChannels),
        quality: this.assessAudioQuality(audioBuffer.sampleRate, audioBuffer.numberOfChannels),
        
        // Format info
        channelConfiguration: this.getChannelConfiguration(audioBuffer.numberOfChannels),
        sampleRateQuality: this.getSampleRateQuality(audioBuffer.sampleRate)
      };
    } catch (error) {
      throw new Error(`Audio analysis failed: ${error.message}`);
    }
  }

  /**
   * Get audio waveform data for visualization
   * @param {File} file - Audio file
   * @param {number} samples - Number of samples for waveform (default: 1000)
   * @returns {Promise<Float32Array>} Waveform data
   */
  async getWaveformData(file, samples = 1000) {
    try {
      const audioContext = this.getAudioContext();
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0); // Use first channel
      const blockSize = Math.floor(channelData.length / samples);
      const waveform = new Float32Array(samples);
      
      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let max = 0;
        
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > max) max = abs;
        }
        
        waveform[i] = max;
      }
      
      return waveform;
    } catch (error) {
      throw new Error(`Waveform generation failed: ${error.message}`);
    }
  }

  // Utility functions
  calculateBitrate(fileSize, duration) {
    if (!duration || duration <= 0) return 0;
    return Math.round((fileSize * 8) / (duration * 1000)); // kbps
  }

  estimateBitDepth(fileSize, duration, sampleRate, channels) {
    if (!duration || duration <= 0) return 0;
    const totalSamples = duration * sampleRate * channels;
    const bitsPerSample = (fileSize * 8) / totalSamples;
    return Math.round(bitsPerSample);
  }

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getChannelConfiguration(channels) {
    const configs = {
      1: 'Mono',
      2: 'Stereo',
      6: '5.1 Surround',
      8: '7.1 Surround'
    };
    return configs[channels] || `${channels} channels`;
  }

  getSampleRateQuality(sampleRate) {
    if (sampleRate >= 96000) return 'Studio Quality (96kHz+)';
    if (sampleRate >= 48000) return 'Professional (48kHz)';
    if (sampleRate >= 44100) return 'CD Quality (44.1kHz)';
    if (sampleRate >= 22050) return 'Radio Quality (22kHz)';
    return 'Low Quality (<22kHz)';
  }

  assessAudioQuality(sampleRate, channels) {
    let score = 0;
    
    // Sample rate scoring
    if (sampleRate >= 48000) score += 40;
    else if (sampleRate >= 44100) score += 35;
    else if (sampleRate >= 22050) score += 20;
    else score += 10;
    
    // Channel scoring
    if (channels >= 2) score += 30;
    else score += 15;
    
    // Additional points for high-end formats
    if (sampleRate >= 96000) score += 20;
    if (channels > 2) score += 10;
    
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  /**
   * Close audio context and cleanup resources
   */
  dispose() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Create singleton instance
const audioProcessor = new AudioProcessor();

// Export utility functions
export const extractAudioMetadata = (file) => audioProcessor.extractMetadata(file);
export const fileToArrayBuffer = (file) => audioProcessor.fileToArrayBuffer(file);
export const analyzeAudioFile = (file) => audioProcessor.analyzeAudioFile(file);
export const getWaveformData = (file, samples) => audioProcessor.getWaveformData(file, samples);
export const getAudioContext = () => audioProcessor.getAudioContext();

export default audioProcessor;