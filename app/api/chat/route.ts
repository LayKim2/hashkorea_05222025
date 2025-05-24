import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PlaceType, mapPlaceType } from '../../utils/placeTypes';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// 언어 감지 함수
function detectLanguage(text: string): 'ko' | 'ja' | 'zh' | 'en' {
  // 한글
  if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text)) return 'ko';
  // 일본어
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text)) return 'ja';
  // 중국어
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  // 영어
  return 'en';
}

export async function POST(request: Request) {
  try {
    // 요청 데이터 파싱
    const body = await request.json();
    console.log('Received request body:', body);

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request format: messages array is required' },
        { status: 400 }
      );
    }

    // Gemini 모델 초기화
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 현재까지 수집된 정보
    const currentCollectedInfo = body.collectedInfo || {
      location: null,
      purpose: null,
      preferences: null
    };

    // 사용자 입력 처리
    const userInput = body.messages[body.messages.length - 1].content;
    const detectedLang = detectLanguage(userInput);
    
    console.log('Original input:', userInput);
    console.log('Detected language:', detectedLang);

    // 시스템 프롬프트와 사용자 메시지 결합
    const prompt = `You are a travel recommendation AI assistant. The user's message is in ${detectedLang} language. Please respond in the same language. Keep track of the information you have collected and what is still needed. When responding, include the current state of information in your response. Current collected information: ${JSON.stringify(currentCollectedInfo)}

When classifying places, use ONLY these types:
- "cafe": coffee shops, bakeries, dessert cafes
- "food": restaurants, fast food, any food-related places
- "drink": bars, pubs, any places primarily serving alcohol
- "club": night clubs, dance clubs
- "landmark": tourist spots, attractions, activities, museums, exhibitions
- "others": any places that don't fit the above categories

{
  "type": "chat" | "recommendation",  // response type
  "collectedInfo": {
    "location": string | null,        // area (e.g., "Seoul", "Hongdae")
    "purpose": string | null,         // purpose (e.g., "tourist spot", "restaurant")
    "preferences": string[] | null    // specific preferences (e.g., ["quiet", "historical"])
  },
  "missingInfo": string[],           // list of missing information
  "message": string,                 // message to show to the user (in ${detectedLang})
  "searchTerms": string[] | null,    // place types (only for recommendation type)
  "requirements": string[] | null,   // special requirements (only for recommendation type)
  "placeType": "cafe" | "food" | "drink" | "club" | "landmark" | "others"  // place type classification
}

Examples in ${detectedLang}:
Input: "I want to visit a coffee shop in Seoul"
Output: {
  "type": "recommendation",
  "collectedInfo": {
    "location": "Seoul",
    "purpose": "coffee shop",
    "preferences": null
  },
  "missingInfo": [],
  "message": "I'll help you find coffee shops in Seoul.",
  "searchTerms": ["coffee shop", "cafe"],
  "requirements": [],
  "placeType": "cafe"
}

Input: "I want to see historical sites"
Output: {
  "type": "recommendation",
  "collectedInfo": {
    "location": "Seoul",
    "purpose": "historical sites",
    "preferences": ["historical"]
  },
  "missingInfo": [],
  "message": "I'll help you find historical sites in Seoul.",
  "searchTerms": ["historical site", "tourist attraction"],
  "requirements": ["historical"],
  "placeType": "landmark"
}

User input: ${userInput}`;

    // 메시지 전송 및 응답 받기
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini API response:', text);

    try {
      // 마크다운 코드 블록 제거
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsedContent = JSON.parse(jsonText);
      
      // 응답 타입에 따른 처리
      if (parsedContent.type === 'chat') {
        return NextResponse.json({
          type: 'chat',
          message: parsedContent.message,
          collectedInfo: parsedContent.collectedInfo
        });
      }

      // recommendation 타입인 경우 데이터 검증
      if (parsedContent.type === 'recommendation') {
        // 모든 필요한 정보가 수집되었는지 확인
        if (parsedContent.missingInfo && parsedContent.missingInfo.length > 0) {
          return NextResponse.json({
            type: 'chat',
            message: parsedContent.message,
            collectedInfo: parsedContent.collectedInfo
          });
        }

        // 기본값 설정
        const response = {
          type: 'recommendation',
          searchTerms: Array.isArray(parsedContent.searchTerms) ? parsedContent.searchTerms : [parsedContent.searchTerms],
          location: parsedContent.collectedInfo.location,
          requirements: Array.isArray(parsedContent.requirements) ? parsedContent.requirements : [],
          message: parsedContent.message,
          collectedInfo: parsedContent.collectedInfo,
          placeType: mapPlaceType(parsedContent.placeType || '')
        };

        console.log('Final response:', response);
        console.log('Original Place Type:', parsedContent.placeType);
        console.log('Mapped Place Type:', response.placeType);
        return NextResponse.json(response);
      }

      return NextResponse.json(
        { error: 'Invalid response type from Gemini' },
        { status: 500 }
      );
    } catch {
      console.error('Failed to parse Gemini response:', text);
      return NextResponse.json(
        { error: 'Failed to parse Gemini response', details: text },
        { status: 500 }
      );
    }
  } catch {
    console.error('Gemini API error');
    return NextResponse.json(
      { error: 'Failed to process the request' },
      { status: 500 }
    );
  }
} 