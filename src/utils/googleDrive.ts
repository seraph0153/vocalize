'use client';

/**
 * 구글 드라이브 동기화를 위한 핵심 로직입니다.
 * 실제 사용을 위해서는 Google Cloud Console에서 
 * Client ID와 API Key를 발급받아 환경 변수에 설정해야 합니다.
 */

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export class GoogleDriveService {
    private static instance: GoogleDriveService;
    private gapiInitialized = false;

    private constructor() { }

    public static getInstance(): GoogleDriveService {
        if (!GoogleDriveService.instance) {
            GoogleDriveService.instance = new GoogleDriveService();
        }
        return GoogleDriveService.instance;
    }

    /**
     * Google API 클라이언트를 초기화합니다.
     */
    public async init() {
        if (this.gapiInitialized) return;

        return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                (window as any).gapi.load('client:auth2', async () => {
                    try {
                        await (window as any).gapi.client.init({
                            apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
                            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                            discoveryDocs: [DISCOVERY_DOC],
                            scope: SCOPES,
                        });
                        this.gapiInitialized = true;
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    /**
     * 로그인 상태를 확인하고 필요시 로그인을 유도합니다.
     */
    public async authenticate() {
        const auth = (window as any).gapi.auth2.getAuthInstance();
        if (!auth.isSignedIn.get()) {
            await auth.signIn();
        }
    }

    /**
     * 데이터를 JSON 파일로 구글 드라이브에 저장합니다.
     */
    public async saveData(data: any) {
        const fileName = `vocalize_${new Date().toISOString().split('T')[0]}.json`;
        const content = JSON.stringify(data);

        // 1. 파일이 이미 있는지 확인 (생략 가능, 여기서는 새로 생성하는 로직 위주)
        const fileMetadata = {
            name: fileName,
            mimeType: 'application/json',
        };

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(fileMetadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            content +
            close_delim;

        try {
            await (window as any).gapi.client.request({
                path: '/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                headers: {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"',
                },
                body: multipartRequestBody,
            });
            return true;
        } catch (err) {
            console.error('Save to Drive failed:', err);
            return false;
        }
    }
}
