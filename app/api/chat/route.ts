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

    // 시스템 프롬프트와 사용자 메시지 결합
    const prompt = `당신은 여행지 추천 AI 도우미입니다. 사용자와 자연스러운 대화를 하면서, 장소 추천이 필요한 경우 다음 JSON 형식으로 반환하세요:

{
  "type": "recommendation",  // 응답 타입 (recommendation 또는 chat)
  "searchTerms": ["카페", "레스토랑"],  // 장소 유형
  "location": "홍대",        // 지역
  "requirements": ["조용한", "24시간"], // 특별 요구사항
  "message": "홍대 근처의 조용한 카페를 찾아보겠습니다." // 사용자에게 보여줄 메시지
}

예시 1:
입력: "홍대 근처 조용한 카페 추천해줘"
출력: {
  "type": "recommendation",
  "searchTerms": ["카페"],
  "location": "홍대",
  "requirements": ["조용한"],
  "message": "홍대 근처의 조용한 카페를 찾아보겠습니다."
}

예시 2:
입력: "안녕하세요"
출력: {
  "type": "chat",
  "message": "안녕하세요! 어떤 여행지를 찾아보시나요?"
}

예시 3:
입력: "강남역 24시간 식당 찾아줘"
출력: {
  "type": "recommendation",
  "searchTerms": ["식당", "레스토랑"],
  "location": "강남역",
  "requirements": ["24시간"],
  "message": "강남역 근처의 24시간 영업하는 식당을 찾아보겠습니다."
}

사용자 입력: ${body.messages[body.messages.length - 1].content}`;

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
          message: parsedContent.message
        });
      }

      // recommendation 타입인 경우 데이터 검증
      if (parsedContent.type === 'recommendation') {
        if (!parsedContent.searchTerms || !parsedContent.location) {
          return NextResponse.json(
            { error: 'Invalid response format from Gemini' },
            { status: 500 }
          );
        }

        // 기본값 설정
        const response = {
          type: 'recommendation',
          searchTerms: Array.isArray(parsedContent.searchTerms) ? parsedContent.searchTerms : [parsedContent.searchTerms],
          location: parsedContent.location,
          requirements: Array.isArray(parsedContent.requirements) ? parsedContent.requirements : [],
          message: parsedContent.message || '장소를 찾아보겠습니다.'
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