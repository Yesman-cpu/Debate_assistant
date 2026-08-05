// api/chat.js (Vercel Serverless Function)
export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Vercel 비밀 공간(환경 변수)에서 API 키를 가져옵니다.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
    }

    const { promptText, systemInstructionText } = req.body;

    // 지원 가능한 Gemini 모델 목록 (자동 순회)
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-2.5-flash",
        "gemini-3-flash-preview"
    ];

    const payload = {
        contents: [{ parts: [{ text: promptText }] }]
    };

    if (systemInstructionText) {
        payload.systemInstruction = {
            parts: [{ text: systemInstructionText }]
        };
    }

    // 각 모델을 순서대로 시도하여 성공하는 모델로 응답
    for (const model of modelsToTry) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                return res.status(200).json(data);
            }
        } catch (error) {
            console.error(`[${model}] 서버 통신 오류:`, error);
        }
    }

    return res.status(500).json({ error: 'AI 응답 생성에 실패했습니다.' });
}
