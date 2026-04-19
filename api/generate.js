export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { region, type, duration, price, raw } = req.body;

  if (!raw) return res.status(400).json({ error: '파트너 정보를 입력해주세요.' });

  const prompt = `당신은 마이리얼트립의 Tour & Activity 사업개발 매니저입니다.
파트너로부터 받은 날것의 상품 정보를 한국 여행자가 구매하고 싶어지도록 마이리얼트립 스타일의 상세페이지로 재작성해주세요.

입력 정보:
- 지역: ${region || '미입력'}
- 상품 유형: ${type}
- 소요 시간: ${duration || '미입력'}
- 가격: ${price || '미입력'}
- 파트너 원본 정보: ${raw}

다음 JSON 형식으로만 응답하세요 (마크다운 없이 순수 JSON만):
{
  "title": "상품명 (마이리얼트립 스타일, 대괄호 태그 포함, 50자 이내)",
  "breadcrumb": "지역 > 도시 > 카테고리",
  "badges": ["즉시확정", "최저가보장", "소수정예"],
  "intro": "상품 소개 2-3문장. 여행자의 감성을 자극하는 마이리얼트립 스타일로.",
  "usps": ["USP 1 (30자 이내)", "USP 2", "USP 3", "USP 4"],
  "courses": [
    {"name": "코스명", "desc": "설명", "time": "소요시간"},
    {"name": "코스명2", "desc": "설명2", "time": "소요시간2"}
  ],
  "includes": ["포함 항목1", "포함 항목2"],
  "excludes": ["불포함 항목1", "불포함 항목2"],
  "targetCopies": {
    "커플·연인": "커플 타겟 카피 1-2문장",
    "혼행러": "혼행 타겟 카피 1-2문장",
    "가족 여행": "가족 타겟 카피 1-2문장",
    "처음 방문": "처음 방문자 타겟 카피 1-2문장"
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'OpenAI API 오류');
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
