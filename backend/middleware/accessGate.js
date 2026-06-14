const crypto = require('crypto');

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

const GATE_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Accesso Riservato</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f0f11;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .box {
    background: #1a1a1e;
    border: 1px solid #2a2a30;
    border-radius: 12px;
    padding: 48px 40px;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 24px 64px rgba(0,0,0,.6);
  }
  .icon {
    width: 48px;
    height: 48px;
    background: rgba(216,18,91,.12);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }
  h1 { color: #f0f0f0; font-size: 20px; font-weight: 600; margin-bottom: 8px; }
  p { color: #666; font-size: 14px; margin-bottom: 32px; line-height: 1.55; }
  label {
    display: block;
    color: #888;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .7px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  input[type=password] {
    width: 100%;
    background: #111115;
    border: 1px solid #2a2a30;
    border-radius: 8px;
    padding: 12px 14px;
    color: #f0f0f0;
    font-size: 15px;
    font-family: monospace;
    letter-spacing: 2px;
    outline: none;
    transition: border-color .15s;
  }
  input:focus { border-color: #D8125B; }
  .error {
    background: rgba(216,18,91,.1);
    border: 1px solid rgba(216,18,91,.3);
    border-radius: 6px;
    color: #f4547a;
    font-size: 13px;
    padding: 10px 14px;
    margin-bottom: 20px;
  }
  button {
    width: 100%;
    background: #D8125B;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 13px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 16px;
    transition: background .15s;
    letter-spacing: .3px;
  }
  button:hover { background: #b30f4d; }
  button:active { background: #8f0c3d; }
</style>
</head>
<body>
<div class="box">
  <div class="icon">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D8125B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  </div>
  <h1>Accesso Riservato</h1>
  <p>Questa area è ad accesso limitato. Inserisci il token di accesso per continuare.</p>
  {{ERROR}}
  <form method="POST" action="/api/gate/verify" autocomplete="off">
    <label for="token">Token di Accesso</label>
    <input type="password" id="token" name="token" placeholder="••••••••••••••" required autofocus spellcheck="false" autocomplete="off">
    <button type="submit">Accedi</button>
  </form>
</div>
</body>
</html>`;

module.exports = function accessGate(req, res, next) {
  const expected = process.env.ACCESS_TOKEN;
  if (!expected) return next();

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.visa_token || '';

  let valid = false;
  if (token.length > 0 && token.length === expected.length) {
    try {
      valid = crypto.timingSafeEqual(
        Buffer.from(token, 'utf8'),
        Buffer.from(expected, 'utf8')
      );
    } catch (_) {}
  }

  if (valid) return next();

  const showError = req.query.error === '1';
  const html = GATE_HTML.replace('{{ERROR}}',
    showError ? '<div class="error">Token non valido. Riprova.</div>' : ''
  );
  // Override helmet CSP for this page (no scripts, inline CSS only, form to self)
  res.setHeader('Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'"
  );
  res.status(401).type('html').send(html);
};
