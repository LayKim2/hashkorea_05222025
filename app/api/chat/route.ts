import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

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

    // 시스템 프롬프트와 사용자 메시지 결합
    const prompt = `You are a travel recommendation AI assistant. Detect the user's language and respond in the same language. Keep track of the information you have collected and what is still needed. When responding, include the current state of information in your response. Current collected information: ${JSON.stringify(currentCollectedInfo)}

{
  "type": "chat" | "recommendation",  // response type
  "collectedInfo": {
    "location": string | null,        // area (e.g., "Seoul", "Hongdae")
    "purpose": string | null,         // purpose (e.g., "tourist spot", "restaurant")
    "preferences": string[] | null    // specific preferences (e.g., ["quiet", "historical"])
  },
  "missingInfo": string[],           // list of missing information
  "message": string,                 // message to show to the user
  "searchTerms": string[] | null,    // place types (only for recommendation type)
  "requirements": string[] | null    // special requirements (only for recommendation type)
}

Examples in English:
Input: "I want to visit Seoul"
Output: {
  "type": "chat",
  "collectedInfo": {
    "location": "Seoul",
    "purpose": null,
    "preferences": null
  },
  "missingInfo": ["purpose", "preferences"],
  "message": "I see you want to visit Seoul! What kind of places are you interested in? For example, tourist spots, restaurants, or shopping areas?"
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
  "requirements": ["historical"]
}

Examples in Korean:
Input: "서울 가고 싶어"
Output: {
  "type": "chat",
  "collectedInfo": {
    "location": "서울",
    "purpose": null,
    "preferences": null
  },
  "missingInfo": ["purpose", "preferences"],
  "message": "서울을 방문하고 싶으시군요! 어떤 종류의 장소를 찾고 계신가요? 예를 들어, 관광지, 맛집, 쇼핑 장소 등이 있습니다."
}

Input: "역사적인 장소를 보고 싶어"
Output: {
  "type": "recommendation",
  "collectedInfo": {
    "location": "서울",
    "purpose": "역사적 장소",
    "preferences": ["역사적"]
  },
  "missingInfo": [],
  "message": "서울의 역사적인 장소를 찾아보겠습니다.",
  "searchTerms": ["역사적 장소", "관광지"],
  "requirements": ["역사적"]
}

User input: ${body.messages[body.messages.length - 1].content}`;

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
          message: parsedContent.message || 'I will search for places for you.',
          collectedInfo: parsedContent.collectedInfo
        };

        console.log('Final response:', response);
        return NextResponse.json(response);
      }

      return NextResponse.json(
        { error: 'Invalid response type from Gemini' },
        { status: 500 }
      );
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return NextResponse.json(
        { error: 'Failed to parse Gemini response', details: text },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process the request', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 