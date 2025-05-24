'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '../map/MapComponent';
import { useChatStore } from '../../store/chatStore';
import { useTranslation } from 'react-i18next';

// Window 객체에 SpeechRecognition 타입 추가
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Web Speech API 타입 정의
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface WelcomePopupProps {
  onClose: () => void;
  onPlacesFound: (places: Place[]) => void;
}

interface ProcessedQuery {
  type: 'chat' | 'recommendation';
  message: string;
  searchTerms?: string[];
  location?: string;
  requirements?: string[];
  address?: string;
  collectedInfo?: {
    location: string | null;
    purpose: string | null;
    preferences: string[] | null;
  };
}

const WelcomePopup = ({ onClose, onPlacesFound }: WelcomePopupProps) => {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const { messages, addMessage, initializeStore, collectedInfo, updateCollectedInfo } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTextRef = useRef('');

  // 음성인식 초기화 함수
  const initializeSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser.');
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
        setTranscript('');
        setIsFinal(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript;
        
        setTranscript(transcriptText);
        setIsFinal(result.isFinal);
        
        if (transcriptText.trim() && result.isFinal) {
          accumulatedTextRef.current = accumulatedTextRef.current 
            ? `${accumulatedTextRef.current} ${transcriptText}`
            : transcriptText;
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setRecognitionError(event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (error) {
      setRecognitionError(error instanceof Error ? error.message : 'Failed to initialize speech recognition');
    }
  };

  // 음성인식 시작/중지 토글 함수
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError('Speech recognition is not initialized');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        accumulatedTextRef.current = '';
        recognitionRef.current.start();
      } catch (error) {
        setRecognitionError('Failed to start speech recognition');
      }
    }
  };

  useEffect(() => {
    setIsClient(true);
    initializeStore();
    initializeSpeechRecognition();
  }, [initializeStore]);

  // 컴포넌트 언마운트 시 음성인식 정리
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 새 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      text: inputText,
    };
    addMessage(userMessage);
    setInputText('');

    try {
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: inputText
          }],
          collectedInfo // 현재까지 수집된 정보 전송
        })
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to get response from chat API');
      }

      const response: ProcessedQuery = await chatResponse.json();
      console.log('API response:', response);

      // 응답에서 받은 collectedInfo 업데이트
      if (response.collectedInfo) {
        updateCollectedInfo(response.collectedInfo);
      }

      // 응답 타입에 따른 처리
      if (response.type === 'chat') {
        // 일반 대화 응답
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai' as const,
          text: response.message,
        };
        addMessage(aiMessage);
      } else if (response.type === 'recommendation') {
        // 장소 검색 응답
        if (!response.searchTerms || !response.location) {
          throw new Error('Invalid response format: missing required fields');
        }

        // AI의 응답 메시지 표시
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai' as const,
          text: response.message,
        };
        addMessage(aiMessage);

        // Google Places 검색
        const placesService = new google.maps.places.PlacesService(
          document.createElement('div')
        );

        const searchString = `${response.searchTerms.join(' ')} ${response.location}`;
        const request = {
          query: searchString,
          fields: ['name', 'geometry', 'rating', 'formatted_address', 'photos', 'place_id'],
        };

        placesService.textSearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Google Places 검색 결과를 MapComponent 형식으로 변환
            const convertedPlaces = results.slice(0, 5).map((place, index) => ({
              id: place.place_id || `place-${index}`,
              name: place.name || '',
              position: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              },
              type: place.types?.[0] || 'unknown',
              address: place.formatted_address
            }));

            console.log('Converted places:', convertedPlaces);
            onPlacesFound(convertedPlaces);

            // 검색 결과 메시지 추가
            const placesDescription = results
              .slice(0, 5)
              .map((place, index) => 
                `${index + 1}. ${place.name} (${place.formatted_address || response.address || 'No address available'})`
              )
              .join('\n');

            const resultMessage = {
              id: (Date.now() + 2).toString(),
              type: 'ai' as const,
              text: `Here are the search results:\n\n${placesDescription}\n\nWould you like more information?`,
            };
            addMessage(resultMessage);

            // 장소 추천이 있을 때 팝업 닫기
            handleClose();
          } else {
            throw new Error(`Places search failed: ${status}`);
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black"
            onClick={handleClose}
          />
          
          {/* 팝업 컨텐츠 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* 헤더 섹션 */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-block p-2 bg-gradient-to-r from-red-500 to-orange-400 rounded-full mb-3 sm:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent mb-2 sm:mb-3">
                {t('welcome.title')}
              </h2>
            </div>

            {/* 간단한 정보 섹션 */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm text-gray-700">{t('welcome.discover')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs sm:text-sm text-gray-700">{t('welcome.foodGuide')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm text-gray-700">{t('welcome.travelTips')}</span>
              </div>
            </div>

            {/* 채팅 인터페이스 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex-1 min-h-0 flex flex-col">
              {/* 메시지 목록 */}
              <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white ${isListening ? 'pointer-events-none opacity-50' : ''}`}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 sm:p-4 ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-white text-gray-800 shadow-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line break-words">{message.text}</p>
                      {isClient && (
                        <span className={`text-xs block mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-2xl p-3 sm:p-4 shadow-md">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Speech Recognition Popup */}
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-2xl w-full max-w-md"
                  >
                    <div className="text-center">
                      <div className="inline-block p-3 bg-gradient-to-r from-red-500 to-orange-400 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{t('welcome.voiceRecognition')}</h3>
                      <p className="text-gray-600 mb-6">{t('welcome.speakMessage')}</p>
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={toggleListening}
                          className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl text-sm hover:from-gray-200 hover:to-gray-300 font-medium border border-gray-200 transition-all"
                        >
                          {t('welcome.cancel')}
                        </button>
                        <button 
                          onClick={() => {
                            if (accumulatedTextRef.current.trim()) {
                              const newInput = inputText ? `${inputText} ${accumulatedTextRef.current}` : accumulatedTextRef.current;
                              toggleListening();
                              setInputText(newInput);
                              setTimeout(() => {
                                const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                                if (submitButton && !submitButton.disabled) {
                                  submitButton.click();
                                }
                              }, 0);
                            } else {
                              toggleListening();
                            }
                          }}
                          disabled={!isFinal}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            isFinal 
                              ? 'bg-gradient-to-r from-red-500 to-orange-400 text-white hover:from-red-600 hover:to-orange-500' 
                              : 'bg-gradient-to-r from-gray-300 to-gray-400 text-white cursor-not-allowed'
                          }`}
                        >
                          {t('welcome.done')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* 메시지 입력 폼 - 항상 하단에 고정 */}
              <div className={`sticky bottom-0 bg-white border-t border-gray-100 ${isListening ? 'pointer-events-none opacity-50' : ''}`}>
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={t('welcome.inputPlaceholder')}
                      className="flex-1 border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-900"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-2 sm:p-3 rounded-xl ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-colors`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
                      disabled={isLoading}
                    >
                      <span className="hidden sm:inline">{t('welcome.send')}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup; 