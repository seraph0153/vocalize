/**
 * 구글 앱스 스크립트(GAS)와 연동하여 단어 목록을 시트로 전송합니다.
 * GAS에서 Web App으로 배포된 URL이 필요합니다.
 */

export async function syncToGas(url: string, words: any[]) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'no-cors', // GAS Web App은 보통 CORS 이슈로 no-cors를 사용하거나 JSONP를 고려해야 함
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                wordCount: words.length,
                words: words.map(w => ({
                    term: w.term,
                    definition: w.definition,
                    level: w.level,
                    wrongCount: w.wrongCount
                }))
            }),
        });

        // no-cors 모드에서는 응답 내용을 읽을 수 없으므로 성공으로 간주
        return true;
    } catch (error) {
        console.error('GAS Sync Error:', error);
        throw error;
    }
}
