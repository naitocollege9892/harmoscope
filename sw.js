/* HarmoScope（ハモスコープ）ネットなしで開ける仕組み（v148 改223）
   はじめて開いたときに、本体（index.html）・manifest・アイコンをこの端末に保存し、次からは保存した分を渡す。
   新しい版があるかどうかは本体（index.html）の側で確かめて、画面の下に知らせる。このファイルは版ごとに上げ直さなくてよい。 */
const CACHE='harmoscope-1';
const FILES=['./','./manifest.webmanifest','./icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE&&k.startsWith('harmoscope-'))await caches.delete(k);await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  if(r.mode!=='navigate'&&(r.cache==='no-store'||r.cache==='reload'))return; // 新しい版を取りに行くときはネットへ
  const u=new URL(r.url),scope=new URL(self.registration.scope);
  if(u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname))return;
  const rel=u.pathname.slice(scope.pathname.length);
  let key=null;
  if(rel===''||rel==='index.html')key='./'; // 本体だけ。同じ場所のほかのページ（accept-test.html など）はそのままネットから
  else if(rel==='manifest.webmanifest'||rel==='icon.png')key='./'+rel;
  if(!key)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(key);
    if(hit)return hit;
    try{const res=await fetch(new URL(key,scope).href);if(res.ok)c.put(key,res.clone());return res}
    catch(err){return Response.error()}
  })());
});
