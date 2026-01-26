/// <reference types="@cloudflare/workers-types" />

export {};

declare global {
	interface Env {
		R2: R2Bucket;
		DB: D1Database;

		ENV: string;
		CDN_BASE: string;
		API_BASE: string;
	}
}
