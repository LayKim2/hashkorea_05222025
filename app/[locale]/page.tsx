'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/common/Header';
import MapComponent, { Place } from '../components/map/MapComponent';
import InfoPanel from '../components/map/InfoPanel';
import ChatbotButton from '../components/chat/ChatbotButton';
import WelcomePopup from '../components/chat/WelcomePopup';

export default function LocalePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const { t } = useTranslation('common');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  const handlePlaceSelect = (place: Place) => {
    console.log('Page - handlePlaceSelect called with:', place);
    setSelectedPlace(place);
    setShowInfoPanel(true);
  };

  const handleCloseInfoPanel = () => {
    console.log('Page - handleCloseInfoPanel called');
    setShowInfoPanel(false);
    setSelectedPlace(null);
  };

  const handlePlacesFound = (newPlaces: Place[]) => {
    console.log('Home - Received places:', newPlaces);
    setPlaces(newPlaces);
  };

  // 상태 변경 디버깅
  useEffect(() => {
    console.log('Page - State updated:', {
      selectedPlace,
      showInfoPanel,
      placesCount: places.length
    });
  }, [selectedPlace, showInfoPanel, places]);

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