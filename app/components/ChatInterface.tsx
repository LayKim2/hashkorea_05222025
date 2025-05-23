"use client";

import { useState, useRef, useEffect } from 'react';
import { Place } from './MapComponent';
import { useChatStore, Message } from '../store/chatStore';

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
  collectedInfo?: any;
}

const ChatInterface = ({ onClose, onPlacesFound }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const { messages, addMessage, initializeStore, collectedInfo, updateCollectedInfo } = useChatStore();

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

          return {
            id: place.place_id || `place-${index}`,
            name: place.name || '',
            position: {
              lat: lat || 0,
              lng: lng || 0
            },
            type: place.types?.[0] || 'unknown',
            address: place.formatted_address
          };
        });

        console.log('Converted places:', convertedPlaces);
        onPlacesFound(convertedPlaces);

        // 검색 결과 메시지 추가
        const placesDescription = places.map((place, index) => 
          `${index + 1}. ${place.name} (${place.formatted_address || response.address || '주소 없음'})`
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

  const toggleListening = () => {
    // 임시로 기능 비활성화
    alert('Voice recognition feature is currently in preparation.');
    return;
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
          <h3 className="font-medium">Travel Spot Assistant</h3>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center relative">
              <div className="absolute w-full h-full rounded-full bg-red-400 animate-ping opacity-75"></div>
              <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-800 font-medium">Searching...</p>
          </div>
        </div>
      )}

      {/* Speech Recognition Indicator */}
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center relative">
              <div className="absolute w-full h-full rounded-full bg-red-400 animate-ping opacity-75"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-gray-800 font-medium">Listening...</p>
            <button 
              onClick={() => setIsListening(false)}
              className="mt-3 px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-2 bg-white border-t border-gray-200 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your message..."
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