"use client";

import { useState, useRef, useEffect } from 'react';
import { Place } from '../map/MapComponent';
import { useChatStore } from '../../store/chatStore';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PlaceType, mapPlaceType } from '../../utils/placeTypes';

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

interface ChatInterfaceProps {
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

const ChatInterface = ({ onClose, onPlacesFound }: ChatInterfaceProps) => {
  const { t } = useTranslation('common');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTextRef = useRef(''); // 누적된 텍스트를 저장할 ref
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const { messages, addMessage, initializeStore, collectedInfo, updateCollectedInfo } = useChatStore();

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

  // 컴포넌트 마운트 시 음성인식 초기화
  useEffect(() => {
    initializeSpeechRecognition();
  }, []);

  // 컴포넌트 언마운트 시 음성인식 정리
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
    initializeStore();
  }, [initializeStore]);

  useEffect(() => {
    // Places 서비스와 Geocoder 초기화
    const mapDiv = document.createElement('div');
    const map = new google.maps.Map(mapDiv, {
      center: { lat: 37.5665, lng: 126.9780 },
      zoom: 15
    });
    placesServiceRef.current = new google.maps.places.PlacesService(map);
    geocoderRef.current = new google.maps.Geocoder();  // Geocoder 초기화
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 주소를 좌표(latitude, longitude)로 변환하는 함수
   * @param address 변환할 주소
   * @returns 좌표 정보 (위도, 경도) 또는 null
   */
  const geocodeAddress = async (address: string): Promise<google.maps.LatLngLiteral | null> => {
    return new Promise((resolve, reject) => {
      if (!geocoderRef.current) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      geocoderRef.current.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  };

  /**
   * Google Places API를 사용하여 장소 검색
   * @param query 검색어, 위치, 요구사항을 포함한 검색 조건
   * @returns 검색된 장소 목록
   */
  const searchGooglePlaces = async (query: {
    searchTerms: string[];
    location: string;
    requirements: string[];
  }): Promise<google.maps.places.PlaceResult[]> => {
    return new Promise((resolve, reject) => {
      if (!placesServiceRef.current) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const searchString = `${query.searchTerms.join(' ')} ${query.location}`;
      
      const request = {
        query: searchString,
        fields: ['name', 'geometry', 'rating', 'formatted_address', 'photos', 'place_id'],
      };

      placesServiceRef.current.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results.slice(0, 5)); // 최대 5개 결과
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  };

  /**
   * 사용자 메시지 제출 처리 및 AI 응답 생성
   * @param e 폼 제출 이벤트
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      text: input,
    };
    addMessage(userMessage);
    setInput('');

    try {
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: input
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

        // 먼저 AI의 응답 메시지 표시
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai' as const,
          text: response.message,
        };
        addMessage(aiMessage);

        // Google Places 검색
        const places = await searchGooglePlaces({
          searchTerms: response.searchTerms,
          location: response.location,
          requirements: response.requirements || []
        });

        // 주소가 있는 경우 좌표로 변환
        if (response.address) {
          try {
            const coordinates = await geocodeAddress(response.address);
            if (coordinates) {
              // 좌표 정보를 places 배열의 첫 번째 항목에 추가
              if (places.length > 0) {
                places[0].geometry = {
                  location: new google.maps.LatLng(coordinates.lat, coordinates.lng)
                };
              }
            }
          } catch (error) {
            console.error('Geocoding error:', error);
          }
        }
        
        // Google Places 검색 결과를 MapComponent 형식으로 변환
        const convertedPlaces = places.map((place, index) => {
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          console.log(`Place ${index} coordinates:`, { lat, lng }); // 좌표 확인용 로그
          console.log(`Place ${index} types:`, place.types); // 타입 확인용 로그

          const mappedType = mapPlaceType(place.types?.[0] || 'unknown');
          console.log(`Place ${index} mapped type:`, mappedType); // 매핑된 타입 확인용 로그

          return {
            id: place.place_id || `place-${index}`,
            name: place.name || '',
            position: {
              lat: lat || 0,
              lng: lng || 0
            },
            type: mappedType,
            address: place.vicinity
          };
        });

        console.log('Converted places:', convertedPlaces);
        onPlacesFound(convertedPlaces);

        // 검색 결과 메시지 추가
        const placesDescription = places.map((place, index) => 
          `${index + 1}. ${place.name} (${place.formatted_address || place.vicinity || response.address || '주소 없음'})`
        ).join('\n');

        const resultMessage = {
          id: (Date.now() + 2).toString(),
          type: 'ai' as const,
          text: `검색 결과입니다:\n\n${placesDescription}\n\n더 자세한 정보가 필요하신가요?`,
        };
        addMessage(resultMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        text: `죄송합니다. 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500 to-orange-400 text-white">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-medium">{t('chat.title')}</h3>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.type === 'user' ? 'flex justify-end' : 'flex justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.text}</p>
              {isClient && (
                <span className="text-xs opacity-70 block mt-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm rounded-tl-none">
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
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-3 shadow-2xl w-full max-w-[240px]"
          >
            <div className="text-center">
              <div className="inline-block p-1.5 bg-gradient-to-r from-red-500 to-orange-400 rounded-full mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">{t('chat.voiceRecognition')}</h3>
              <p className="text-xs text-gray-600 mb-3">{t('chat.speakMessage')}</p>
              <div className="flex justify-center gap-1.5">
                <button 
                  onClick={toggleListening}
                  className="px-2.5 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg text-xs hover:from-gray-200 hover:to-gray-300 font-medium border border-gray-200 transition-all"
                >
                  {t('chat.cancel')}
                </button>
                <button 
                  onClick={() => {
                    if (accumulatedTextRef.current.trim()) {
                      const newInput = input ? `${input} ${accumulatedTextRef.current}` : accumulatedTextRef.current;
                      toggleListening();
                      setInput(newInput);
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isFinal 
                      ? 'bg-gradient-to-r from-red-500 to-orange-400 text-white hover:from-red-600 hover:to-orange-500' 
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {t('chat.done')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-2 bg-white border-t border-gray-200 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.inputPlaceholder')}
          className="flex-1 py-2 px-3 rounded-full bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
          ref={inputRef}
        />
        <button
          type="button"
          onClick={toggleListening}
          className={`ml-2 p-2 rounded-full ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button
          type="submit"
          className="ml-2 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;