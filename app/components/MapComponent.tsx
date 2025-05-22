"use client";

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 59.4371, 
  lng: 24.7453  // 에스토니아 탈린의 대략적인 좌표
};

export interface Restaurant {
  id: number;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  type: string;
  color: string;
}

const restaurants: Restaurant[] = [
  { id: 1, name: 'Liveliku', position: { lat: 59.436, lng: 24.728 }, type: 'restaurant', color: 'green' },
  { id: 2, name: 'Valhalla', position: { lat: 59.437, lng: 24.743 }, type: 'cafe', color: 'orange' },
  { id: 3, name: 'Nomad', position: { lat: 59.438, lng: 24.750 }, type: 'restaurant', color: 'red' },
  { id: 4, name: 'Kästik', position: { lat: 59.442, lng: 24.762 }, type: 'bistro', color: 'green' },
  { id: 5, name: 'Oriental', position: { lat: 59.429, lng: 24.735 }, type: 'restaurant', color: 'red' }
];

interface MapComponentProps {
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

const MapComponent = ({ onSelectRestaurant }: MapComponentProps) => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback(function callback(map: any) {
    // 필요한 경우 map 인스턴스를 저장할 수 있습니다
    console.log('Map loaded');
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    // 필요한 경우 map 인스턴스를 해제할 수 있습니다
    console.log('Map unmounted');
  }, []);

  const customMarkerIcon = (color: string) => {
    return {
      path: 'M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z',
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: '#ffffff',
      scale: 1.5,
      anchor: { x: 12, y: 22 },
    };
  };

  const handleMarkerClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    
    // InfoPanel 표시를 위해 상위 컴포넌트에 선택된 레스토랑 정보 전달
    if (onSelectRestaurant) {
      onSelectRestaurant(restaurant);
    }
  };

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }],
          },
        ],
        disableDefaultUI: false,
        zoomControl: true,
      }}
    >
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          position={restaurant.position}
          onClick={() => handleMarkerClick(restaurant)}
          options={{
            icon: {
              url: `http://maps.google.com/mapfiles/ms/icons/${restaurant.color}-dot.png`,
            }
          }}
        />
      ))}

      {selectedRestaurant && (
        <InfoWindow
          position={selectedRestaurant.position}
          onCloseClick={() => setSelectedRestaurant(null)}
        >
          <div className="p-2">
            <h3 className="font-bold">{selectedRestaurant.name}</h3>
            <p className="text-sm text-gray-600">{selectedRestaurant.type}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : <div className="w-full h-full flex items-center justify-center bg-gray-100">지도 로딩 중...</div>;
};

export default MapComponent; 