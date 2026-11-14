import { afterAll, beforeAll, expect, test } from 'bun:test';
import type { Subprocess } from 'bun';

// Fake Discord webhook that records what the server forwards.
const received: any[] = [];
const discord = Bun.serve({ port: 0, fetch: async (req) => (received.push(await req.json()), new Response(null, { status: 204 })) });
const base = 'http://127.0.0.1:3999';
let server: Subprocess;

beforeAll(async () => {
  server = Bun.spawn([process.execPath, 'server.ts'], {
    cwd: import.meta.dir,
    env: { ...process.env, PORT: '3999', APPOINTMENT_WEBHOOK: `http://127.0.0.1:${discord.port}/hook` },
    stdout: 'ignore',
    stderr: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    if (await fetch(base + '/api/appointment', { signal: AbortSignal.timeout(500) }).then(() => true, () => false)) break;
    await Bun.sleep(100);
  }
});
afterAll(async () => {
  server.kill();
  await server.exited;
  discord.stop(true);
});

const post = (body: unknown) => fetch(base + '/api/appointment', { method: 'POST', body: JSON.stringify(body) });

test('forwards a valid appointment to Discord without pings', async () => {
  const res = await post({ firstname: 'Somchai', lastname: '@everyone', phone: '081-234-5678', is_date: '2026-11-01', extra: { a: 1 } });
  expect(res.status).toBe(200);
  const msg = received.at(-1);
  expect(msg.allowed_mentions).toEqual({ parse: [] });
  expect(msg.embeds[0].title).toContain('Somchai');
  expect(msg.embeds[0].fields.some((f: any) => f.value === '2026-11-01')).toBe(true);
});

test('rejects invalid input', async () => {
  expect((await post({ firstname: 'A', lastname: 'B', phone: 'not-a-phone' })).status).toBe(400);
  expect((await fetch(base + '/api/appointment', { method: 'POST', body: '{' })).status).toBe(400);
  expect((await fetch(base + '/api/appointment')).status).toBe(405);
});

test('advertises discovery links on HTML pages', async () => {
  expect((await fetch(base + '/')).headers.get('link')).toContain('</llms.txt>; rel="describedby"');
  expect((await fetch(base + '/llms.txt')).headers.get('link')).toBeNull();
});

test('does not serve files outside dist', async () => {
  expect((await fetch(base + '/..%2fpackage.json')).status).toBe(404);
  expect((await fetch(base + '/%2e%2e/server.ts')).status).toBe(404);
});

// --- Forwarding to the staff app (STAFF_BOOKING_URL / STAFF_BOOKING_SECRET) ---
const SECRET = 'test-secret';
const staffHits: { headers: Headers; raw: string }[] = [];
let staffStatus = 204;
let staffDelay = 0;
const staff = Bun.serve({
  port: 0,
  fetch: async (req) => {
    staffHits.push({ headers: req.headers, raw: await req.text() });
    if (staffDelay) await Bun.sleep(staffDelay);
    return new Response(null, { status: staffStatus });
  },
});
let discordStatus = 204;
const discord2Hits: any[] = [];
const discord2 = Bun.serve({
  port: 0,
  fetch: async (req) => (discord2Hits.push(await req.json()), new Response('x', { status: discordStatus })),
});

const booted: Subprocess[] = [];
function boot(port: number, staffUrl: string) {
  const proc = Bun.spawn([process.execPath, 'server.ts'], {
    cwd: import.meta.dir,
    env: {
      ...process.env,
      PORT: String(port),
      APPOINTMENT_WEBHOOK: `http://127.0.0.1:${discord2.port}/hook`,
      STAFF_BOOKING_URL: staffUrl,
      STAFF_BOOKING_SECRET: staffUrl ? SECRET : '',
    },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  booted.push(proc);
  return proc;
}
async function ready(port: number) {
  for (let i = 0; i < 50; i++) {
    if (await fetch(`http://127.0.0.1:${port}/api/appointment`, { signal: AbortSignal.timeout(500) }).then(() => true, () => false)) return;
    await Bun.sleep(100);
  }
}
const book = (port: number, extra = {}) =>
  fetch(`http://127.0.0.1:${port}/api/appointment`, {
    method: 'POST',
    body: JSON.stringify({ firstname: 'Somchai', lastname: 'Jai', phone: '081-234-5678', is_profile: 'yes', passport: 'ZZ-SECRET-1234', ...extra }),
  });
const reset = (status = 204) => (staffHits.length = discord2Hits.length = 0, (staffStatus = status), (staffDelay = 0), (discordStatus = 204));

test('without staff env nothing is forwarded', async () => {
  reset();
  const p = boot(3998, '');
  await ready(3998);
  expect((await book(3998)).status).toBe(200);
  await Bun.sleep(300);
  expect(discord2Hits.length).toBe(1);
  expect(staffHits.length).toBe(0);
  p.kill();
});

test('with staff env: one signed POST, Discord still notified', async () => {
  reset();
  const p = boot(3997, `http://127.0.0.1:${staff.port}/in`);
  await ready(3997);
  expect((await book(3997)).status).toBe(200);
  await Bun.sleep(500);
  expect(discord2Hits.length).toBe(1);
  expect(staffHits.length).toBe(1);
  const { headers, raw } = staffHits[0];
  const ts = headers.get('x-timestamp')!;
  expect(Math.abs(Date.now() / 1000 - Number(ts))).toBeLessThan(30);
  expect(headers.get('x-signature')).toBe('sha256=' + new Bun.CryptoHasher('sha256', SECRET).update(`${ts}.${raw}`).digest('hex'));
  const body = JSON.parse(raw);
  expect(body.booking_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  expect(body).toMatchObject({ firstname: 'Somchai', lastname: 'Jai', phone: '081-234-5678', is_profile: true, passport: 'ZZ-SECRET-1234' });
  p.kill();
});

test('staff 500 retries once with the same booking_id; user unaffected; no form values in logs', async () => {
  reset(500);
  const p = boot(3996, `http://127.0.0.1:${staff.port}/in`);
  await ready(3996);
  expect((await book(3996)).status).toBe(200);
  expect(discord2Hits.length).toBe(1);
  await Bun.sleep(2800);
  expect(staffHits.length).toBe(2);
  expect(JSON.parse(staffHits[1].raw).booking_id).toBe(JSON.parse(staffHits[0].raw).booking_id);
  expect((await book(3996)).status).toBe(200); // still alive
  p.kill();
  const out = (await new Response(p.stdout).text()) + (await new Response(p.stderr).text());
  expect(out).toContain('Staff booking failed 500');
  for (const v of ['ZZ-SECRET-1234', 'Somchai', '081-234-5678']) expect(out).not.toContain(v);
}, 10_000);

test('staff down: user still gets 200 and the server survives', async () => {
  reset();
  const p = boot(3995, 'http://127.0.0.1:1/in');
  await ready(3995);
  expect((await book(3995)).status).toBe(200);
  expect(discord2Hits.length).toBe(1);
  await Bun.sleep(300);
  expect((await book(3995)).status).toBe(200);
  p.kill();
});

test('staff slower than 5s: user gets 200 immediately and the server survives', async () => {
  reset();
  staffDelay = 6000;
  const p = boot(3994, `http://127.0.0.1:${staff.port}/in`);
  await ready(3994);
  const t = Date.now();
  expect((await book(3994)).status).toBe(200);
  expect(Date.now() - t).toBeLessThan(2000);
  expect(discord2Hits.length).toBe(1);
  expect((await book(3994)).status).toBe(200);
  p.kill();
});

test('Discord failure returns 502 and staff receives nothing', async () => {
  reset();
  discordStatus = 500;
  const p = boot(3992, `http://127.0.0.1:${staff.port}/in`);
  await ready(3992);
  expect((await book(3992)).status).toBe(502);
  await Bun.sleep(500);
  expect(staffHits.length).toBe(0);
  p.kill();
});

afterAll(() => {
  booted.forEach((p) => p.kill()); // also covers tests that failed before their own kill
  staff.stop(true);
  discord2.stop(true);
});
