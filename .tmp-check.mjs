// read-only: what is the owner record's currentKey right now, and which pointers exist?
import { list, get } from '@vercel/blob';
const readJson = async p => { const r = await get(p, { access: 'private', useCache: false }); return r?.stream ? new Response(r.stream).json() : null; };
const SHOP = '82ebcd8e73ff82f9c96da597cfb81bf3f3facf9c';
const own = await readJson(`owners/${SHOP}.json`);
console.log('currentKey:', own?.currentKey);
const keys = (await list({ prefix: 'keys/' })).blobs;
console.log('pointer count:', keys.length);
for (const k of keys) {
  const ptr = await readJson(k.pathname).catch(() => null);
  if (ptr?.shopId === SHOP) console.log('pointer→his shop:', k.pathname.slice(5, 13) + '…', 'created', new Date(ptr.created).toISOString());
}
