import React, { useState, useEffect } from 'react';

const AnalysisControl = ({ 
  onStartAnalysis, 
  isAnalyzing = false, 
  progress = 0, 
  progressMessage = '', 
  onCancelAnalysis = null,
  analysisResults = null
}) => {
  console.log('🎛️ AnalysisControl 렌더링 - props:', {
    hasOnStartAnalysis: typeof onStartAnalysis === 'function',
    isAnalyzing,
    progress,
    progressMessage,
    hasAnalysisResults: !!analysisResults
  });
  const [analysisOptions, setAnalysisOptions] = useState({
    includeSummary: true,
    includeKeywords: true,
    includeQuestions: true,
    summaryType: 'comprehensive',
    maxKeywords: 10,
    maxQuestions: 8,
    language: 'ko'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // 분석이 시작되면 패널을 펼침
  useEffect(() => {
    if (isAnalyzing) {
      setIsExpanded(true);
    }
  }, [isAnalyzing]);

  const handleOptionChange = (key, value) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStartAnalysis = () => {
    console.log('🔘 AnalysisControl - 분석 시작 버튼 클릭됨');
    console.log('📋 분석 옵션:', analysisOptions);
    console.log('📝 요약 설정:', analysisOptions.summary);
    console.log('📝 요약 타입:', analysisOptions.summary?.type);
    console.log('🔗 onStartAnalysis 함수 존재:', typeof onStartAnalysis === 'function');
    
    if (onStartAnalysis) {
      console.log('🚀 onStartAnalysis 함수 호출 시작');
      onStartAnalysis(analysisOptions);
    } else {
      console.error('❌ onStartAnalysis 함수가 전달되지 않음');
    }
  };

  const getAnalysisTypesEnabled = () => {
    const types = [];
    if (analysisOptions.includeSummary) types.push('요약');
    if (analysisOptions.includeKeywords) types.push('키워드');
    if (analysisOptions.includeQuestions) types.push('질문생성');
    return types.join(' + ');
  };

  const getEstimatedTime = () => {
    let time = 0;
    if (analysisOptions.includeSummary) time += 15;
    if (analysisOptions.includeKeywords) time += 10;
    if (analysisOptions.includeQuestions) time += 20;
    return time;
  };

  const hasEnabledAnalysis = analysisOptions.includeSummary || 
                           analysisOptions.includeKeywords || 
                           analysisOptions.includeQuestions;
  
  console.log('✅ hasEnabledAnalysis:', hasEnabledAnalysis, {
    includeSummary: analysisOptions.includeSummary,
    includeKeywords: analysisOptions.includeKeywords,
    includeQuestions: analysisOptions.includeQuestions
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 text-xl">🧠</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI 분석</h3>
              <p className="text-sm text-gray-600">
                {isAnalyzing ? progressMessage || '분석 진행 중...' : '분석 옵션을 설정하고 시작하세요'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isAnalyzing && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/50 transition-colors"
                aria-label={isExpanded ? '접기' : '펼치기'}
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 진행률 표시 */}
        {isAnalyzing && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-700">
                {progressMessage || '분석 중...'}
              </span>
              <span className="text-sm text-indigo-600">{progress}%</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 설정 패널 */}
      {(isExpanded || isAnalyzing) && (
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 분석 유형 선택 */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">분석 유형</h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeSummary}
                    onChange={(e) => handleOptionChange('includeSummary', e.target.checked)}
                    disabled={isAnalyzing}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">📝 텍스트 요약</span>
                    <span className="text-xs text-gray-500">(~15초)</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeKeywords}
                    onChange={(e) => handleOptionChange('includeKeywords', e.target.checked)}
                    disabled={isAnalyzing}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">🏷️ 키워드 추출</span>
                    <span className="text-xs text-gray-500">(~10초)</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeQuestions}
                    onChange={(e) => handleOptionChange('includeQuestions', e.target.checked)}
                    disabled={isAnalyzing}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">❓ 예상 질문 생성</span>
                    <span className="text-xs text-gray-500">(~20초)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 세부 옵션 */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">세부 설정</h4>
              
              <div className="space-y-4">
                {/* 요약 유형 */}
                {analysisOptions.includeSummary && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      요약 스타일
                    </label>
                    <select
                      value={analysisOptions.summaryType}
                      onChange={(e) => handleOptionChange('summaryType', e.target.value)}
                      disabled={isAnalyzing}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                      <option value="brief">간략 요약 (2-3문장)</option>
                      <option value="comprehensive">상세 요약 (전체 내용)</option>
                      <option value="bullet">불릿 포인트 (요점정리)</option>
                    </select>
                  </div>
                )}

                {/* 키워드 개수 */}
                {analysisOptions.includeKeywords && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      키워드 개수: {analysisOptions.maxKeywords}개
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={analysisOptions.maxKeywords}
                      onChange={(e) => handleOptionChange('maxKeywords', parseInt(e.target.value))}
                      disabled={isAnalyzing}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5개</span>
                      <span>20개</span>
                    </div>
                  </div>
                )}

                {/* 질문 개수 */}
                {analysisOptions.includeQuestions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      질문 개수: {analysisOptions.maxQuestions}개
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="15"
                      value={analysisOptions.maxQuestions}
                      onChange={(e) => handleOptionChange('maxQuestions', parseInt(e.target.value))}
                      disabled={isAnalyzing}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>3개</span>
                      <span>15개</span>
                    </div>
                  </div>
                )}

                {/* 언어 설정 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    분석 언어
                  </label>
                  <select
                    value={analysisOptions.language}
                    onChange={(e) => handleOptionChange('language', e.target.value)}
                    disabled={isAnalyzing}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 분석 정보 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-indigo-600 text-xl">ℹ️</div>
                <div className="flex-1">
                  <h5 className="font-medium text-indigo-900 mb-2">분석 정보</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-indigo-700 font-medium">분석 유형:</span>
                      <br />
                      <span className="text-indigo-600">
                        {hasEnabledAnalysis ? getAnalysisTypesEnabled() : '선택된 항목 없음'}
                      </span>
                    </div>
                    <div>
                      <span className="text-indigo-700 font-medium">예상 소요시간:</span>
                      <br />
                      <span className="text-indigo-600">약 {getEstimatedTime()}초</span>
                    </div>
                    <div>
                      <span className="text-indigo-700 font-medium">AI 모델:</span>
                      <br />
                      <span className="text-indigo-600">Groq LLaMA 3.1 (8B)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!isAnalyzing ? (
                <button
                  onClick={handleStartAnalysis}
                  disabled={!hasEnabledAnalysis}
                  className={`
                    inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
                    ${hasEnabledAnalysis
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>AI 분석 시작</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">분석 중...</span>
                  </div>
                  
                  {onCancelAnalysis && (
                    <button
                      onClick={onCancelAnalysis}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>중단</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {analysisResults && (
              <div className="text-sm text-gray-500">
                마지막 분석: {new Date(analysisResults.analyzedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 축소된 상태에서의 빠른 시작 버튼 */}
      {!isExpanded && !isAnalyzing && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleStartAnalysis}
            disabled={!hasEnabledAnalysis}
            className={`
              w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${hasEnabledAnalysis
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>빠른 분석 시작 ({getAnalysisTypesEnabled()})</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisControl;