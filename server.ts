/**
 * Production server for the Docker image: serves the static build in ./dist and
 * forwards appointment requests to a Discord webhook (APPOINTMENT_WEBHOOK).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dir, 'dist');
const webhook = process.env.APPOINTMENT_WEBHOOK?.trim();
const port = Number(process.env.PORT ?? 3000);

// Field labels for the Discord message, in the order the wizard sends them.
const FIELDS: [key: string, label: string][] = [
  ['is_services', 'บริการ'],
  ['physician_name', 'แพทย์'],
  ['is_date', 'วันที่'],
  ['is_time', 'เวลา'],
  ['is_remark', 'หมายเหตุ'],
  ['phone', 'โทรศัพท์'],
  ['email', 'อีเมล'],
  ['passport', 'เลขบัตรประชาชน/พาสปอร์ต'],
  ['nation', 'สัญชาติ'],
  ['birthday', 'วันเกิด'],
  ['disease', 'โรคประจำตัว'],
  ['lang', 'ภาษา'],
];

// shortcut: in-memory per-IP limit, resets on restart and is per container; move to Redis if we scale out.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const json = (status: number, body: object) => Response.json(body, { status });

async function appointment(req: Request, ip: string) {
  if (!webhook) return json(503, { error: 'appointments unavailable' });
  if (Number(req.headers.get('content-length') ?? 0) > 10_000) return json(413, { error: 'too large' });
  if (limited(ip)) return json(429, { error: 'too many requests' });

  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }
  // Untrusted input: keep strings only, trimmed and capped to Discord's field limit.
  const val = (k: string) => (typeof data?.[k] === 'string' ? (data[k] as string).trim().slice(0, 1000) : '');
  if (!val('firstname') || !val('lastname') || !/^[\d\s+-]{6,20}$/.test(val('phone'))) {
    return json(400, { error: 'missing required fields' });
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      allowed_mentions: { parse: [] }, // form text must never ping anyone
      embeds: [
        {
          title: `นัดหมายใหม่: ${val('firstname')} ${val('lastname')}`.slice(0, 256),
          color: 0x2eb8ae,
          fields: [
            ...FIELDS.filter(([k]) => val(k)).map(([k, name]) => ({ name, value: val(k), inline: k.length < 8 })),
            { name: 'ผู้ป่วยเดิม', value: val('is_profile') ? 'ใช่' : 'ไม่ใช่', inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
  if (!res.ok) {
    console.error('Discord webhook failed', res.status, await res.text());
    return json(502, { error: 'delivery failed' });
  }
  return json(200, { ok: true });
}

function file(pathname: string) {
  let target = path.resolve(root, '.' + decodeURIComponent(pathname));
  if (target !== root && !target.startsWith(root + path.sep)) return null; // path traversal
  let stat = fs.statSync(target, { throwIfNoEntry: false });
  if (stat?.isDirectory()) {
    // Redirect like nginx did, so relative URLs inside the page resolve.
    if (!pathname.endsWith('/')) return new Response(null, { status: 301, headers: { Location: pathname + '/' } });
    target = path.join(target, 'index.html');
    stat = fs.statSync(target, { throwIfNoEntry: false });
  }
  if (!stat?.isFile()) return null;
  const cache = pathname.startsWith('/_astro/') ? 'public, max-age=31536000, immutable'
    : pathname.startsWith('/assets/') ? 'public, max-age=2592000' : 'no-cache';
  const headers: Record<string, string> = { 'Cache-Control': cache };
  // RFC 8288 discovery links so agents find the site summary and page list without parsing HTML.
  if (target.endsWith('.html')) headers.Link = '</llms.txt>; rel="describedby"; type="text/markdown", </sitemap.xml>; rel="sitemap"; type="application/xml"';
  return new Response(Bun.file(target), { headers });
}

Bun.serve({
  port,
  async fetch(req, server) {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/appointment') {
      if (req.method !== 'POST') return json(405, { error: 'method not allowed' });
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || server.requestIP(req)?.address || '';
      return appointment(req, ip);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 });
    return file(pathname) ?? new Response('Not Found', { status: 404 });
  },
});
console.log(`Serving ${root} on :${port}`);
