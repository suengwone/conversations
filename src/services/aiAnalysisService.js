// Vercel API 엔드포인트 사용
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api'
  : '/api';

class AnalysisError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'AnalysisError';
    this.status = status;
    this.code = code;
  }
}

export const aiAnalysisService = {
  /**
   * AI 분석을 위한 기본 API 호출
   * @param {string} prompt - AI에게 전달할 프롬프트
   * @param {Object} options - 분석 옵션
   * @returns {Promise<string>} AI 응답 텍스트
   */
  async callAI(prompt, options = {}) {
    console.log('🤖 AI Analysis Service - callAI 시작');
    console.log('API_BASE_URL:', API_BASE_URL);

    const requestBody = {
      prompt,
      options: {
        model: options.model || 'llama-3.1-8b-instant',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 4000,
        top_p: options.top_p || 0.9
      }
    };

    console.log('📤 API 요청 데이터:', {
      url: `${API_BASE_URL}/analyze`,
      model: requestBody.options.model,
      promptLength: prompt.length,
      temperature: requestBody.options.temperature
    });

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API 오류 응답:', errorData);
        
        // Rate limit 에러 특별 처리
        if (response.status === 429 || errorData.error?.message?.includes('Rate limit')) {
          throw new AnalysisError(
            '잠시만 기다려주세요. API 사용량 제한에 도달했습니다. 약 30초 후에 다시 시도해주세요.',
            429,
            'RATE_LIMIT'
          );
        }
        
        throw new AnalysisError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.error?.code || 'HTTP_ERROR'
        );
      }

      const data = await response.json();
      console.log('✅ API 성공 응답:', {
        hasResponse: !!data.response,
        usage: data.usage,
        model: data.model
      });
      
      if (!data.response) {
        throw new AnalysisError(
          'Invalid response format from AI API',
          500,
          'INVALID_RESPONSE'
        );
      }

      return data.response.trim();
      
    } catch (error) {
      if (error instanceof AnalysisError) {
        throw error;
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new AnalysisError(
          'Network error occurred during AI analysis',
          0,
          'NETWORK_ERROR'
        );
      }
      
      throw new AnalysisError(
        `Unexpected error: ${error.message}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  },

  /**
   * 텍스트 요약 생성
   * @param {string} text - 요약할 텍스트
   * @param {Object} options - 요약 옵션
   * @returns {Promise<Object>} 요약 결과
   */
  async summarizeText(text, options = {}) {
    console.log('📝 요약 생성 - 시작, 옵션:', options);
    console.log('📝 요약 생성 - 요약 타입:', options.type);
    
    if (!text || text.trim().length === 0) {
      throw new AnalysisError('No text provided for summarization', 400, 'EMPTY_TEXT');
    }

    const summaryType = options.type || 'comprehensive'; // comprehensive, brief, bullet
    const language = options.language || 'ko'; // ko, en
    
    console.log('📝 요약 생성 - 최종 설정:', { summaryType, language });
    
    let promptTemplate = '';
    
    if (language === 'ko') {
      switch (summaryType) {
        case 'brief':
          promptTemplate = `다음 텍스트를 2-3문장으로 간략하게 요약해주세요:

${text}

요약:`;
          break;
        case 'bullet':
          promptTemplate = `다음 텍스트를 주요 포인트별로 불릿 포인트 형태로 요약해주세요. 각 포인트는 • 기호로 시작해주세요:

${text}

주요 내용:
• `;
          break;
        default: // comprehensive
          promptTemplate = `다음 텍스트를 상세하게 요약해주세요. 주요 내용, 핵심 포인트, 중요한 세부사항을 포함하여 체계적으로 정리해주세요:

${text}

상세 요약:`;
      }
    } else {
      switch (summaryType) {
        case 'brief':
          promptTemplate = `Please provide a brief summary of the following text in 2-3 sentences:

${text}

Summary:`;
          break;
        case 'bullet':
          promptTemplate = `Please summarize the following text in bullet point format:

${text}

Key Points:
•`;
          break;
        default: // comprehensive
          promptTemplate = `Please provide a comprehensive summary of the following text, including main topics, key points, and important details:

${text}

Detailed Summary:`;
      }
    }

    console.log('📝 요약 생성 - 프롬프트 길이:', promptTemplate.length);
    
    try {
      // 토큰 사용량 최적화
      const maxTokens = summaryType === 'brief' ? 200 : 
                       summaryType === 'bullet' ? 300 : 800;
      
      console.log('📝 요약 생성 - 최대 토큰:', maxTokens);
      
      const summary = await this.callAI(promptTemplate, {
        temperature: 0.3, // 낮은 온도로 일관성 있는 요약
        max_tokens: maxTokens
      });

      console.log('📝 요약 생성 - AI 응답:', summary);
      console.log('📝 요약 생성 - 응답 길이:', summary.length);

      const result = {
        type: summaryType,
        language: language,
        summary: summary,
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: Math.round((1 - summary.length / text.length) * 100)
      };

      console.log('✅ 요약 생성 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ 요약 생성 실패:', error);
      throw new AnalysisError(
        `Summary generation failed: ${error.message}`,
        error.status || 500,
        error.code || 'SUMMARY_ERROR'
      );
    }
  },

  /**
   * 키워드 추출
   * @param {string} text - 키워드를 추출할 텍스트
   * @param {Object} options - 추출 옵션
   * @returns {Promise<Object>} 키워드 결과
   */
  async extractKeywords(text, options = {}) {
    if (!text || text.trim().length === 0) {
      throw new AnalysisError('No text provided for keyword extraction', 400, 'EMPTY_TEXT');
    }

    const maxKeywords = options.maxKeywords || 10;
    const language = options.language || 'ko';
    const includeCategories = options.includeCategories || true;

    let promptTemplate = '';
    
    if (language === 'ko') {
      promptTemplate = `다음 텍스트에서 가장 중요한 키워드 ${maxKeywords}개를 추출해주세요. ${includeCategories ? '각 키워드를 카테고리(인물, 장소, 주제, 행동, 기타)로 분류하고, ' : ''}중요도 점수(1-10)를 함께 제공해주세요.

텍스트:
${text}

반드시 아래 JSON 형식으로만 응답해주세요. 다른 설명이나 텍스트는 포함하지 마세요:

{
  "keywords": [
    {
      "word": "키워드",
      "importance": 8,
      ${includeCategories ? '"category": "주제",' : ''}
      "context": "간단한 설명"
    }
  ]
}`;
    } else {
      promptTemplate = `Extract the top ${maxKeywords} most important keywords from the following text. ${includeCategories ? 'Categorize each keyword (person, place, topic, action, other) and ' : ''}Provide importance scores (1-10) for each.

Text:
${text}

Please respond ONLY in the following JSON format. Do not include any other explanation or text:

{
  "keywords": [
    {
      "word": "keyword",
      "importance": 8,
      ${includeCategories ? '"category": "topic",' : ''}
      "context": "brief explanation"
    }
  ]
}`;
    }

    try {
      const response = await this.callAI(promptTemplate, {
        temperature: 0.2, // 낮은 온도로 일관성 있는 추출
        max_tokens: 800 // 토큰 사용량 최적화
      });

      console.log('🔍 키워드 추출 - AI 원본 응답:', response);

      // JSON 파싱 시도
      let keywordsData;
      try {
        // JSON 응답에서 코드 블록 제거
        const cleanedResponse = response.replace(/```json\n?|```\n?/g, '').trim();
        console.log('🧹 키워드 추출 - 정리된 응답:', cleanedResponse);
        
        keywordsData = JSON.parse(cleanedResponse);
        console.log('✅ 키워드 추출 - JSON 파싱 성공:', keywordsData);
      } catch (parseError) {
        console.warn('⚠️ 키워드 추출 - JSON 파싱 실패:', parseError.message);
        console.log('📝 키워드 추출 - 텍스트 파싱 대체 로직 실행');
        
        // JSON 파싱 실패 시 텍스트에서 키워드 추출 시도
        const keywordMatches = response.match(/[\w가-힣]+/g);
        if (keywordMatches) {
          keywordsData = {
            keywords: keywordMatches.slice(0, maxKeywords).map((word, index) => ({
              word: word,
              importance: Math.max(1, 10 - index),
              category: 'other',
              context: 'Extracted from text response'
            }))
          };
          console.log('🔄 키워드 추출 - 대체 파싱 결과:', keywordsData);
        } else {
          console.error('❌ 키워드 추출 - 대체 파싱도 실패');
          throw new AnalysisError('Failed to parse keywords from AI response', 500, 'PARSE_ERROR');
        }
      }

      return {
        keywords: keywordsData.keywords || [],
        totalFound: keywordsData.keywords?.length || 0,
        language: language,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new AnalysisError(
        `Keyword extraction failed: ${error.message}`,
        error.status || 500,
        error.code || 'KEYWORD_ERROR'
      );
    }
  },

  /**
   * 예상 질문 생성
   * @param {string} text - 질문을 생성할 텍스트
   * @param {Object} options - 생성 옵션
   * @returns {Promise<Object>} 질문 결과
   */
  async generateQuestions(text, options = {}) {
    if (!text || text.trim().length === 0) {
      throw new AnalysisError('No text provided for question generation', 400, 'EMPTY_TEXT');
    }

    const maxQuestions = options.maxQuestions || 8;
    const language = options.language || 'ko';
    const questionTypes = options.types || ['factual', 'analytical', 'follow-up', 'opinion'];

    let promptTemplate = '';
    
    if (language === 'ko') {
      promptTemplate = `다음 텍스트를 분석하여 ${maxQuestions}개의 예상 질문을 생성해주세요. 

**중요: 텍스트에서 직접 언급된 내용에 대한 질문이 아닌, 다음과 같은 관점에서 질문을 만들어주세요:**

1. **누락된 정보**: 텍스트에서 다루지 않았지만 궁금할 만한 배경이나 세부사항
2. **후속 의문점**: 언급된 내용으로 인해 자연스럽게 생겨나는 추가 궁금증
3. **실용적 질문**: 실제 적용이나 활용 방법에 대한 질문
4. **확장 질문**: 관련된 다른 영역이나 상황에 대한 질문

질문 유형:
- 배경탐구형: 언급되지 않은 배경이나 맥락에 대한 질문
- 실용형: 실제 적용이나 활용에 대한 질문
- 확장형: 관련된 다른 분야나 상황에 대한 질문
- 심화형: 더 깊이 있는 이해를 위한 질문

텍스트:
${text}

반드시 아래 JSON 형식으로만 응답해주세요. 다른 설명이나 텍스트는 포함하지 마세요:

{
  "questions": [
    {
      "question": "이런 상황에서 고려해야 할 다른 요소들은 무엇이 있을까요?",
      "type": "확장형",
      "difficulty": "보통",
      "context": "텍스트에서 언급되지 않은 관련 요소들에 대한 궁금증"
    }
  ]
}`;
    } else {
      promptTemplate = `Analyze the following text and generate ${maxQuestions} anticipated questions.

**Important: Do NOT create questions about information directly mentioned in the text. Instead, focus on:**

1. **Missing Information**: Background or details not covered but would be interesting to know
2. **Natural Follow-ups**: Additional curiosities that naturally arise from the mentioned content
3. **Practical Applications**: Questions about real-world implementation or usage
4. **Extended Scenarios**: Questions about related areas or different situations

Question Types:
- Background: Questions about unmentioned context or background
- Practical: Questions about real-world application or usage
- Extended: Questions about related fields or situations  
- Deep-dive: Questions for deeper understanding

Text:
${text}

Please respond ONLY in the following JSON format. Do not include any other explanation or text:

{
  "questions": [
    {
      "question": "What other factors should be considered in this type of situation?",
      "type": "Extended",
      "difficulty": "medium",
      "context": "Curiosity about related elements not mentioned in the text"
    }
  ]
}`;
    }

    try {
      const response = await this.callAI(promptTemplate, {
        temperature: 0.8, // 높은 온도로 다양성 있는 질문
        max_tokens: 1000 // 토큰 사용량 최적화
      });

      console.log('❓ 질문 생성 - AI 원본 응답:', response);

      // JSON 파싱 시도
      let questionsData;
      try {
        // JSON 응답에서 코드 블록 제거
        const cleanedResponse = response.replace(/```json\n?|```\n?/g, '').trim();
        console.log('🧹 질문 생성 - 정리된 응답:', cleanedResponse);
        
        questionsData = JSON.parse(cleanedResponse);
        console.log('✅ 질문 생성 - JSON 파싱 성공:', questionsData);
      } catch (parseError) {
        console.warn('⚠️ 질문 생성 - JSON 파싱 실패:', parseError.message);
        console.log('📝 질문 생성 - 텍스트 파싱 대체 로직 실행');
        
        // JSON 파싱 실패 시 텍스트에서 질문 추출 시도
        const questionMatches = response.match(/[?？].*/g);
        if (questionMatches) {
          questionsData = {
            questions: questionMatches.slice(0, maxQuestions).map((question, index) => ({
              question: question.trim(),
              type: questionTypes[index % questionTypes.length],
              difficulty: ['easy', 'medium', 'hard'][index % 3],
              context: 'Generated from text response'
            }))
          };
          console.log('🔄 질문 생성 - 대체 파싱 결과:', questionsData);
        } else {
          console.error('❌ 질문 생성 - 대체 파싱도 실패');
          throw new AnalysisError('Failed to parse questions from AI response', 500, 'PARSE_ERROR');
        }
      }

      return {
        questions: questionsData.questions || [],
        totalGenerated: questionsData.questions?.length || 0,
        language: language,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new AnalysisError(
        `Question generation failed: ${error.message}`,
        error.status || 500,
        error.code || 'QUESTION_ERROR'
      );
    }
  },

  /**
   * 통합 분석 (요약 + 키워드 + 질문)
   * @param {string} text - 분석할 텍스트
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 통합 분석 결과
   */
  async analyzeText(text, options = {}) {
    if (!text || text.trim().length === 0) {
      throw new AnalysisError('No text provided for analysis', 400, 'EMPTY_TEXT');
    }

    const results = {};
    const errors = {};

    // 병렬 처리로 모든 분석 동시 실행
    const analysisPromises = [];

    if (options.includeSummary !== false) {
      analysisPromises.push(
        this.summarizeText(text, options.summary || {})
          .then(result => { results.summary = result; })
          .catch(error => { errors.summary = error.message; })
      );
    }

    if (options.includeKeywords !== false) {
      analysisPromises.push(
        this.extractKeywords(text, options.keywords || {})
          .then(result => { results.keywords = result; })
          .catch(error => { errors.keywords = error.message; })
      );
    }

    if (options.includeQuestions !== false) {
      analysisPromises.push(
        this.generateQuestions(text, options.questions || {})
          .then(result => { results.questions = result; })
          .catch(error => { errors.questions = error.message; })
      );
    }

    // 모든 분석 완료 대기
    await Promise.allSettled(analysisPromises);

    return {
      success: Object.keys(results).length > 0,
      results: results,
      errors: Object.keys(errors).length > 0 ? errors : null,
      analyzedAt: new Date().toISOString(),
      originalText: {
        length: text.length,
        wordCount: text.split(/\s+/).length,
        preview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      }
    };
  },

  /**
   * 텍스트를 청크로 분할 (긴 텍스트 처리용)
   * @param {string} text - 분할할 텍스트
   * @param {number} maxChunkSize - 최대 청크 크기
   * @returns {Array<string>} 분할된 텍스트 청크
   */
  splitTextIntoChunks(text, maxChunkSize = 4000) {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks = [];
    const sentences = text.split(/[.!?。！？]\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += sentence + '. ';
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
};

export { AnalysisError };
export default aiAnalysisService;