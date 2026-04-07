/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_GOOGLE_CLIENT_ID?: string;
	readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface GoogleCredentialResponse {
	credential?: string;
}

interface Window {
	dataLayer?: unknown[][];
	gtag?: (...args: unknown[]) => void;
	google?: {
		accounts?: {
			id?: {
				initialize: (options: {
					client_id: string;
					callback: (response: GoogleCredentialResponse) => void;
				}) => void;
				renderButton: (
					parent: HTMLElement,
					options: {
						type?: string;
						theme?: string;
						text?: string;
						shape?: string;
						width?: number;
					},
				) => void;
			};
		};
	};
}
