const COOKIE_NAME = "yt_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const LOGIN_PATH = "/__login";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const password = env.SITE_PASSWORD || "flow";
    const expected = await sign(password);

    if (url.pathname === LOGIN_PATH && request.method === "POST") {
      const form = await request.formData();
      const submitted = form.get("password");
      const next = safeNext(form.get("next"));

      if (typeof submitted === "string" && submitted === password) {
        return new Response(null, {
          status: 303,
          headers: {
            "Location": next,
            "Set-Cookie": `${COOKIE_NAME}=${expected}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${COOKIE_MAX_AGE}`,
            "Cache-Control": "no-store",
          },
        });
      }
      return loginPage({ error: true, next });
    }

    const token = readCookie(request.headers.get("Cookie") || "", COOKIE_NAME);
    if (token && timingSafeEqual(token, expected)) {
      return env.ASSETS.fetch(request);
    }

    return loginPage({ error: false, next: url.pathname + url.search });
  },
};

function readCookie(header, name) {
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq > -1 && part.slice(0, eq) === name) return part.slice(eq + 1);
  }
  return null;
}

async function sign(password) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("yt-auth-v1"));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function safeNext(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function loginPage({ error, next }) {
  const nextAttr = escapeHtml(safeNext(next));
  const errorBanner = error ? `<div class="error">Incorrect password</div>` : "";
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Sign in</title>
<style>
  :root { color-scheme: dark; }
  html, body { height: 100%; margin: 0; }
  body {
    font: 15px/1.45 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
    background: #0c0c0d;
    color: #e8e8ea;
    display: grid;
    place-items: center;
  }
  .card {
    width: min(360px, calc(100% - 32px));
    padding: 28px;
    border-radius: 14px;
    background: #141416;
    border: 1px solid #232327;
    box-shadow: 0 8px 30px rgba(0,0,0,0.35);
  }
  h1 { margin: 0 0 4px; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
  p.sub { margin: 0 0 18px; color: #8a8a91; font-size: 13px; }
  input[type="password"] {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border-radius: 9px;
    background: #1c1c1f;
    border: 1px solid #2a2a2f;
    color: #e8e8ea;
    font: inherit;
    outline: none;
    transition: border-color 120ms ease, background 120ms ease;
  }
  input[type="password"]:focus { border-color: #4b8ef7; background: #1f1f23; }
  button {
    margin-top: 12px;
    width: 100%;
    padding: 10px 12px;
    border-radius: 9px;
    border: 0;
    background: #4b8ef7;
    color: #fff;
    font: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: background 120ms ease;
  }
  button:hover { background: #5a99f8; }
  .error {
    margin: 0 0 14px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(255, 87, 87, 0.10);
    color: #ff8a8a;
    font-size: 13px;
    border: 1px solid rgba(255, 87, 87, 0.25);
  }
</style>
</head>
<body>
  <form class="card" method="POST" action="${LOGIN_PATH}" autocomplete="off">
    <h1>Sign in</h1>
    <p class="sub">Enter the password to view this demo.</p>
    ${errorBanner}
    <input type="password" name="password" placeholder="Password" autofocus required />
    <input type="hidden" name="next" value="${nextAttr}" />
    <button type="submit">Continue</button>
  </form>
</body>
</html>`;
  return new Response(body, {
    status: error ? 401 : 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
