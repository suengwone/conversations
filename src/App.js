import React, { useState } from 'react';
import AudioUploader from './components/AudioUploader';
import TranscriptDisplay from './components/TranscriptDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import EmptyState, { MicrophoneIcon, CloudUploadIcon } from './components/EmptyState';
import SummaryPanel from './components/SummaryPanel';
import KeywordCloud from './components/KeywordCloud';
import QuestionList from './components/QuestionList';
import AnalysisControl from './components/AnalysisControl';
import useTranscription from './hooks/useTranscription';
import useAIAnalysis from './hooks/useAIAnalysis';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copyMessage, setCopyMessage] = useState('');
  const [activeTab, setActiveTab] = useState('transcript'); // transcript, analysis
  
  const {
    isTranscribing,
    progress: transcriptionProgress,
    result,
    error,
    estimatedTime,
    transcribe,
    retry,
    reset
  } = useTranscription();

  const {
    isAnalyzing,
    progress: analysisProgress,
    results: analysisResults,
    error: analysisError,
    analyzeAll,
    reset: resetAnalysis,
    getProgressInfo
  } = useAIAnalysis();

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    reset(); // Reset transcription state when new file is selected
    resetAnalysis(); // Reset AI analysis state when new file is selected
    setActiveTab('transcript'); // Switch back to transcript tab
    console.log('Selected file:', file);
    
    // Simulate upload process for testing (this will be removed when using real API)
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;
    
    try {
      await transcribe(selectedFile, {
        language: 'ko', // Korean
        response_format: 'verbose_json'
      });
    } catch (err) {
      console.error('Transcription failed:', err);
    }
  };

  const handleCopy = (message) => {
    setCopyMessage(message);
    setTimeout(() => setCopyMessage(''), 3000); // Clear message after 3 seconds
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8" role="main">
          <header className="text-center mb-8 sm:mb-12" role="banner">
            <div className="mb-4">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4" aria-hidden="true">
                <MicrophoneIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                🎤 Voice Conversation Analyzer
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                AI 기반 음성 인식과 분석으로 오디오를 텍스트로 변환하고 요약, 키워드, 예상 질문을 생성합니다
              </p>
            </div>
            
            {/* Progress indicators */}
            {(selectedFile || result || analysisResults) && (
              <div className="flex justify-center mb-6" role="progressbar" aria-label="처리 진행 상태">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center ${selectedFile ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedFile ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <span className="ml-2 text-sm font-medium">파일 업로드</span>
                  </div>
                  
                  <div className={`w-8 h-0.5 ${selectedFile ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                  
                  <div className={`flex items-center ${result ? 'text-green-600' : selectedFile ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result ? 'bg-green-100' : selectedFile ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <span className="ml-2 text-sm font-medium">텍스트 변환</span>
                  </div>
                  
                  <div className={`w-8 h-0.5 ${result ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                  
                  <div className={`flex items-center ${analysisResults ? 'text-green-600' : result ? 'text-purple-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${analysisResults ? 'bg-green-100' : result ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      <span className="text-sm font-medium">3</span>
                    </div>
                    <span className="ml-2 text-sm font-medium">AI 분석</span>
                  </div>
                </div>
              </div>
            )}
          </header>

          <main className="space-y-6 sm:space-y-8">
            {/* File Upload Section */}
            <section className="bg-white rounded-xl shadow-lg overflow-hidden" aria-labelledby="upload-heading">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <h2 id="upload-heading" className="text-xl font-semibold text-gray-900 flex items-center">
                  <CloudUploadIcon className="w-5 h-5 mr-2 text-blue-600" aria-hidden="true" />
                  오디오 파일 업로드
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  MP3, WAV, M4A 등 다양한 형식을 지원합니다 (최대 25MB)
                </p>
              </div>
              <div className="p-6">
                <AudioUploader 
                  onFileSelect={handleFileSelect}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />
              </div>
            </section>

            {/* Transcription Section */}
            {selectedFile && !isUploading && (
              <section className="bg-white rounded-xl shadow-lg overflow-hidden" aria-labelledby="transcription-heading">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                  <h2 id="transcription-heading" className="text-xl font-semibold text-gray-900 flex items-center">
                    <MicrophoneIcon className="w-5 h-5 mr-2 text-green-600" aria-hidden="true" />
                    텍스트 변환
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    AI가 오디오를 분석하여 정확한 텍스트로 변환합니다
                  </p>
                </div>
                
                <div className="p-6">
                  {!isTranscribing && !result && !error && (
                    <div className="text-center py-8">
                      <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">변환 준비 완료</h3>
                        <p className="text-gray-600 mb-4">
                          오디오 파일이 업로드되었습니다. 변환을 시작하세요.
                        </p>
                      </div>
                      
                      <button 
                        onClick={handleTranscribe}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                        aria-describedby="transcribe-description"
                      >
                        텍스트 변환 시작
                      </button>
                      <p id="transcribe-description" className="sr-only">
                        업로드된 오디오 파일을 AI를 사용하여 텍스트로 변환합니다
                      </p>
                      <p className="text-sm text-gray-500 mt-3">
                        예상 처리 시간: 약 {Math.ceil(estimatedTime)}초
                      </p>
                    </div>
                  )}

                  {isTranscribing && (
                    <div className="text-center py-8">
                      <LoadingSpinner 
                        size="large" 
                        text="AI가 오디오를 분석하고 있습니다..." 
                        className="mb-6"
                      />
                      
                      <div className="max-w-md mx-auto">
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${transcriptionProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {transcriptionProgress}% 완료
                        </p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-lg font-medium text-red-900 mb-2">변환 실패</h3>
                          <p className="text-red-700 mb-4">{error.message}</p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                              onClick={() => retry(selectedFile)}
                              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              다시 시도
                            </button>
                            <button 
                              onClick={reset}
                              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              처음부터 시작
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Results Section */}
            {result && (
              <div className="space-y-6">
                {/* Results Header with Tabs */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        변환 완료
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        오디오가 성공적으로 텍스트로 변환되었습니다
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        reset();
                        resetAnalysis();
                      }}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      새로 시작
                    </button>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('transcript')}
                      className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'transcript'
                          ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      📝 변환 텍스트
                    </button>
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'analysis'
                          ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🧠 AI 분석
                      {analysisResults && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'transcript' ? (
                  <TranscriptDisplay 
                    transcriptData={result}
                    isLoading={isTranscribing}
                    onCopy={handleCopy}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* AI Analysis Control */}
                    {console.log('📱 App.js - AI 분석 탭 렌더링, result:', result)}
                    <AnalysisControl
                      onStartAnalysis={async (options) => {
                        try {
                          console.log('🎯 분석 시작 - result 객체:', result);
                          console.log('📝 분석할 텍스트:', result?.text || 'text 속성 없음');
                          
                          // text 속성이 없으면 다른 속성들 확인
                          const textToAnalyze = result.text || result.transcript || result.content || '';
                          
                          if (!textToAnalyze) {
                            throw new Error('분석할 텍스트가 없습니다. 먼저 음성을 텍스트로 변환해주세요.');
                          }
                          
                          await analyzeAll(textToAnalyze, options);
                        } catch (err) {
                          console.error('AI 분석 실패:', err);
                        }
                      }}
                      isAnalyzing={isAnalyzing}
                      progress={analysisProgress}
                      progressMessage={getProgressInfo().message}
                      analysisResults={analysisResults}
                    />
                    
                    {/* Analysis Results */}
                    {analysisResults && analysisResults.results && (
                      <div className="grid grid-cols-1 gap-6">
                        {console.log('📊 App.js - analysisResults 전체:', analysisResults)}
                        {console.log('📊 App.js - analysisResults.results:', analysisResults.results)}
                        {console.log('🏷️ App.js - keywords 데이터:', analysisResults.results.keywords)}
                        {console.log('❓ App.js - questions 데이터:', analysisResults.results.questions)}
                        {analysisResults.results.summary && (
                          <SummaryPanel
                            summaryData={analysisResults.results.summary}
                            isLoading={false}
                            onRegenerate={() => {
                              // TODO: Implement summary regeneration
                              console.log('Regenerate summary');
                            }}
                          />
                        )}
                        
                        {analysisResults.results.keywords && (
                          <KeywordCloud
                            keywordsData={analysisResults.results.keywords}
                            isLoading={false}
                            onKeywordClick={(keyword) => {
                              console.log('Clicked keyword:', keyword);
                              // TODO: Implement keyword highlighting in transcript
                            }}
                          />
                        )}
                        
                        {analysisResults.results.questions && (
                          <QuestionList
                            questionsData={analysisResults.results.questions}
                            isLoading={false}
                            onRegenerateQuestions={() => {
                              // TODO: Implement questions regeneration
                              console.log('Regenerate questions');
                            }}
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Analysis Error */}
                    {analysisError && (
                      <div className={`border rounded-lg p-6 ${
                        analysisError.code === 'RATE_LIMIT' 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {analysisError.code === 'RATE_LIMIT' ? (
                              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5C3.312 16.333 4.27 18 5.81 18z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className={`text-lg font-medium mb-2 ${
                              analysisError.code === 'RATE_LIMIT' 
                                ? 'text-yellow-900' 
                                : 'text-red-900'
                            }`}>
                              {analysisError.code === 'RATE_LIMIT' ? 'API 사용량 제한' : 'AI 분석 실패'}
                            </h3>
                            <p className={`mb-4 ${
                              analysisError.code === 'RATE_LIMIT' 
                                ? 'text-yellow-700' 
                                : 'text-red-700'
                            }`}>
                              {analysisError.message}
                            </p>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => analyzeAll(result.text)}
                                className={`font-medium py-2 px-4 rounded-lg transition-colors ${
                                  analysisError.code === 'RATE_LIMIT'
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                              >
                                {analysisError.code === 'RATE_LIMIT' ? '30초 후 다시 시도' : '다시 시도'}
                              </button>
                              {analysisError.code === 'RATE_LIMIT' && (
                                <div className="flex items-center text-sm text-yellow-600">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  잠시만 기다려주세요
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Empty State */}
            {!selectedFile && !result && (
              <EmptyState
                icon={CloudUploadIcon}
                title="오디오 파일을 업로드하세요"
                description="MP3, WAV, M4A 등 다양한 오디오 형식을 지원합니다. 드래그 앤 드롭하거나 클릭하여 파일을 선택하세요."
                className="bg-white rounded-xl shadow-lg py-16"
              />
            )}
          </main>
          
          {/* Footer */}
          <footer className="text-center py-6 text-gray-500 text-sm border-t border-gray-200 mt-12" role="contentinfo">
            <p>
              Powered by Groq Whisper API & LLaMA 3.1 | 
              <button type="button" className="text-blue-600 hover:text-blue-800 ml-1 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded bg-transparent border-none cursor-pointer">개인정보처리방침</button> | 
              <button type="button" className="text-blue-600 hover:text-blue-800 ml-1 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded bg-transparent border-none cursor-pointer">이용약관</button>
            </p>
          </footer>
          
          {/* Copy notification toast */}
          {copyMessage && (
            <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform animate-pulse">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {copyMessage}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
