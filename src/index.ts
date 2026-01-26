import { WorkerEntrypoint } from "cloudflare:workers";

/* -------------------- CONFIG -------------------- */

const NO_LIST_KEYS = new Set(["index.html"]);
const NO_LIST_PREFIXES = [".", "_", "private/", "internal/"];

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

/* -------------------- HELPERS -------------------- */

function isBlocked(key: string): boolean {
	if (NO_LIST_KEYS.has(key)) return true;
	return NO_LIST_PREFIXES.some((p) => key.startsWith(p));
}

function requireAccess(request: Request, env: Env) {
	console.log("INSIDE REQ ACCESS, ENV IS : ", env.ENV);
	if (env.ENV === "dum") {
		console.log("DEV MODE – skipping Access");
		return;
	}

	const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
	if (!jwt) {
		throw new Response("Unauthorized (Access)", {
			status: 401,
			headers: corsHeaders,
		});
	}
}

async function walkR2(
	env: Env,
	prefix = "",
): Promise<{
	files: string[];
	directories: string[];
}> {
	const files: string[] = [];
	const directories: string[] = [];

	const res = await env.R2.list({
		prefix,
		delimiter: "/",
	});

	// Files at this level
	for (const obj of res.objects) {
		if (obj.size > 0 && !isBlocked(obj.key)) {
			files.push(obj.key);
		}
	}

	// Directories at this level
	for (const dir of res.delimitedPrefixes ?? []) {
		if (isBlocked(dir)) continue;

		directories.push(dir);

		// Recurse into subfolder
		const sub = await walkR2(env, dir);
		files.push(...sub.files);
		directories.push(...sub.directories);
	}

	return { files, directories };
}

/* -------------------- WORKER -------------------- */

