'use strict';
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// ── clients ───────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

const gpt4o = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  timeout: 60000,
  maxRetries: 2,
});

const mailer = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 587,
  secure: false,
  auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
});

// ── CLI args ──────────────────────────────────────────────────────────────────
const daysArg = process.argv.find(a => a.startsWith('--days='));
const LOOKBACK_DAYS = daysArg ? parseInt(daysArg.split('=')[1], 10) : 7;

// ── ISO week helpers ──────────────────────────────────────────────────────────
function getISOWeek(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getISOYear(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

// ── HTML escape helper ────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── selection config ──────────────────────────────────────────────────────────
const CRIME_TERMS = [
  'penalty', 'prosecution', 'fraud', 'investigation', 'tribunal',
  'fine', 'defaulter', 'convicted', 'sentenced', 'disciplinary',
  'hmrc enquiry', 'tax evasion', 'money laundering', 'cfa 2017',
];

function isQualifyingArticle(article) {
  const pillars = Array.isArray(article.northstar_pillars) ? article.northstar_pillars.length : 0;
  if (pillars === 0) return false;
  const haystack = [article.title || '', article.summary || '', article.category || '']
    .join(' ').toLowerCase();
  return CRIME_TERMS.some(t => haystack.includes(t));
}

const WEAK_DRAFT_PATTERNS = [
  'no_case_found', 'limited information', 'not a compliance breach',
  'necessarily general', '[note:',
];

function isDraftRejected(draft) {
  const lower = draft.toLowerCase();
  return WEAK_DRAFT_PATTERNS.some(p => lower.includes(p));
}

// ── week lock — file-based (Supabase table optional) ─────────────────────────
const LOCK_FILE = path.join(__dirname, '.compliance-breach-lock.json');

function readFileLock() {
  try { return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')); }
  catch { return null; }
}

function writeFileLock(week, year, rowId) {
  fs.writeFileSync(LOCK_FILE, JSON.stringify(
    { week, year, rowId, createdAt: new Date().toISOString() }
  ));
}

async function isAlreadyRunThisWeek() {
  const week = getISOWeek();
  const year = getISOYear();

  // Try Supabase table first
  try {
    const { data, error } = await supabase
      .from('compliance_breach')
      .select('id, status')
      .eq('week_number', week)
      .eq('year', year)
      .in('status', ['draft', 'approved', 'published'])
      .maybeSingle();

    if (!error && data) {
      console.log(`Week lock (Supabase): already have status="${data.status}" for week ${week}/${year}.`);
      return true;
    }
    if (error && !error.message?.includes('does not exist') && error.code !== 'PGRST205') {
      throw error;
    }
  } catch (err) {
    if (!err.message?.includes('does not exist') && err.code !== 'PGRST205') throw err;
  }

  // File lock fallback
  const lock = readFileLock();
  if (lock && lock.week === week && lock.year === year) {
    console.log(`Week lock (file): already ran for week ${week}/${year}.`);
    return true;
  }

  return false;
}

// ── save to Supabase (best-effort) ────────────────────────────────────────────
async function saveToSupabase({ article, draft, sourceText, verification, verificationStatus }) {
  const week = getISOWeek();
  const year = getISOYear();

  try {
    const { data, error } = await supabase
      .from('compliance_breach')
      .insert({
        article_id: article.id,
        draft_text: draft,
        source_text: sourceText,
        verification_text: verification,
        verification_status: verificationStatus,
        status: 'draft',
        week_number: week,
        year: year,
        secret_token: process.env.COMPLIANCE_BREACH_SECRET || 'not-set',
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.warn('  compliance_breach table not set up — skipping Supabase save.');
        writeFileLock(week, year, null);
        return null;
      }
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    writeFileLock(week, year, data.id);
    return data.id;
  } catch (err) {
    if (err.message?.includes('does not exist') || err.message?.includes('PGRST205')) {
      console.warn('  compliance_breach table not set up — skipping Supabase save.');
      writeFileLock(week, year, null);
      return null;
    }
    throw err;
  }
}

// ── email senders ─────────────────────────────────────────────────────────────
async function sendMail(subject, html) {
  return mailer.sendMail({
    from: 'compliance@into.tax',
    to: 'nicky@into.tax',
    subject,
    html,
  });
}

async function sendNoArticleEmail(reason) {
  console.log('No suitable article — sending notification.');
  const week = getISOWeek();
  const year = getISOYear();
  const now = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  await sendMail(
    `Compliance Breach — No case found · Week ${week}/${year}`,
    `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#E8E4DE;">
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:620px;margin:0 auto;background:#F5F1EB;">
  <div style="background:#1A1A1A;padding:18px 28px;">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#F5F1EB;letter-spacing:-0.02em;">into.tax</span>
    <span style="font-family:'Courier New',monospace;font-size:9px;color:#C8610A;margin-left:10px;text-transform:uppercase;letter-spacing:0.15em;">Compliance Breach</span>
  </div>
  <div style="padding:24px 28px;border-bottom:1px solid #DDD8D0;">
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#888;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:12px;">Week ${week}/${year} · ${esc(now)}</div>
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#1A1A1A;margin:0 0 8px;">No qualifying enforcement case found this week.</p>
    <p style="font-family:'Courier New',monospace;font-size:11px;color:#999;margin:0;">${esc(reason)}</p>
  </div>
  <div style="background:#1A1A1A;padding:14px 28px;">
    <p style="font-family:'Courier New',monospace;font-size:10px;color:#444;margin:0;">into.tax · Compliance Breach · automated</p>
  </div>
</div></body></html>`
  );
}

// ── email builder (matches weekly-digest design system) ───────────────────────
function buildReviewEmail({ article, draft, verification, sourceText, rowId, hasIssues, days }) {
  const week = getISOWeek();
  const year = getISOYear();
  const now = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const base = 'https://into.tax/api/compliance-breach';
  const approveUrl = rowId ? `${base}/approve?id=${rowId}&token=${process.env.COMPLIANCE_BREACH_SECRET}` : `${base}/approve?id=placeholder`;
  const copyUrl    = rowId ? `${base}/copy?id=${rowId}&token=${process.env.COMPLIANCE_BREACH_SECRET}`    : `${base}/copy?id=placeholder`;

  const statusLabel = hasIssues ? 'NEEDS REVIEW' : 'VERIFIED';
  const windowNote  = days !== 7 ? ` · ${days}-day window` : '';

  // Format draft paragraphs
  const draftHtml = draft
    .split(/\n+/)
    .filter(Boolean)
    .map(p => `<p style="font-size:13px;color:#2A1A0A;line-height:1.75;margin-bottom:10px;font-weight:300;">${esc(p)}</p>`)
    .join('');

  // Verification checklist — lines formatted
  const verifyLines = verification
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const isVerified    = line.trim().toUpperCase().startsWith('VERIFIED');
      const isUnverified  = line.trim().toUpperCase().startsWith('UNVERIFIED');
      const isEmbellished = line.trim().toUpperCase().startsWith('EMBELLISHED');
      const dot = isVerified ? '●' : isUnverified ? '○' : isEmbellished ? '◆' : '·';
      const col = isVerified ? '#666' : isUnverified ? '#C8610A' : isEmbellished ? '#8B1A1A' : '#999';
      return `<div style="font-family:'Courier New',monospace;font-size:10px;color:${col};padding:3px 0;border-bottom:1px solid #EDE9E2;line-height:1.5;">${dot} ${esc(line.trim())}</div>`;
    })
    .join('');

  const pubDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Compliance Breach Draft · Week ${week}/${year}</title>
</head>
<body style="margin:0;padding:0;background:#E8E4DE;">
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:620px;margin:0 auto;background:#F5F1EB;">

  <!-- Header -->
  <div style="background:#F5F1EB;padding:22px 28px 18px;text-align:center;border-bottom:3px solid #1A1A1A;">
    <div style="font-family:'Courier New',monospace;font-size:10px;color:#999;letter-spacing:0.08em;margin-bottom:10px;text-align:left;">${esc(now)}</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#1A1A1A;letter-spacing:-0.03em;margin-bottom:3px;">into.tax</div>
    <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;color:#999;text-transform:uppercase;margin-bottom:14px;">UK Tax Intelligence</div>
    <div style="border-top:1px solid #DDD8D0;margin:0 0 12px;"></div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;font-weight:400;color:#555;margin-bottom:3px;">Compliance Breach</div>
    <div style="font-family:'Courier New',monospace;font-size:10px;color:#aaa;letter-spacing:0.05em;">
      Week ${week}/${year} &nbsp;·&nbsp; Draft for review &nbsp;·&nbsp; ${esc(statusLabel)}${windowNote}
    </div>
  </div>

  <!-- Approval action bar -->
  <div style="background:#FFF8F0;padding:18px 28px;border-bottom:1px solid #E8D4B0;">
    <p style="font-family:'Courier New',monospace;font-size:10px;color:#7A5030;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.1em;">Review and approve to send to subscribers</p>
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:10px;">
        <a href="${approveUrl}"
           style="display:inline-block;background:#C8610A;color:#fff;padding:11px 28px;text-decoration:none;font-weight:700;font-size:13px;font-family:Georgia,'Times New Roman',serif;border-radius:2px;">
          ✓ Approve &amp; Publish
        </a>
      </td>
      <td>
        <a href="${copyUrl}"
           style="display:inline-block;background:#F5F1EB;color:#1A1A1A;padding:11px 28px;text-decoration:none;font-weight:400;font-size:13px;font-family:'Courier New',monospace;border-radius:2px;border:1px solid #DDD8D0;">
          Copy Text
        </a>
      </td>
    </tr></table>
  </div>

  <!-- Section label: Compliance Breach -->
  <div style="font-family:'Courier New',monospace;font-size:9px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#C8610A;padding:12px 28px 10px;border-top:1px solid #DDD8D0;border-bottom:1px solid #E8D4C0;background:#F9EDE0;border-left:3px solid #C8610A;">
    ⚖ Compliance Breach — Tax enforcement briefing
  </div>

  <!-- Briefing content -->
  <div style="padding:20px 28px 18px;background:#F9EDE0;border-left:3px solid #C8610A;border-bottom:1px solid #DDD8D0;">
    ${draftHtml}
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #EDD8C0;">
      <span style="font-family:'Courier New',monospace;font-size:10px;color:#C09878;">Source: </span>
      <a href="${esc(article.url)}" style="font-family:'Courier New',monospace;font-size:10px;color:#C8610A;text-decoration:none;">${esc(article.title)}</a>
      <span style="font-family:'Courier New',monospace;font-size:10px;color:#C09878;"> &nbsp;·&nbsp; ${esc(pubDate)}</span>
    </div>
  </div>

  <!-- Section label: verification -->
  <div style="font-family:'Courier New',monospace;font-size:9px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#888;padding:12px 28px 10px;border-top:1px solid #DDD8D0;border-bottom:1px solid #DDD8D0;background:#EDE9E2;">
    GPT-4o Fact-Check · ${esc(statusLabel)}
  </div>

  <!-- Verification checklist -->
  <div style="padding:14px 28px 18px;background:#EDE9E2;border-bottom:1px solid #DDD8D0;">
    ${verifyLines || '<div style="font-family:\'Courier New\',monospace;font-size:10px;color:#999;">No checklist available.</div>'}
  </div>

  <!-- Section label: original source -->
  <div style="font-family:'Courier New',monospace;font-size:9px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#888;padding:12px 28px 10px;border-top:1px solid #DDD8D0;border-bottom:1px solid #DDD8D0;background:#EDE9E2;">
    Original Source — compare against draft above
  </div>

  <!-- Original source text -->
  <div style="padding:16px 28px 20px;background:#F5F1EB;border-bottom:1px solid #DDD8D0;">
    <div style="margin-bottom:10px;">
      <a href="${esc(article.url)}" style="font-family:'Courier New',monospace;font-size:11px;color:#C8610A;text-decoration:none;">${esc(article.url)}</a>
    </div>
    <pre style="font-family:'Courier New',monospace;font-size:10px;color:#555;line-height:1.6;white-space:pre-wrap;background:#EDE9E2;padding:14px 16px;border-radius:2px;margin:0;border-left:3px solid #DDD8D0;">${esc(sourceText || '(no source text fetched)').slice(0, 4000)}${(sourceText || '').length > 4000 ? '\n\n[truncated at 4000 chars…]' : ''}</pre>
  </div>

  <!-- Footer -->
  <div style="background:#1A1A1A;padding:16px 28px;border-top:1px solid #2A2A2A;">
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#555;margin:0 0 5px;">
      <span style="color:#AAA;">into.tax</span> · UK Tax Intelligence · ${year}
    </p>
    <p style="font-family:'Courier New',monospace;font-size:10px;color:#444;margin:0;">
      Automated enforcement briefing · Week ${week}/${year} · For editorial review only
    </p>
  </div>

</div>
</body>
</html>`;
}

// ── fetch full article text ───────────────────────────────────────────────────
async function fetchFullText(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; intotax-bot/1.0)' },
    });
    if (!res.ok) { console.warn(`  fetch ${url} → HTTP ${res.status}`); return ''; }
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ').trim();
    return text.slice(0, 6000);
  } catch (err) {
    console.warn(`  fetch failed: ${err.message}`);
    return '';
  }
}

// ── step 1: ranked candidates ─────────────────────────────────────────────────
async function getRankedArticles(days) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, url, source_url, summary, summary_detailed, category, northstar_pillars, published_at')
    .gte('published_at', since)
    .order('published_at', { ascending: false });

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  if (!data?.length) return [];

  const qualified = data.filter(isQualifyingArticle);
  qualified.sort((a, b) => {
    const pa = a.northstar_pillars.length, pb = b.northstar_pillars.length;
    if (pb !== pa) return pb - pa;
    return new Date(b.published_at) - new Date(a.published_at);
  });
  return qualified;
}

// ── step 2: write briefing ────────────────────────────────────────────────────
async function writeBriefing(article, fullText) {
  const sourceContent = fullText || article.summary_detailed || article.summary || article.title;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are a specialist tax journalist writing for UK accountancy practitioners.

If the source article does not describe a specific enforcement case — meaning it must include at least one of: a named individual or firm, a specific fine or penalty amount, a prosecution outcome, a tribunal decision, or a disciplinary finding — respond with exactly the word: NO_CASE_FOUND

Otherwise, write a 200-word "Compliance Breach" briefing based solely on the facts in the source article below.

Structure:
1. Open with the outcome — the fine, prosecution result, tribunal decision, or sanction
2. What specifically went wrong — the breach or failure that triggered enforcement
3. Why it wasn't caught — the control or process failure
4. What a well-run firm would have done differently

Rules:
- Use only facts from the source. Mark uncertain or inferred details [UNVERIFIED].
- No invented names, amounts or outcomes.
- Tone: direct, factual, no sensationalism. Written for experienced practitioners.
- Do not mention this briefing format, governance frameworks, or any product.
- Write this briefing based only on the verifiable public facts — the outcome, the penalty, the legislation cited. Do NOT paraphrase, summarise, or restructure the source article's editorial framing or analysis. Treat the source article as a lead to the underlying facts, not as content to rewrite. If the source article adds editorial commentary, opinions, or analysis beyond the raw facts, do not include those in the briefing.
- No heading. Just the briefing text.

SOURCE ARTICLE:
Title: ${article.title}
URL: ${article.url}
${sourceContent}`,
    }],
  });

  return response.content[0].text;
}

