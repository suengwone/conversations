import React, { useState, useMemo } from 'react';

const KeywordCloud = ({ keywordsData, isLoading = false, onKeywordClick = null }) => {
  console.log('🏷️ KeywordCloud - 전달받은 keywordsData:', keywordsData);
  console.log('🏷️ KeywordCloud - isLoading:', isLoading);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copyMessage, setCopyMessage] = useState('');

  const handleCopy = async (keywords) => {
    try {
      const keywordText = keywords.map(k => k.word).join(', ');
      await navigator.clipboard.writeText(keywordText);
      setCopyMessage('키워드 복사됨!');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (err) {
      setCopyMessage('복사 실패');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const categoryColors = {
    '인물': 'bg-blue-100 text-blue-800 border-blue-200',
    '장소': 'bg-green-100 text-green-800 border-green-200',
    '주제': 'bg-purple-100 text-purple-800 border-purple-200',
    '행동': 'bg-orange-100 text-orange-800 border-orange-200',
    '기타': 'bg-gray-100 text-gray-800 border-gray-200',
    'person': 'bg-blue-100 text-blue-800 border-blue-200',
    'place': 'bg-green-100 text-green-800 border-green-200',
    'topic': 'bg-purple-100 text-purple-800 border-purple-200',
    'action': 'bg-orange-100 text-orange-800 border-orange-200',
    'other': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const categoryLabels = {
    '인물': '👤 인물',
    '장소': '📍 장소',
    '주제': '💭 주제',
    '행동': '⚡ 행동',
    '기타': '🔗 기타',
    'person': '👤 인물',
    'place': '📍 장소',
    'topic': '💭 주제',
    'action': '⚡ 행동',
    'other': '🔗 기타'
  };

  const { filteredKeywords, categories, categoryStats } = useMemo(() => {
    console.log('🔄 KeywordCloud - useMemo 실행, keywordsData:', keywordsData);
    
    if (!keywordsData || !keywordsData.keywords) {
      console.log('❌ KeywordCloud - keywordsData 또는 keywords가 없음');
      return { filteredKeywords: [], categories: [], categoryStats: {} };
    }

    const keywords = keywordsData.keywords;
    console.log('📝 KeywordCloud - keywords 배열:', keywords);
    
    const uniqueCategories = [...new Set(keywords.map(k => k.category))];
    console.log('📂 KeywordCloud - 고유 카테고리:', uniqueCategories);
    
    const stats = uniqueCategories.reduce((acc, category) => {
      acc[category] = keywords.filter(k => k.category === category).length;
      return acc;
    }, {});

    const filtered = selectedCategory === 'all' 
      ? keywords 
      : keywords.filter(k => k.category === selectedCategory);

    console.log('✅ KeywordCloud - 최종 필터된 키워드:', filtered);

    return {
      filteredKeywords: filtered,
      categories: uniqueCategories,
      categoryStats: stats
    };
  }, [keywordsData, selectedCategory]);

  const getKeywordSize = (importance) => {
    if (importance >= 9) return 'text-2xl px-4 py-3';
    if (importance >= 7) return 'text-xl px-3 py-2';
    if (importance >= 5) return 'text-lg px-3 py-2';
    return 'text-base px-2 py-1';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            🏷️ 키워드 분석
          </h3>
        </div>
        
        <div className="animate-pulse">
          <div className="flex flex-wrap gap-2 mb-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-full" style={{ width: `${60 + i * 20}px` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!keywordsData || !keywordsData.keywords || keywordsData.keywords.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🏷️</div>
          <p className="text-gray-500">추출된 키워드가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">🏷️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">키워드 분석</h3>
              <p className="text-sm text-gray-600">
                총 {keywordsData.totalFound}개 키워드 • {keywordsData.language === 'ko' ? '한국어' : '영어'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopy(filteredKeywords)}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>복사</span>
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-white text-blue-600 border border-blue-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            전체 ({keywordsData.totalFound})
          </button>
          
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-white border border-gray-300'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {categoryLabels[category] || category} ({categoryStats[category]})
            </button>
          ))}
        </div>
      </div>

      {/* 키워드 클라우드 */}
      <div className="p-6">
        <div className="flex flex-wrap gap-3 min-h-[200px] justify-center items-center">
          {filteredKeywords.map((keyword, index) => (
            <button
              key={index}
              onClick={() => onKeywordClick && onKeywordClick(keyword)}
              className={`
                ${getKeywordSize(keyword.importance)}
                ${categoryColors[keyword.category] || categoryColors['other']}
                rounded-full border-2 font-medium transition-all duration-200
                hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${onKeywordClick ? 'cursor-pointer' : 'cursor-default'}
              `}
              style={{
                opacity: Math.max(0.6, keyword.importance / 10),
                fontWeight: Math.min(900, 400 + keyword.importance * 50)
              }}
              title={`${keyword.context || keyword.word} (중요도: ${keyword.importance}/10)`}
            >
              <span>{keyword.word}</span>
              <span className="ml-1 text-xs opacity-75">
                {keyword.importance}
              </span>
            </button>
          ))}
        </div>

        {filteredKeywords.length === 0 && selectedCategory !== 'all' && (
          <div className="text-center py-12">
            <p className="text-gray-500">선택한 카테고리에 키워드가 없습니다.</p>
          </div>
        )}

        {/* 범례 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>중요도가 높을수록 크고 진하게 표시됩니다</span>
            {copyMessage && (
              <span className="text-green-600 font-medium">
                {copyMessage}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {Object.entries(categoryLabels).map(([key, label]) => (
              categories.includes(key) && (
                <div key={key} className="flex items-center space-x-1">
                  <div className={`w-3 h-3 rounded border ${categoryColors[key] || categoryColors['other']}`}></div>
                  <span className="text-gray-600">{label}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordCloud;