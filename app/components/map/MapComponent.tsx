"use client";

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView } from '@react-google-maps/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons';
import Lottie from 'lottie-react';
import cafeAnimation from '../../../public/icons/cafe.json';
import foodAnimation from '../../../public/icons/food.json';
import landmarkAnimation from '../../../public/icons/landmark.json';
import drinkAnimation from '../../../public/icons/drink.json';
import clubAnimation from '../../../public/icons/club.json';
import othersAnimation from '../../../public/icons/others.json';
import { PlaceType, mapPlaceType } from '../../utils/placeTypes';

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
  type: PlaceType;
  address?: string;
}

interface MapComponentProps {
  places?: Place[];
  onSelectPlace?: (place: Place) => void;
}

const MapComponent = ({ places = [], onSelectPlace }: MapComponentProps) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  
  // places prop이 변경될 때마다 로그 출력
  useEffect(() => {
    console.log('MapComponent - places array:', places);
    console.log('MapComponent - places length:', places.length);
    console.log('MapComponent - first place:', places[0]);
  }, [places]);

  // places가 바뀔 때마다 지도 중심 이동
  useEffect(() => {
    if (map && places.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      places.forEach((place) => {
        bounds.extend(place.position);
      });
      map.fitBounds(bounds);
      // 장소가 1개면 적당히 확대
      if (places.length === 1) {
        map.setCenter(places[0].position);
        map.setZoom(15);
      }
    }
  }, [map, places]);

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(() => {
    if (isRequestingLocation) return; // Prevent duplicate requests
    
    setIsRequestingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          setLocationError(null);
          console.log("Current location updated:", newLocation);
          setIsRequestingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Failed to get location information.");
          setUserLocation(center);
          setIsRequestingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError("This browser does not support location services.");
      setUserLocation(center);
      setIsRequestingLocation(false);
    }
  }, []);

  // 컴포넌트 마운트 시 한 번만 위치 정보 가져오기
  useEffect(() => {
    if (!userLocation) {
      getCurrentLocation();
    }
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
    console.log('Map loaded');
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
    console.log('Map unmounted');
  }, []);

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    if (onSelectPlace) {
      onSelectPlace(place);
    }
  };

  // 내 위치로 이동하는 함수
  const moveToUserLocation = () => {
    if (map && userLocation) {
      map.setCenter(userLocation);
      map.setZoom(15);
    } else {
      // 위치 정보가 없으면 다시 가져오기 시도
      getCurrentLocation();
      if (locationError) {
        alert(locationError);
      }
    }
  };

  // 위치 권한 상태 확인
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") {
          setLocationError("Location access is denied. Please enable location services in your browser settings.");
        }
      });
    }
  }, []);

  return isLoaded ? (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 내 위치로 이동 버튼 */}
      <button
        onClick={moveToUserLocation}
        style={{
          position: 'absolute',
          top: 11,
          right: 62,
          zIndex: 5,
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#f8f8f8';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <FontAwesomeIcon 
          icon={faLocationCrosshairs} 
          style={{ 
            color: '#4285F4',
            fontSize: '18px'
          }} 
        />
      </button>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT
          },
          streetViewControl: true,
          scaleControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "on" }]
            }
          ]
        }}
      >
        {/* 현재 위치 마커 */}
        {userLocation && (
          <>
            <OverlayView
              position={userLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="relative">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </OverlayView>
          </>
        )}

        {places && places.length > 0 && places.map((place) => {
          const isSelected = !!(selectedPlace && place.id === selectedPlace.id);
          return (
            <OverlayView
              key={place.id}
              position={place.position}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div onClick={() => handleMarkerClick(place)} style={{ 
                cursor: 'pointer', 
                zIndex: isSelected ? 1000 : 1, 
                position: 'relative',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s ease-in-out'
              }}>
                {/* 장소 이름 레이블 */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap" style={{ zIndex: 1001 }}>
                  <div className="bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100 text-xs font-medium text-gray-700 text-center">
                    {place.name.replace(/\s/g, '').length > 8 
                      ? `${place.name.substring(0, place.name.indexOf(' ', 8) > -1 ? place.name.indexOf(' ', 8) : 8)}...` 
                      : place.name}
                  </div>
                  {/* 작은 삼각형 화살표 */}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-x-[4px] w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45"></div>
                </div>
                {place.type === 'cafe' ? (
                  <div style={{ 
                    width: 48, 
                    height: 48,
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' : 'none',
                    animation: isSelected ? 'sparkle 1.5s ease-in-out infinite' : 'none'
                  }}>
                    <Lottie 
                      animationData={cafeAnimation}
                      loop={true}
                      autoplay={true}
                    />
                  </div>
                ) : place.type === 'food' ? (
                  <div style={{ 
                    width: 48, 
                    height: 48,
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' : 'none',
                    animation: isSelected ? 'sparkle 1.5s ease-in-out infinite' : 'none'
                  }}>
                    <Lottie 
                      animationData={foodAnimation}
                      loop={true}
                      autoplay={true}
                    />
                  </div>
                ) : place.type === 'landmark' ? (
                  <div style={{ 
                    width: 48, 
                    height: 48,
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' : 'none',
                    animation: isSelected ? 'sparkle 1.5s ease-in-out infinite' : 'none'
                  }}>
                    <Lottie 
                      animationData={landmarkAnimation}
                      loop={true}
                      autoplay={true}
                    />
                  </div>
                ) : place.type === 'drink' ? (
                  <div style={{ 
                    width: 48, 
                    height: 48,
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' : 'none',
                    animation: isSelected ? 'sparkle 1.5s ease-in-out infinite' : 'none'
                  }}>
                    <Lottie 
                      animationData={drinkAnimation}
                      loop={true}
                      autoplay={true}
                    />
                  </div>
                ) : place.type === 'club' ? (
                  <div style={{ 
                    width: 48, 
                    height: 48,
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' : 'none',
                    animation: isSelected ? 'sparkle 1.5s ease-in-out infinite' : 'none'
                  }}>
                    <Lottie 
                      animationData={clubAnimation}
                      loop={true}
                      autoplay={true}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    width: 48, 
                    height: 48,
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' : 'none',
                    animation: isSelected ? 'sparkle 1.5s ease-in-out infinite' : 'none'
                  }}>
                    <Lottie 
                      animationData={othersAnimation}
                      loop={true}
                      autoplay={true}
                    />
                  </div>
                )}
              </div>
            </OverlayView>
          );
        })}
      </GoogleMap>
    </div>
  ) : <div className="w-full h-full flex items-center justify-center bg-gray-100">지도 로딩 중...</div>;
};

// 반짝이는 애니메이션 스타일 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes sparkle {
    0% {
      filter: drop-shadow(0 0 8px rgba(0,0,0,0.2));
    }
    50% {
      filter: drop-shadow(0 0 15px rgba(128,0,32,0.9)) drop-shadow(0 0 20px rgba(128,0,32,0.6));
    }
    100% {
      filter: drop-shadow(0 0 8px rgba(0,0,0,0.2));
    }
  }
`;
document.head.appendChild(style);

export default MapComponent; 