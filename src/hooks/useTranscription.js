import { useState, useCallback } from 'react';
import transcriptionService, { TranscriptionError } from '../services/transcriptionService';

export const useTranscription = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const transcribe = useCallback(async (file, options = {}) => {
    try {
      // Reset states
      setIsTranscribing(true);
      setProgress(0);
      setResult(null);
      setError(null);

      // Get audio duration for time estimation
      const audioDuration = await getAudioDuration(file);
      const estimated = transcriptionService.estimateTranscriptionTime(audioDuration);
      setEstimatedTime(estimated);

      // Default options
      const defaultOptions = {
        language: 'ko', // Korean by default
        response_format: 'verbose_json',
        temperature: 0.2, // Lower temperature for more consistent results
        ...options
      };

      // Progress callback
      const onProgress = (uploadProgress) => {
        // Upload progress is 0-100, transcription happens after upload
        // So we map upload to 0-50% and transcription to 50-100%
        setProgress(Math.min(uploadProgress * 0.5, 50));
      };

      // Start transcription
      const transcriptionResult = await transcriptionService.transcribeAudio(
        file,
        defaultOptions,
        onProgress
      );

      // Simulate processing progress (since API doesn't provide real-time progress)
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(100);
      setResult(transcriptionResult);
      
      return transcriptionResult;
      
    } catch (err) {
      const transcriptionError = err instanceof TranscriptionError ? err : 
        new TranscriptionError(err.message || 'Unknown transcription error', 500, 'UNKNOWN');
      
      setError(transcriptionError);
      throw transcriptionError;
      
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const retry = useCallback(async (file, options = {}) => {
    return transcribe(file, options);
  }, [transcribe]);

  const reset = useCallback(() => {
    setIsTranscribing(false);
    setProgress(0);
    setResult(null);
    setError(null);
    setEstimatedTime(0);
  }, []);

  return {
    // States
    isTranscribing,
    progress,
    result,
    error,
    estimatedTime,
    
    // Actions
    transcribe,
    retry,
    reset,
    
    // Utilities
    getSupportedLanguages: transcriptionService.getSupportedLanguages,
    getResponseFormats: transcriptionService.getResponseFormats
  };
};

// Helper function to get audio duration
const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);
      resolve(duration || 60); // Default to 60 seconds if duration unknown
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(60); // Default fallback
    });
    
    audio.src = url;
  });
};

export default useTranscription;