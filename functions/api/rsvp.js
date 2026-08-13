// POST /api/rsvp  —— 接收来宾 RSVP，存入 KV
export async function onRequestPost({ request, env }) {
  const json = (o, s = 200) =>
    new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json;charset=utf-8' } });
  try {
    let d;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) d = await request.json();
    else d = Object.fromEntries(await request.formData());

    const name = (d.name || '').toString().trim().slice(0, 40);
    const count = parseInt(d.count, 10);

    if (!name) return json({ ok: false, error: 'name' }, 400);
    if (!(count >= 1 && count <= 30)) return json({ ok: false, error: 'count' }, 400);

    const ts = new Date().toISOString();
    const key = 'rsvp:' + ts + ':' + Math.random().toString(36).slice(2, 7);
    await env.RSVP.put(key, JSON.stringify({ name, count, ts }));
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'server' }, 500);
  }
}
