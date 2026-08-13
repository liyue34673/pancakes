// GET /api/rsvp-list?token=XXXX  —— 私密查看 RSVP 名单（仅凭令牌访问）
const ADMIN_TOKEN = 'hyui--TRM70TP6Aa0';

function esc(s) {
  return (s || '').toString().replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== ADMIN_TOKEN) {
    return new Response('unauthorized', { status: 401 });
  }

  const items = [];
  let cursor;
  do {
    const res = await env.RSVP.list({ prefix: 'rsvp:', cursor });
    for (const k of res.keys) {
      const v = await env.RSVP.get(k.name);
      if (v) { try { items.push(JSON.parse(v)); } catch (e) {} }
    }
    cursor = res.list_complete ? null : res.cursor;
  } while (cursor);

  items.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  const totalPeople = items.reduce((s, i) => s + (parseInt(i.count) || 0), 0);

  // CSV 下载
  if (url.searchParams.get('format') === 'csv') {
    const rows = [['姓名', '人数', '时间']].concat(
      items.map(i => [i.name, i.count, i.ts])
    );
    const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    return new Response(csv, { headers: { 'content-type': 'text/csv;charset=utf-8', 'content-disposition': 'attachment; filename="rsvp.csv"' } });
  }

  const rows = items.map((i, idx) =>
    `<tr><td>${idx + 1}</td><td>${esc(i.name)}</td><td>${esc(i.count)}</td><td>${esc(new Date(i.ts).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))}</td></tr>`
  ).join('');

  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>RSVP 名单</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;max-width:780px;margin:22px auto;padding:0 14px;color:#333;background:#faf8f3}
h1{font-size:20px;margin:0 0 4px}.sum{color:#666;margin:6px 0 16px;font-size:14px}
table{border-collapse:collapse;width:100%;font-size:14px;background:#fff}
th,td{border:1px solid #e5ded0;padding:9px 11px;text-align:left}th{background:#f2ece0}
a.dl{display:inline-block;margin-left:12px;font-size:13px;color:#7a5c58}</style></head>
<body><h1>RSVP 名单</h1>
<div class="sum">共 ${items.length} 组 · 合计 ${totalPeople} 人<a class="dl" href="?token=${encodeURIComponent(ADMIN_TOKEN)}&format=csv">下载 CSV</a></div>
<table><thead><tr><th>#</th><th>姓名</th><th>人数</th><th>提交时间</th></tr></thead>
<tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#999">暂无提交</td></tr>'}</tbody></table>
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8', 'cache-control': 'no-store' } });
}