// ── step 3: verify ────────────────────────────────────────────────────────────
async function verifyDraft(article, draft, fullText) {
  const sourceContent = fullText || article.summary_detailed || article.summary || article.title;
  try {
    const response = await gpt4o.chat.completions.create({
      model: 'gpt-4o',
      stream: false,
      max_tokens: 800,
      messages: [
        { role: 'system', content: 'You are a fact-checking assistant. Be precise and systematic.' },
        {
          role: 'user',
          content: `Fact-check every factual claim in the DRAFT against the SOURCE ARTICLE.

For each claim output one line:
  VERIFIED   | <claim excerpt>
  UNVERIFIED | <claim excerpt>   <- not supported by source
  EMBELLISHED| <claim excerpt>   <- goes beyond or distorts source

SOURCE ARTICLE:
${sourceContent}

DRAFT:
${draft}

Output ONLY the checklist, one claim per line.`,
        },
      ],
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.warn(`GPT-4o verification failed: ${err.message}`);
    return `VERIFICATION UNAVAILABLE — ${err.message}`;
  }
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const week = getISOWeek();
  const year = getISOYear();
  console.log(`=== Compliance Breach Pipeline · Week ${week}/${year} (${LOOKBACK_DAYS}-day window) ===`);

  // ── Duplicate guard — must be first ──
  if (await isAlreadyRunThisWeek()) {
    console.log('Already sent for this week. Exiting.');
    return;
  }

  // Step 1
  console.log('Step 1: Finding qualifying enforcement articles...');
  const candidates = await getRankedArticles(LOOKBACK_DAYS);

  if (!candidates.length) {
    await sendNoArticleEmail(`No articles matched enforcement keywords in the past ${LOOKBACK_DAYS} days.`);
    writeFileLock(week, year, null); // lock so we don't keep notifying
    return;
  }

  console.log(`Found ${candidates.length} candidate(s).`);

  for (let i = 0; i < candidates.length; i++) {
    const article = candidates[i];
    console.log(`\n[${i + 1}/${candidates.length}] "${article.title}" (${article.published_at?.slice(0, 10)})`);

    // Fetch full text — required for a specific briefing
    const fetchUrl = article.source_url || article.url;
    console.log(`  Fetching: ${fetchUrl}`);
    const fullText = await fetchFullText(fetchUrl);
    console.log(`  Got ${fullText.length} chars.`);

    // Step 2
    console.log('  Drafting...');
    const draft = await writeBriefing(article, fullText);

    if (draft.trim().toUpperCase().startsWith('NO_CASE_FOUND')) {
      console.warn('  → NO_CASE_FOUND. Next.'); continue;
    }
    if (isDraftRejected(draft)) {
      const matched = WEAK_DRAFT_PATTERNS.find(p => draft.toLowerCase().includes(p));
      console.warn(`  → Rejected ("${matched}"). Next.`); continue;
    }
    console.log('  Draft accepted.');

    // Step 3
    console.log('  Verifying with GPT-4o...');
    const verification = await verifyDraft(article, draft, fullText);
    const hasIssues = /UNVERIFIED|EMBELLISHED|UNAVAILABLE/i.test(verification);
    const verificationStatus = hasIssues ? 'needs_review' : 'verified';
    console.log(`  Verification: ${verificationStatus}`);

    // Save to Supabase (best-effort)
    const sourceText = fullText || article.summary_detailed || article.summary || '';
    const rowId = await saveToSupabase({ article, draft, sourceText, verification, verificationStatus });
    console.log(rowId ? `  Saved: row ${rowId}` : '  Saved: file lock only.');

    // Build and send review email
    const windowNote = LOOKBACK_DAYS !== 7 ? ` [${LOOKBACK_DAYS}-day]` : '';
    const subject = `Compliance Breach · Week ${week}/${year} · ${hasIssues ? 'Needs review' : 'Verified'}${windowNote}`;
    const html = buildReviewEmail({ article, draft, verification, sourceText, rowId, hasIssues, days: LOOKBACK_DAYS });

    console.log('  Sending review email...');
    await sendMail(subject, html);
    console.log(`  ✓ Sent: ${subject}`);

    console.log('\nDone.');
    return;
  }

  // All candidates exhausted
  await sendNoArticleEmail(`All ${candidates.length} candidate(s) returned NO_CASE_FOUND or failed quality check.`);
  writeFileLock(week, year, null);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
