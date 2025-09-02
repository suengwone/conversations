import { useState, useCallback, useRef } from 'react';
import { aiAnalysisService } from '../services/aiAnalysisService';

const useAIAnalysis = () => {
  // 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);

  // 캐싱을 위한 참조
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  /**
   * 캐시 키 생성
   * @param {string} text - 분석할 텍스트
   * @param {Object} options - 분석 옵션
   * @returns {string} 캐시 키
   */
  const generateCacheKey = useCallback((text, options = {}) => {
    const normalizedText = text.trim().toLowerCase();
    const optionsString = JSON.stringify(options);
    return `${normalizedText.substring(0, 100)}_${optionsString}`;
  }, []);

  /**
   * 캐시에서 결과 가져오기
   * @param {string} cacheKey - 캐시 키
   * @returns {Object|null} 캐시된 결과
   */
  const getCachedResult = useCallback((cacheKey) => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      // 1시간 이내의 결과만 사용
      const isRecent = Date.now() - cached.timestamp < 60 * 60 * 1000;
      if (isRecent) {
        return cached.result;
      } else {
        cacheRef.current.delete(cacheKey);
      }
    }
    return null;
  }, []);

  /**
   * 결과를 캐시에 저장
   * @param {string} cacheKey - 캐시 키
   * @param {Object} result - 저장할 결과
   */
  const setCachedResult = useCallback((cacheKey, result) => {
    cacheRef.current.set(cacheKey, {
      result: result,
      timestamp: Date.now()
    });

    // 캐시 크기 제한 (최대 50개)
    if (cacheRef.current.size > 50) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
  }, []);

  /**
   * 텍스트 요약 분석
   * @param {string} text - 요약할 텍스트
   * @param {Object} options - 요약 옵션
   * @returns {Promise<Object>} 요약 결과
   */
  const analyzeSummary = useCallback(async (text, options = {}) => {
    if (!text || text.trim().length === 0) {
      throw new Error('텍스트가 비어있습니다.');
    }

    const cacheKey = generateCacheKey(text, { type: 'summary', ...options });
    const cachedResult = getCachedResult(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisType('summary');
    setError(null);

    try {
      setProgress(30);
      const result = await aiAnalysisService.summarizeText(text, options);
      setProgress(100);
      
      setCachedResult(cacheKey, result);
      
      return result;
    } catch (err) {
      console.error('❌ AI 분석 에러:', err);
      setError(err);
      throw err;
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setAnalysisType(null);
    }
  }, [generateCacheKey, getCachedResult, setCachedResult]);

  /**
   * 키워드 추출 분석
   * @param {string} text - 키워드를 추출할 텍스트
   * @param {Object} options - 키워드 옵션
   * @returns {Promise<Object>} 키워드 결과
   */
  const analyzeKeywords = useCallback(async (text, options = {}) => {
    if (!text || text.trim().length === 0) {
      throw new Error('텍스트가 비어있습니다.');
    }

    const cacheKey = generateCacheKey(text, { type: 'keywords', ...options });
    const cachedResult = getCachedResult(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisType('keywords');
    setError(null);

    try {
      setProgress(30);
      const result = await aiAnalysisService.extractKeywords(text, options);
      setProgress(100);
      
      setCachedResult(cacheKey, result);
      
      return result;
    } catch (err) {
      console.error('❌ AI 분석 에러:', err);
      setError(err);
      throw err;
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setAnalysisType(null);
    }
  }, [generateCacheKey, getCachedResult, setCachedResult]);

  /**
   * 예상 질문 생성 분석
   * @param {string} text - 질문을 생성할 텍스트
   * @param {Object} options - 질문 옵션
   * @returns {Promise<Object>} 질문 결과
   */
  const analyzeQuestions = useCallback(async (text, options = {}) => {
    if (!text || text.trim().length === 0) {
      throw new Error('텍스트가 비어있습니다.');
    }

    const cacheKey = generateCacheKey(text, { type: 'questions', ...options });
    const cachedResult = getCachedResult(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisType('questions');
    setError(null);

    try {
      setProgress(30);
      const result = await aiAnalysisService.generateQuestions(text, options);
      setProgress(100);
      
      setCachedResult(cacheKey, result);
      
      return result;
    } catch (err) {
      console.error('❌ AI 분석 에러:', err);
      setError(err);
      throw err;
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setAnalysisType(null);
    }
  }, [generateCacheKey, getCachedResult, setCachedResult]);

  /**
   * 통합 분석 (요약 + 키워드 + 질문)
   * @param {string} text - 분석할 텍스트
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 통합 분석 결과
   */
  const analyzeAll = useCallback(async (text, options = {}) => {
    console.log('🚀 useAIAnalysis - analyzeAll 시작');
    console.log('입력 텍스트 길이:', text?.length || 0);
    console.log('분석 옵션:', options);
    
    if (!text || text.trim().length === 0) {
      console.error('❌ 텍스트가 비어있음');
      throw new Error('텍스트가 비어있습니다.');
    }

    const cacheKey = generateCacheKey(text, { type: 'all', ...options });
    const cachedResult = getCachedResult(cacheKey);

    if (cachedResult) {
      console.log('💾 캐시된 결과 사용');
      setResults(cachedResult);
      return cachedResult;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisType('all');
    setError(null);
    setResults(null);

    try {
      setProgress(10);
      
      // 긴 텍스트의 경우 청크로 분할
      let processText = text;
      if (text.length > 8000) {
        const chunks = aiAnalysisService.splitTextIntoChunks(text, 4000);
        processText = chunks[0]; // 첫 번째 청크만 사용 (데모용)
        console.log(`긴 텍스트 감지: ${chunks.length}개 청크로 분할, 첫 번째 청크 분석`);
      }

      setProgress(30);
      
      console.log('📊 AI 서비스 호출 시작');
      
      const result = await aiAnalysisService.analyzeText(processText, {
        includeSummary: options.includeSummary !== false,
        includeKeywords: options.includeKeywords !== false,
        includeQuestions: options.includeQuestions !== false,
        summary: options.summary || {},
        keywords: options.keywords || {},
        questions: options.questions || {}
      });

      console.log('✅ AI 분석 완료:', result);
      setProgress(100);
      setResults(result);
      
      setCachedResult(cacheKey, result);
      
      return result;
    } catch (err) {
      console.error('❌ AI 분석 에러:', err);
      setError(err);
      throw err;
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setAnalysisType(null);
    }
  }, [generateCacheKey, getCachedResult, setCachedResult]);

  /**
   * 분석 중단
   */
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setProgress(0);
    setAnalysisType(null);
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setProgress(0);
    setResults(null);
    setError(null);
    setAnalysisType(null);
  }, []);

  /**
   * 캐시 초기화
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  /**
   * 재분석 (캐시 무시)
   * @param {string} text - 분석할 텍스트
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 분석 결과
   */
  const reanalyze = useCallback(async (text, options = {}) => {
    // 캐시에서 기존 결과 제거
    const cacheKey = generateCacheKey(text, { type: 'all', ...options });
    cacheRef.current.delete(cacheKey);
    
    return analyzeAll(text, options);
  }, [generateCacheKey, analyzeAll]);

  /**
   * 분석 진행률 계산
   * @returns {Object} 진행률 정보
   */
  const getProgressInfo = useCallback(() => {
    const progressMessages = {
      summary: '텍스트 요약 중...',
      keywords: '키워드 추출 중...',
      questions: '예상 질문 생성 중...',
      all: progress < 30 ? '분석 시작 중...' : 
           progress < 60 ? 'AI 분석 진행 중...' : 
           progress < 90 ? '결과 처리 중...' : '분석 완료 중...'
    };

    return {
      progress,
      message: progressMessages[analysisType] || '분석 중...',
      type: analysisType
    };
  }, [progress, analysisType]);

  return {
    // 상태
    isAnalyzing,
    progress,
    results,
    error,
    analysisType,

    // 분석 함수들
    analyzeSummary,
    analyzeKeywords,
    analyzeQuestions,
    analyzeAll,
    reanalyze,

    // 제어 함수들
    cancelAnalysis,
    reset,
    clearCache,

    // 유틸리티
    getProgressInfo,

    // 캐시 정보
    getCacheSize: () => cacheRef.current.size,
    hasCachedResult: (text, options = {}) => {
      const cacheKey = generateCacheKey(text, options);
      return getCachedResult(cacheKey) !== null;
    }
  };
};

export default useAIAnalysis;