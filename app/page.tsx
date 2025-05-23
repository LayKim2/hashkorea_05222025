"use client";

import { useState } from 'react';
import Header from './components/Header';
import MapComponent, { Place } from './components/MapComponent';
import InfoPanel from './components/InfoPanel';
import ChatbotButton from './components/ChatbotButton';
import WelcomePopup from './components/WelcomePopup';

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    setShowInfoPanel(true);
  };

  const handleCloseInfoPanel = () => {
    setShowInfoPanel(false);
  };

  const handlePlacesFound = (newPlaces: Place[]) => {
    console.log('Home - Received places:', newPlaces);
    setPlaces(newPlaces);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-full h-full">
          <MapComponent 
            places={places}
            onSelectPlace={handlePlaceSelect} 
          />
        </div>
        {showInfoPanel && selectedPlace && (
          <div className="absolute top-0 right-0 h-full w-80 max-w-xs z-10">
            <InfoPanel 
              restaurant={selectedPlace} 
              onClose={handleCloseInfoPanel} 
            />
          </div>
        )}
        <ChatbotButton onPlacesFound={handlePlacesFound} />
        {showWelcomePopup && (
          <WelcomePopup 
            onClose={() => setShowWelcomePopup(false)}
            onPlacesFound={handlePlacesFound}
          />
        )}
      </div>
    </div>
  );
}
