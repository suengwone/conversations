import React, { useState } from 'react';

const SummaryPanel = ({ summaryData, isLoading = false, onRegenerate = null }) => {
  console.log('📝 SummaryPanel - 전달받은 summaryData:', summaryData);
  console.log('📝 SummaryPanel - isLoading:', isLoading);
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [copyMessage, setCopyMessage] = useState('');

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('복사됨!');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (err) {
      setCopyMessage('복사 실패');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const formatCompressionRatio = (ratio) => {
    if (ratio > 90) return { text: `${ratio}%`, color: 'text-green-600', label: '고압축' };
    if (ratio > 70) return { text: `${ratio}%`, color: 'text-blue-600', label: '적절' };
    if (ratio > 50) return { text: `${ratio}%`, color: 'text-yellow-600', label: '보통' };
    return { text: `${ratio}%`, color: 'text-gray-600', label: '저압축' };
  };

  const getSummaryTypeLabel = (type) => {
    const types = {
      brief: '간략',
      comprehensive: '상세',
      bullet: '요점정리'
    };
    return types[type] || '일반';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            📝 요약 결과
          </h3>
        </div>
        
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <p className="text-gray-500">요약 결과가 없습니다.</p>
        </div>
      </div>
    );
  }

  const compressionInfo = formatCompressionRatio(summaryData.compressionRatio || 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xl">📝</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">요약 결과</h3>
              <p className="text-sm text-gray-600">
                {getSummaryTypeLabel(summaryData.type)} • {summaryData.language === 'ko' ? '한국어' : '영어'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      {isExpanded && (
        <div className="p-6">
          {/* 통계 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(summaryData.originalLength / 1000 * 10) / 10}k
              </div>
              <div className="text-xs text-gray-600">원본 글자수</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {summaryData.summaryLength}
              </div>
              <div className="text-xs text-gray-600">요약 글자수</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${compressionInfo.color}`}>
                {compressionInfo.text}
              </div>
              <div className="text-xs text-gray-600">압축률 ({compressionInfo.label})</div>
            </div>
          </div>

          {/* 요약 텍스트 */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 mb-4">
            <div className="prose prose-sm max-w-none">
              {summaryData.type === 'bullet' ? (
                <div className="space-y-2">
                  {console.log('📝 SummaryPanel - 불릿 포인트 처리, 원본:', summaryData.summary)}
                  {summaryData.summary.split('\n').filter(line => line.trim()).map((line, index) => {
                    const cleanedLine = line.replace(/^[•\-\*]\s*/, '').trim();
                    console.log(`📝 SummaryPanel - 라인 ${index}:`, line, '->', cleanedLine);
                    return cleanedLine ? (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-purple-500 font-bold mt-1">•</span>
                        <span className="text-gray-700 leading-relaxed flex-1">{cleanedLine}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {summaryData.summary}
                </p>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(summaryData.summary)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>복사</span>
              </button>
              
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>재생성</span>
                </button>
              )}
            </div>
            
            {copyMessage && (
              <div className="text-sm text-green-600 font-medium animate-fade-in">
                {copyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPanel;