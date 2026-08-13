// /api/blessing —— GET 列出祝福；POST 提交祝福。存入同一 KV（前缀 wish:，与 rsvp: 分开）
function json(o, s = 200) {
  return new Response(JSON.stringify(o), {
    status: s,
    headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    let d;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) d = await request.json();
    else d = Object.fromEntries(await request.formData());
    const text = (d.text || '').toString().replace(/\s+/g, ' ').trim().slice(0, 40);
    const name = (d.name || '').toString().replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!text) return json({ ok: false, error: 'empty' }, 400);
    const ts = new Date().toISOString();
    const key = 'wish:' + ts + ':' + Math.random().toString(36).slice(2, 7);
    await env.RSVP.put(key, JSON.stringify({ text, name, ts }));
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'server' }, 500);
  }
}

export async function onRequestGet({ env }) {
  const items = [];
  let cursor;
  do {
    const res = await env.RSVP.list({ prefix: 'wish:', cursor });
    for (const k of res.keys) {
      const v = await env.RSVP.get(k.name);
      if (v) { try { items.push(JSON.parse(v)); } catch (e) {} }
    }
    cursor = res.list_complete ? null : res.cursor;
  } while (cursor);
  items.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return json({ items: items.slice(0, 120).map(i => ({ text: i.text, name: i.name || '' })) });
}
