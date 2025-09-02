import React, { useState, useRef, useEffect, useMemo } from 'react';

const TranscriptDisplay = ({ 
  transcriptData, 
  isLoading = false, 
  onCopy,
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const textContainerRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto scroll to bottom when new content is added
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptData, autoScroll]);

  // Handle manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!textContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = textContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
    setAutoScroll(isAtBottom);
  };

  // Format timestamp for display
  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Highlight search terms in text
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Process transcript data
  const processedTranscript = useMemo(() => {
    if (!transcriptData) return null;

    // Handle different transcript formats
    if (transcriptData.segments && Array.isArray(transcriptData.segments)) {
      // Verbose JSON format with segments
      return {
        text: transcriptData.text || '',
        segments: transcriptData.segments.map((segment, index) => ({
          id: index,
          start: segment.start || 0,
          end: segment.end || 0,
          text: segment.text || '',
          confidence: segment.avg_logprob || 0 // Whisper confidence score
        }))
      };
    } else if (typeof transcriptData === 'string') {
      // Plain text format
      return {
        text: transcriptData,
        segments: []
      };
    } else if (transcriptData.text) {
      // JSON format without segments
      return {
        text: transcriptData.text,
        segments: []
      };
    }

    return null;
  }, [transcriptData]);

  // Copy functionality
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      if (onCopy) onCopy('텍스트가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('Copy failed:', error);
      if (onCopy) onCopy('복사에 실패했습니다.');
    }
  };

  // Copy selected text
  const handleCopySelected = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
      handleCopy(selectedText);
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    // Whisper confidence is negative log probability, lower is better
    if (confidence > -0.5) return 'text-green-800';
    if (confidence > -1.0) return 'text-blue-800';
    if (confidence > -2.0) return 'text-yellow-800';
    return 'text-red-800';
  };

  if (!processedTranscript) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          변환된 텍스트가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header with controls */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">변환 결과</h3>
          
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="텍스트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Font size control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">A</span>
              <input
                type="range"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-16"
              />
              <span className="text-lg text-gray-600">A</span>
            </div>

            {/* Copy button */}
            <button
              onClick={() => handleCopy(processedTranscript.text)}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              전체 복사
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
            <span className="text-gray-600">텍스트를 처리하고 있습니다...</span>
          </div>
        ) : (
          <>
            {/* Full text display */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
                전체 텍스트
                <button
                  onClick={handleCopySelected}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  선택 복사
                </button>
              </h4>
              <div
                ref={textContainerRef}
                onScroll={handleScroll}
                className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto"
                style={{ fontSize: `${fontSize}px` }}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-gray-800 select-text">
                  {highlightSearchTerm(processedTranscript.text, searchTerm)}
                </div>
                <div ref={bottomRef} />
              </div>
              
              {/* Auto-scroll toggle */}
              {!autoScroll && (
                <button
                  onClick={() => setAutoScroll(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  자동 스크롤 활성화
                </button>
              )}
            </div>

            {/* Segments display */}
            {processedTranscript.segments && processedTranscript.segments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  세그먼트별 보기
                  <span className="ml-2 text-sm text-gray-500">
                    ({processedTranscript.segments.length}개 구간)
                  </span>
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {processedTranscript.segments
                    .filter(segment => 
                      !searchTerm || 
                      segment.text.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((segment) => (
                      <div
                        key={segment.id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedSegment === segment.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSegment(
                          selectedSegment === segment.id ? null : segment.id
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                          </span>
                          <div className="flex items-center gap-2">
                            {segment.confidence && (
                              <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getConfidenceColor(segment.confidence)}`}>
                                신뢰도
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(segment.text);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div 
                          className="text-gray-800 select-text"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {highlightSearchTerm(segment.text, searchTerm)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">총 단어 수:</span>
                  <span className="ml-1">{processedTranscript.text.split(/\s+/).length}</span>
                </div>
                <div>
                  <span className="font-medium">총 문자 수:</span>
                  <span className="ml-1">{processedTranscript.text.length}</span>
                </div>
                {processedTranscript.segments.length > 0 && (
                  <>
                    <div>
                      <span className="font-medium">구간 수:</span>
                      <span className="ml-1">{processedTranscript.segments.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">총 길이:</span>
                      <span className="ml-1">
                        {processedTranscript.segments.length > 0 
                          ? formatTimestamp(processedTranscript.segments[processedTranscript.segments.length - 1].end)
                          : '0:00'
                        }
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TranscriptDisplay;