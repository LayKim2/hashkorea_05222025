export type PlaceType = 'cafe' | 'food' | 'drink' | 'club' | 'landmark' | 'others';

export function mapPlaceType(googleType: string): PlaceType {
  const type = googleType.toLowerCase();
  
  // 카페 관련
  if (type.includes('cafe') || type.includes('bakery') || type.includes('coffee')) {
    return 'cafe';
  }
  
  // 음식 관련
  if (type.includes('restaurant') || type.includes('food') || type.includes('meal')) {
    return 'food';
  }
  
  // 술집 관련
  if (type.includes('bar') || type.includes('liquor') || type.includes('pub')) {
    return 'drink';
  }

  // 클럽 관련
  if (type.includes('night_club') || type.includes('club')) {
    return 'club';
  }
  
  // 관광지 관련
  if (type.includes('tourist') || type.includes('attraction') || type.includes('museum') || 
      type.includes('art_gallery') || type.includes('park') || type.includes('amusement_park')) {
    return 'landmark';
  }
  
  return 'others';
} 