export default class extends WorkerEntrypoint<Env> {
	async fetch(request: Request): Promise<Response> {
		const env = this.env;
		const ctx = this.ctx;

		const url = new URL(request.url);
		const { pathname, searchParams } = url;

		console.log("ENV =", env.ENV);
		console.log("HIT", request.method, pathname);

		/* -------------------- CORS preflight -------------------- */
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		/* -------------------- Access protection -------------------- */
		if (pathname.startsWith("/api/")) {
			try {
				console.log("ASKING ACCESS");
				requireAccess(request, env);
			} catch (res) {
				return res as Response;
			}
		}

		/* -------------------- Root: serve index.html -------------------- */
		if (pathname === "/") {
			const obj = await env.R2.get("index.html");
			if (!obj) {
				return new Response("index.html missing", {
					status: 500,
					headers: corsHeaders,
				});
			}

			let html = await obj.text();

			const inject = `
      <script>
        window.CONFIG = {
          ENV: "${env.ENV}",
          CDN_BASE: "${env.CDN_BASE}",
          API_BASE: "${env.API_BASE}"
        };
      </script>
      `;

			// Insert right before </head>
			html = html.replace("</head>", `${inject}\n</head>`);

			return new Response(html, {
				headers: {
					...corsHeaders,
					"Content-Type": "text/html; charset=utf-8",
				},
			});
		}

		/* -------------------- List files -------------------- */
		if (pathname === "/api/list") {
			let prefix = searchParams.get("prefix") || "";
			if (prefix && !prefix.endsWith("/")) prefix += "/";

			const { objects, delimitedPrefixes } = await env.R2.list({
				prefix,
				delimiter: "/",
			});

			const files = objects
				.filter((o) => o.size > 0)
				.map((o) => o.key)
				.filter((key) => !isBlocked(key));

			const directories = (delimitedPrefixes ?? []).filter((d) => !isBlocked(d));

			return Response.json({ files, directories }, { headers: corsHeaders });
		}

		/* -------------------- Upload file -------------------- */
		if (pathname === "/api/upload" && request.method === "POST") {
			const formData = await request.formData();
			const file = formData.get("file") as File | null;
			const dir = formData.get("directory")?.toString() || "";

			if (!file) {
				return Response.json({ error: "No file" }, { status: 400, headers: corsHeaders });
			}

			const key = dir ? `${dir.replace(/\/?$/, "/")}${file.name}` : file.name;

			console.log("UPLOAD:", key);

			await env.R2.put(key, file.stream());

			return Response.json({ success: true, key }, { headers: corsHeaders });
		}

		/* -------------------- Create directory -------------------- */
		if (pathname === "/api/mkdir" && request.method === "POST") {
			const { directory } = (await request.json()) as { directory?: string };

			if (!directory) {
				return Response.json({ error: "No directory" }, { status: 400, headers: corsHeaders });
			}

			const key = directory.replace(/\/?$/, "/.placeholder");

			console.log("MKDIR:", key);

			await env.R2.put(key, "");

			return Response.json({ success: true, directory }, { headers: corsHeaders });
		}

		/* -------------------- Delete file / directory -------------------- */
		if (pathname === "/api/delete" && request.method === "POST") {
			const { key, isDir } = (await request.json()) as { key?: string; isDir?: boolean };

			if (!key) {
				return Response.json({ error: "No key" }, { status: 400, headers: corsHeaders });
			}

			console.log("DELETE:", key, "dir?", isDir);

			if (isDir) {
				// Delete all objects under this prefix
				const prefix = key.replace(/\/?$/, "/");

				const listed = await env.R2.list({ prefix });
				for (const obj of listed.objects) {
					await env.R2.delete(obj.key);
				}

				return Response.json(
					{ success: true, deleted: "directory", prefix },
					{ headers: corsHeaders },
				);
			} else {
				//Delete single file
				await env.R2.delete(key);

				return Response.json({ success: true, deleted: "file", key }, { headers: corsHeaders });
			}
		}

		/* -------------------- Move file / directory -------------------- */
		if (pathname === "/api/move" && request.method === "POST") {
			const { from, to, isDir } = (await request.json()) as {
				from?: string;
				to?: string;
				isDir?: boolean;
			};

			if (!from || !to) {
				return Response.json({ error: "Missing from/to" }, { status: 400, headers: corsHeaders });
			}

			const cleanFrom = from.replace(/\/+$/, "");
			const cleanTo = to.replace(/\/+$/, "");

			// Block moving into itself
			if (cleanFrom === cleanTo) {
				return Response.json(
					{ error: "Cannot move folder into itself" },
					{ status: 400, headers: corsHeaders },
				);
			}

			// Block moving into own subtree
			if (isDir && cleanTo.startsWith(cleanFrom + "/")) {
				return Response.json(
					{ error: "Cannot move a folder into itself or its subdirectory" },
					{ status: 400, headers: corsHeaders },
				);
			}

			console.log("MOVE:", from, "→", to, "dir?", isDir);

			if (isDir) {
				// Move directory recursively
				const fromPrefix = cleanFrom + "/";
				const toPrefix = cleanTo + "/";

				const listed = await env.R2.list({ prefix: fromPrefix });

				for (const obj of listed.objects) {
					const newKey = obj.key.replace(fromPrefix, toPrefix);

					const data = await env.R2.get(obj.key);
					if (data) {
						await env.R2.put(newKey, data.body);
						await env.R2.delete(obj.key);
					}
				}

				return Response.json(
					{ success: true, moved: "directory", from, to },
					{ headers: corsHeaders },
				);
			} else {
				// Move single file
				const data = await env.R2.get(from);
				if (!data) {
					return Response.json({ error: "File not found" }, { status: 404, headers: corsHeaders });
				}

				await env.R2.put(to, data.body);
				await env.R2.delete(from);

				return Response.json({ success: true, moved: "file", from, to }, { headers: corsHeaders });
			}
		}

		if (pathname === "/config") {
			return Response.json(
				{
					ENV: env.ENV,
					API_BASE: env.API_BASE,
					CDN_BASE: env.CDN_BASE,
				},
				{ headers: corsHeaders },
			);
		}

		/* -------------------- List files -------------------- */
		if (pathname === "/config/list") {
			const { files, directories } = await walkR2(env, "");

			return Response.json(
				{
					files: files.sort(),
					directories: directories.sort(),
				},
				{ headers: corsHeaders },
			);
		}

		/* -------------------- OBSERVABILITY -------------------- */
		if (pathname === "/api/obs/summary") {
			// Top files by count
			const topFiles = await env.DB.prepare(
				`
        SELECT file, SUM(count) as hits
        FROM file_usage
        GROUP BY file
        ORDER BY hits DESC
        LIMIT 10
      `,
			).all();

			// Recent activity
			const recent = await env.DB.prepare(
				`
        SELECT file, site, page, count, last_seen
        FROM file_usage
        ORDER BY last_seen DESC
        LIMIT 20
      `,
			).all();

			// Total requests
			const total = await env.DB.prepare(
				`
        SELECT SUM(count) as total FROM file_usage
      `,
			).first();

			return Response.json(
				{
					total: total?.total || 0,
					top: topFiles.results,
					recent: recent.results,
				},
				{ headers: corsHeaders },
			);
		}

		/* -------------------- CDN SERVE (everything else) -------------------- */

		const key = pathname.replace(/^\/+/, "");

		if (key && !pathname.startsWith("/api/")) {
			// Block admin / internal paths if needed
			if (isBlocked(key)) {
				return new Response("Forbidden", { status: 403, headers: corsHeaders });
			}

			const obj = await env.R2.get(key);

			if (!obj) {
				return new Response("Not Found", { status: 404, headers: corsHeaders });
			}

			// ---------- TELEMETRY ----------
			const referer = request.headers.get("Referer") || "";
			const ua = request.headers.get("User-Agent") || "";

			let site = "direct";
			let page = "";

			if (referer) {
				try {
					const ref = new URL(referer);
					site = ref.hostname;
					page = ref.pathname;
				} catch {}
			}

			// Fire-and-forget logging (no await needed but safe)
			ctx.waitUntil(
				env.DB.prepare(
					`
          INSERT INTO file_usage (file, site, page, count, last_seen)
          VALUES (?, ?, ?, 1, ?)
          ON CONFLICT(file, site, page)
          DO UPDATE SET
            count = count + 1,
            last_seen = excluded.last_seen
        `,
				)
					.bind(key, site, page, Date.now())
					.run(),
			);

			// ---------- SERVE FILE ----------
			return new Response(obj.body, {
				headers: {
					"Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
					"Cache-Control": "public, max-age=31536000, immutable",
					...corsHeaders,
				},
			});
		}

		/* -------------------- Fallback -------------------- */
		return new Response("Not Found", { status: 404, headers: corsHeaders });
	}
}
