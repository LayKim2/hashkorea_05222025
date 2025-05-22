"use client";

import { useState } from 'react';
import Header from './components/Header';
import MapComponent, { Restaurant } from './components/MapComponent';
import InfoPanel from './components/InfoPanel';
import ChatbotButton from './components/ChatbotButton';

export default function Home() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowInfoPanel(true);
  };

  const handleCloseInfoPanel = () => {
    setShowInfoPanel(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-full h-full">
          <MapComponent onSelectRestaurant={handleRestaurantSelect} />
        </div>
        {showInfoPanel && selectedRestaurant && (
          <div className="absolute top-0 right-0 h-full w-80 max-w-xs z-10">
            <InfoPanel 
              restaurant={selectedRestaurant} 
              onClose={handleCloseInfoPanel} 
            />
          </div>
        )}
        <ChatbotButton />
      </div>
    </div>
  );
}
