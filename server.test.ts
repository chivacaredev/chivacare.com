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

test('does not serve files outside dist', async () => {
  expect((await fetch(base + '/..%2fpackage.json')).status).toBe(404);
  expect((await fetch(base + '/%2e%2e/server.ts')).status).toBe(404);
});
