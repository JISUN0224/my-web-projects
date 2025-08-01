import React, { useState, useEffect, useRef } from 'react';
import './FirstStep.css';

interface ExerciseContent {
  script: string;
  duration: number;
  type: string;
  difficulty: string;
}

const FirstStep: React.FC = () => {
  const [selectedType, setSelectedType] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exerciseContent, setExerciseContent] = useState<ExerciseContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 타이머 상태
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  
  // refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // 문제 생성 함수
  const generateExercise = async () => {
    if (!selectedType) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // API 키 설정
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      }

             const prompt = `${selectedType} 유형의 통역사 메모리 훈련용 텍스트를 생성해주세요. ${customPrompt ? `추가 요청: ${customPrompt}` : ''} 한글 기준으로 120~150글자 정도의 한국어 텍스트로 작성해주세요. 제목이나 부가 설명 없이 본문만 출력하세요.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
                     generationConfig: {
             temperature: 0.7,
             topK: 40,
             topP: 0.95,
             maxOutputTokens: 2048,
           }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 호출 실패: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('API 응답:', data); // 디버깅용
      console.log('candidates[0]:', data.candidates?.[0]); // 더 자세한 디버깅

      // 응답 구조 확인
      if (!data.candidates || !data.candidates[0]) {
        throw new Error('API 응답에 candidates가 없습니다.');
      }

             const candidate = data.candidates[0];
       console.log('candidate.content:', candidate.content); // content 구조 확인
       
       // finishReason 확인
       if (candidate.finishReason === 'MAX_TOKENS') {
         console.log('MAX_TOKENS로 인해 응답이 중단되었습니다.');
       }
       
       if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
         console.log('candidate.content.parts:', candidate.content?.parts); // parts 구조 확인
         throw new Error('API 응답 구조가 올바르지 않습니다. finishReason: ' + candidate.finishReason);
       }

       const generatedText = candidate.content.parts[0].text;
       console.log('generatedText:', generatedText); // 텍스트 확인
       
       if (!generatedText) {
         throw new Error('API 응답에서 텍스트를 찾을 수 없습니다.');
       }

      const cleanText = generatedText.trim();

      setExerciseContent({
        script: cleanText,
        duration: 60,
        type: selectedType,
        difficulty: 'medium'
      });
      setTimeRemaining(60);
    } catch (error) {
      console.error('생성 실패:', error);
      setError(error instanceof Error ? error.message : '문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 타이머 시작
  const startTimer = () => {
    if (!exerciseContent || isTimerRunning) return;
    
    setIsTimerRunning(true);
    setIsTimerPaused(false);
    setTimerCompleted(false);
    
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setIsTimerRunning(false);
          setTimerCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 타이머 일시정지
  const pauseTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsTimerRunning(false);
    setIsTimerPaused(true);
  };

  // 타이머 재시작
  const resumeTimer = () => {
    if (isTimerPaused && timeRemaining > 0) {
      startTimer();
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 계산
  const getProgress = () => {
    if (!exerciseContent) return 0;
    return ((exerciseContent.duration - timeRemaining) / exerciseContent.duration) * 100;
  };

  return (
    <div className="container">
      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {/* 홈으로 버튼 */}
        <a href="#" className="home-btn">
          <span>🏠</span>
          <span>홈으로</span>
        </a>
        
        {/* 헤더 */}
        <div className="header">
          <h1>🧠 통역 메모리 훈련</h1>
          <p>1단계: 타이머 학습</p>
        </div>
        
        {/* 단계 표시기 */}
        <div className="step-indicator">
          <div className="step active">1</div>
          <div className="step inactive">2</div>
          <div className="step inactive">3</div>
          <div className="step inactive">4</div>
        </div>
        
        {/* 유형 선택 */}
        <div className="type-selector">
          <div className="selector-box">
            <label>🎯 유형 선택</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">선택하세요</option>
              <option value="숫자 중심">숫자 중심</option>
              <option value="인명/지명">인명/지명</option>
              <option value="목록/순서">목록/순서</option>
              <option value="과정/절차">과정/절차</option>
            </select>
          </div>
        </div>
        
        {/* 추가 요청사항 입력 */}
        <div className="prompt-input-container">
          <div className="prompt-input-box">
            <label>📝 추가 요청사항</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="해당 유형에 대한 추가 요청 사항을 입력해주세요. 예:난이도, 주제 등"
              className="prompt-textarea"
            />
          </div>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            <div className="error-content">
              <p className="error-text">⚠️ {error}</p>
              <button 
                onClick={() => setError(null)} 
                className="error-retry-btn"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 스크립트 영역 */}
        <div className="script-area">
          {isGenerating ? (
            <div className="script-placeholder">
              <div className="loading-spinner"></div>
              <p>연습문제를 생성하는 중...</p>
            </div>
          ) : exerciseContent ? (
            <div className="script-content">
              {timerCompleted ? (
                <div className="completion-message">
                  ✅ 학습 시간이 완료되었습니다!<br />
                  이제 2단계에서 기억한 내용을 테스트해보세요.
                </div>
              ) : (
                exerciseContent.script
              )}
            </div>
          ) : (
            <div className="script-placeholder">
              필터를 모두 선택하면 연습문제가 표시됩니다
            </div>
          )}
        </div>

        {/* 문제 생성 버튼 */}
        {!exerciseContent && (
          <div className="button-container">
            <button
              onClick={generateExercise}
              disabled={!selectedType || isGenerating}
              className={`generate-btn ${!selectedType || isGenerating ? 'disabled' : ''}`}
            >
              {isGenerating ? '생성 중...' : '문제 생성'}
            </button>
          </div>
        )}

        {/* 타이머 섹션 */}
        {exerciseContent && (
          <div className="timer-section">
            <div className="timer-display">
              <div className="timer-text">{formatTime(timeRemaining)}</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
            </div>

            <div className="timer-controls">
              {!timerCompleted ? (
                <>
                  {!isTimerRunning && !isTimerPaused ? (
                    <button onClick={startTimer} className="timer-btn start">
                      🚀 학습 시작
                    </button>
                  ) : isTimerPaused ? (
                    <button onClick={resumeTimer} className="timer-btn resume">
                      ▶️ 재시작
                    </button>
                  ) : (
                    <>
                      <button onClick={pauseTimer} className="timer-btn pause">
                        ⏸️ 일시정지
                      </button>
                      <button className="timer-btn next">
                        ➡️ 다음 단계
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button className="timer-btn complete">
                  ➡️ 2단계로 이동
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 사이드바 */}
      <div className="sidebar">
        <div className="guide-panel">
          {/* 헤더 */}
          <div className="guide-header">
            <span style={{fontSize: '1.5rem'}}>🧠</span>
            <h3>메모리 훈련 가이드</h3>
          </div>
          
          {/* 훈련 목적 */}
          <div className="purpose-section">
            <div className="section-title">훈련 목적</div>
            <div className="purpose-box">
              <p>통역사에게 필수적인 <strong>순간 기억력</strong>과 <strong>정보 재구성 능력</strong>을 체계적으로 향상시킵니다.</p>
            </div>
          </div>
          
          {/* 학습 단계 */}
          <div className="steps-section">
            <div className="section-title">학습 단계</div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number blue">1</span>
                <span className="step-name">타이머학습</span>
              </div>
              <div className="step-desc">집중해서 내용 기억</div>
            </div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number orange">2</span>
                <span className="step-name">빈칸채우기</span>
              </div>
              <div className="step-desc">핵심 단어 기억 테스트</div>
            </div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number green">3</span>
                <span className="step-name">문장재배열</span>
              </div>
              <div className="step-desc">논리적 순서 재구성</div>
            </div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number purple">4</span>
                <span className="step-name">스토리재생산</span>
              </div>
              <div className="step-desc">완전한 내용 복원</div>
            </div>
          </div>
          
          {/* 훈련 방법론 */}
          <div className="methodology-section">
            <div className="methodology-header">
              <span style={{fontSize: '1.1rem'}}>📚</span>
              <span className="methodology-title">훈련 방법론</span>
              <span style={{fontSize: '1.1rem'}}>▼</span>
            </div>
            <div className="methodology-content">
              <div className="methodology-item"><strong>청킹(Chunking):</strong> 정보를 의미 단위로 기억</div>
              <div className="methodology-item"><strong>시각화:</strong> 내용을 이미지로 변환하여 저장</div>
              <div className="methodology-item"><strong>연상 기법:</strong> 기존 지식과 연결하여 기억 강화</div>
            </div>
          </div>
          
          {/* 학습 효과 */}
          <div className="effects-section">
            <div className="effects-header">
              <span style={{fontSize: '1.1rem'}}>🎯</span>
              <span className="effects-title">학습 효과</span>
            </div>
            <ul className="effects-list">
              <li>단기 기억력 향상</li>
              <li>정보 처리 속도 증가</li>
              <li>집중력 강화</li>
              <li>논리적 사고력 발달</li>
              <li>실전 통역 능력 향상</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstStep; 