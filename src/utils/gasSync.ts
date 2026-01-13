/**
 * 구글 앱스 스크립트(GAS)와 연동하여 단어 목록을 시트로 전송하거나 가져옵니다.
 */

export async function syncToGas(url: string, words: any[]) {
    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'sync',
                timestamp: new Date().toISOString(),
                words: words.map(w => ({
                    term: w.term,
                    definition: w.definition,
                    level: w.level,
                    wrongCount: w.wrongCount
                }))
            }),
        });
        return true;
    } catch (error) {
        console.error('GAS Sync Error:', error);
        throw error;
    }
}

export async function fetchFromGas(url: string) {
    try {
        // GET 요청으로 시트 데이터를 가져옴
        const response = await fetch(`${url}?action=read`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.words as { term: string; definition: string }[];
    } catch (error) {
        console.error('GAS Fetch Error:', error);
        throw error;
    }
}
