"use client";

import { useState } from 'react';
import ChatInterface from './ChatInterface';
import { Place } from './MapComponent';

interface ChatbotButtonProps {
  onPlacesFound: (places: Place[]) => void;
}

const ChatbotButton = ({ onPlacesFound }: ChatbotButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-orange-400 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-105 group"
        aria-label="AI 장소 추천"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        
        {/* Tooltip */}
        <span className="absolute right-16 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Travel Spot Assistant
        </span>
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <ChatInterface 
          onClose={() => setIsOpen(false)} 
          onPlacesFound={onPlacesFound}
        />
      )}
    </>
  );
};

export default ChatbotButton; 