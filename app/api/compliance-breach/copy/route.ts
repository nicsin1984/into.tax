import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'

function html(content: string) {
  return new Response(content, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const token = searchParams.get("token")

  if (!token || token !== process.env.COMPLIANCE_BREACH_SECRET) {
    return html("<h2>Unauthorised</h2>")
  }
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return html("<h2>Invalid request</h2>")
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { data: row, error } = await supabase
    .from("compliance_breach")
    .select("draft_text, status, week_number, year")
    .eq("id", id)
    .single()

  if (error || !row) {
    return html("<h2>Briefing not found</h2>")
  }

  const draft = row.draft_text ?? ""
  const escaped = draft
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Escape backticks for JS template literal
    .replace(/`/g, "\\`")

  return html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Compliance Breach — Copy Draft</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, serif;
      background: #FDFCFA;
      color: #1a1a1a;
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }
    .label {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #A0522D;
      margin-bottom: 8px;
    }
    .meta {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #888;
      margin-bottom: 24px;
    }
    .draft {
      background: #f7f4f0;
      border-left: 4px solid #A0522D;
      padding: 24px 28px;
      font-size: 16px;
      line-height: 1.75;
      white-space: pre-wrap;
      border-radius: 0 4px 4px 0;
    }
    .btn {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 28px;
      background: #A0522D;
      color: #FDFCFA;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn:hover { background: #8B4513; }
    .copied {
      display: none;
      margin-left: 12px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #A0522D;
    }
  </style>
</head>
<body>
  <div class="label">into.tax · NorthStar · Compliance Breach</div>
  <div class="meta">Week ${row.week_number} / ${row.year} &nbsp;·&nbsp; status: ${row.status}</div>

  <div class="draft" id="draftText">${escaped}</div>

  <div>
    <button class="btn" onclick="copyDraft()">Copy to clipboard</button>
    <span class="copied" id="copiedMsg">Copied!</span>
  </div>

  <script>
    function copyDraft() {
      const text = \`${escaped}\`;
      navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copiedMsg');
        msg.style.display = 'inline';
        setTimeout(() => { msg.style.display = 'none'; }, 2500);
      }).catch(() => {
        // Fallback: select the text
        const el = document.getElementById('draftText');
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      });
    }
  </script>
</body>
</html>`)
}
