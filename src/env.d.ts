/// <reference types="@cloudflare/workers-types" />

export {};

declare global {
	interface Env {
		R2: R2Bucket;
		DB: D1Database;

		AUTH_STATUS:string;
		API_BASE: string;
	}
}
