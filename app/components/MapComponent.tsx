"use client";

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// 서울 중심 좌표로 변경
const center = {
  lat: 37.5665,
  lng: 126.9780
};

export interface Place {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  type: string;
  address?: string;
}

interface MapComponentProps {
  places?: Place[];
  onSelectPlace?: (place: Place) => void;
}

const MapComponent = ({ places = [], onSelectPlace }: MapComponentProps) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  
  // places prop이 변경될 때마다 로그 출력
  useEffect(() => {
    console.log('MapComponent - places array:', places);
    console.log('MapComponent - places length:', places.length);
    console.log('MapComponent - first place:', places[0]);
  }, [places]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback(function callback(map: any) {
    console.log('Map loaded');
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    console.log('Map unmounted');
  }, []);

  /**
   * 장소 유형에 따른 마커 아이콘 스타일 설정
   * @param type 장소 유형 (음식점, 관광지, 기타)
   * @returns 마커 아이콘 설정
   */
  const getMarkerIcon = (type: string) => {
    // 음식 관련 장소 (레스토랑, 카페, 바 등)
    if (type.includes('restaurant') || type.includes('cafe') || type.includes('food')) {
      return {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'  // 빨간색
      };
    }
    // 관광지 (명소, 박물관, 공원 등)
    else if (type.includes('tourist') || type.includes('attraction') || type.includes('museum')) {
      return {
        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'  // 초록색
      };
    }
    // 기타 장소
    else {
      return {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'  // 파란색
      };
    }
  };

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    if (onSelectPlace) {
      onSelectPlace(place);
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
      {places.map((place) => (
        <Marker
          key={place.id}
          position={place.position}
          onClick={() => handleMarkerClick(place)}
          options={{
            icon: getMarkerIcon(place.type)
          }}
        />
      ))}

      {selectedPlace && (
        <InfoWindow
          position={selectedPlace.position}
          onCloseClick={() => setSelectedPlace(null)}
        >
          <div className="p-2">
            <h3 className="font-bold">{selectedPlace.name}</h3>
            <p className="text-sm text-gray-600">{selectedPlace.type}</p>
            {selectedPlace.address && (
              <p className="text-sm text-gray-500 mt-1">{selectedPlace.address}</p>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : <div className="w-full h-full flex items-center justify-center bg-gray-100">지도 로딩 중...</div>;
};

export default MapComponent; 