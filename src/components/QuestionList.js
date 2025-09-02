import React, { useState, useMemo } from 'react';

const QuestionList = ({ questionsData, isLoading = false, onRegenerateQuestions = null }) => {
  console.log('❓ QuestionList - 전달받은 questionsData:', questionsData);
  console.log('❓ QuestionList - isLoading:', isLoading);
  
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  const handleCopyQuestion = async (question, index) => {
    try {
      await navigator.clipboard.writeText(question.question);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const handleCopyAllQuestions = async (questions) => {
    try {
      const questionsText = questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
      await navigator.clipboard.writeText(questionsText);
      setCopiedIndex('all');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const toggleFavorite = (index) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(index)) {
      newFavorites.delete(index);
    } else {
      newFavorites.add(index);
    }
    setFavorites(newFavorites);
  };

  const typeLabels = {
    // 기존 유형 (호환성)
    'factual': '📊 사실확인형',
    'analytical': '🔍 분석형',
    'follow-up': '💭 후속형',
    'opinion': '💬 의견형',
    
    // 새로운 유형 (한국어)
    '배경탐구형': '🔍 배경탐구형',
    '실용형': '⚡ 실용형', 
    '확장형': '🌐 확장형',
    '심화형': '🧠 심화형',
    
    // 새로운 유형 (영어)
    'Background': '🔍 배경탐구형',
    'Practical': '⚡ 실용형',
    'Extended': '🌐 확장형', 
    'Deep-dive': '🧠 심화형',
    
    'all': '전체'
  };

  const difficultyLabels = {
    'easy': '😊 쉬움',
    'medium': '🤔 보통',
    'hard': '🧠 어려움',
    'all': '전체'
  };

  const typeColors = {
    // 기존 유형 (호환성)
    'factual': 'bg-blue-50 border-blue-200 text-blue-800',
    'analytical': 'bg-purple-50 border-purple-200 text-purple-800',
    'follow-up': 'bg-green-50 border-green-200 text-green-800',
    'opinion': 'bg-orange-50 border-orange-200 text-orange-800',
    
    // 새로운 유형 (한국어)
    '배경탐구형': 'bg-indigo-50 border-indigo-200 text-indigo-800',
    '실용형': 'bg-emerald-50 border-emerald-200 text-emerald-800',
    '확장형': 'bg-cyan-50 border-cyan-200 text-cyan-800',
    '심화형': 'bg-violet-50 border-violet-200 text-violet-800',
    
    // 새로운 유형 (영어)
    'Background': 'bg-indigo-50 border-indigo-200 text-indigo-800',
    'Practical': 'bg-emerald-50 border-emerald-200 text-emerald-800',
    'Extended': 'bg-cyan-50 border-cyan-200 text-cyan-800',
    'Deep-dive': 'bg-violet-50 border-violet-200 text-violet-800'
  };

  const difficultyColors = {
    'easy': 'text-green-600 bg-green-50',
    'medium': 'text-yellow-600 bg-yellow-50',
    'hard': 'text-red-600 bg-red-50'
  };

  const { filteredQuestions, typeStats, difficultyStats } = useMemo(() => {
    console.log('🔄 QuestionList - useMemo 실행, questionsData:', questionsData);
    
    if (!questionsData || !questionsData.questions) {
      console.log('❌ QuestionList - questionsData 또는 questions가 없음');
      return { filteredQuestions: [], typeStats: {}, difficultyStats: {} };
    }

    let questions = questionsData.questions;
    console.log('📝 QuestionList - questions 배열:', questions);

    // 타입 필터
    if (selectedType !== 'all') {
      questions = questions.filter(q => q.type === selectedType);
    }

    // 난이도 필터
    if (selectedDifficulty !== 'all') {
      questions = questions.filter(q => q.difficulty === selectedDifficulty);
    }

    // 통계 계산
    const typeStats = {};
    const difficultyStats = {};

    questionsData.questions.forEach(q => {
      typeStats[q.type] = (typeStats[q.type] || 0) + 1;
      difficultyStats[q.difficulty] = (difficultyStats[q.difficulty] || 0) + 1;
    });

    console.log('✅ QuestionList - 최종 필터된 질문:', questions);

    return {
      filteredQuestions: questions,
      typeStats,
      difficultyStats
    };
  }, [questionsData, selectedType, selectedDifficulty]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            ❓ 예상 질문
          </h3>
        </div>
        
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!questionsData || !questionsData.questions || questionsData.questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">❓</div>
          <p className="text-gray-500">생성된 예상 질문이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 text-xl">❓</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">예상 질문</h3>
              <p className="text-sm text-gray-600">
                총 {questionsData.totalGenerated}개 질문 • {questionsData.language === 'ko' ? '한국어' : '영어'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopyAllQuestions(filteredQuestions)}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>전체 복사</span>
            </button>
            
            {onRegenerateQuestions && (
              <button
                onClick={onRegenerateQuestions}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>재생성</span>
              </button>
            )}
          </div>
        </div>

        {/* 필터 */}
        <div className="space-y-3">
          {/* 질문 유형 필터 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">질문 유형</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-white text-emerald-600 border border-emerald-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                전체 ({questionsData.totalGenerated})
              </button>
              
              {Object.entries(typeStats).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-white border border-gray-300'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {typeLabels[type] || type} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* 난이도 필터 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">난이도</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDifficulty('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedDifficulty === 'all'
                    ? 'bg-white text-emerald-600 border border-emerald-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                전체
              </button>
              
              {Object.entries(difficultyStats).map(([difficulty, count]) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedDifficulty === difficulty
                      ? 'bg-white border border-gray-300'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {difficultyLabels[difficulty] || difficulty} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 질문 목록 */}
      <div className="p-6">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">선택한 조건에 맞는 질문이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <div
                key={index}
                className={`
                  border rounded-lg p-4 transition-all duration-200
                  ${typeColors[question.type] || 'bg-gray-50 border-gray-200'}
                  hover:shadow-md
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-600">
                      Q{index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[question.difficulty] || 'text-gray-600 bg-gray-50'}`}>
                      {difficultyLabels[question.difficulty] || question.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleFavorite(index)}
                      className={`p-1 rounded transition-colors ${
                        favorites.has(index)
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={favorites.has(index) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      <svg className="w-4 h-4" fill={favorites.has(index) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleCopyQuestion(question, index)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="질문 복사"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-900 font-medium mb-2 leading-relaxed">
                  {question.question}
                </p>
                
                {question.context && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    💡 {question.context}
                  </p>
                )}
                
                {copiedIndex === index && (
                  <div className="text-sm text-green-600 font-medium mt-2 animate-fade-in">
                    질문이 복사되었습니다!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {copiedIndex === 'all' && (
          <div className="text-center mt-4">
            <div className="text-sm text-green-600 font-medium animate-fade-in">
              모든 질문이 복사되었습니다!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionList;