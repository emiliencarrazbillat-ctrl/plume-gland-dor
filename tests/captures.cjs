/* Captures de comparaison, toujours aux mêmes endroits et aux mêmes heures.
   Usage : node tests/captures.cjs <dossier servi> <dossier de sortie> [qualité 0-2]
   Le hasard est fixé et l'heure du jeu est imposée par le script, pour que deux versions soient comparables. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIR = path.resolve(process.argv[2] || 'dist'), OUT = path.resolve(process.argv[3] || 'captures'), Q = +(process.argv[4] ?? 2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm' };
const JOUR = 108, NUIT = 408, SOIR = 262;
const LIEUX = [
  ['village_jour', 0, 48, JOUR], ['village_nuit', 0, 48, NUIT], ['village_soir', 0, 48, SOIR], ['lac_jour', 30, 78, JOUR], ['lac_nuit', 30, 78, NUIT], ['depart_jour', -1, 59, JOUR],
  ['foret', -190, 8, JOUR], ['collines', -80, 214, JOUR], ['marais', 195, 112, JOUR], ['neige', -40, -200, JOUR], ['desert', 150, -110, JOUR], ['automne', 120, 306, JOUR],
  ['orages', -345, 222, JOUR], ['volcan', 295, -280, JOUR], ['molosse', 40, -320, JOUR], ['fort', 95, 26, JOUR], ['fort_nuit', 95, 26, NUIT], ['entree_donjon', 60, -2, JOUR],
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await new Promise(res => { const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIR, p); if (!f.startsWith(DIR) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(q => {
    let s = 12345; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    try { localStorage.setItem('plume_quality', String(q)); } catch (e) { }
  }, Q);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`); await p.waitForFunction(() => window.__dbg, null, { timeout: 120000 });
  const shot = async n => { await p.evaluate(() => __dbg.frame()); await p.screenshot({ path: path.join(OUT, n + '.png'), timeout: 180000 }); console.log('  ' + n); };
  await p.click('#bNew'); await p.click('#slots .sl[data-slot="1"]'); await p.waitForFunction(() => !!__dbg.DLG, null, { timeout: 30000 });
  for (let i = 0; i < 60 && !(await p.evaluate(() => __dbg.S.intro)); i++) { await p.evaluate(() => __dbg.DLG && __dbg.advDlg()); await p.waitForTimeout(150); }
  await p.evaluate(q => { __dbg.setQ(q); __dbg.S.hp = 114; }, Q);
  for (const [n, x, z, t] of LIEUX) {
    if (process.env.SEUL && !process.env.SEUL.split(',').includes(n)) continue;
    await p.evaluate(([x, z, t, court]) => { for (const e of __dbg.ENT) { e.x += 0; } const w = __dbg.nearWalk(x, z); __dbg.P.x = w[0]; __dbg.P.z = w[1]; __dbg.S.time = t; __dbg.S.hp = 9999; __dbg.adv(court ? .35 : 4); __dbg.S.time = t; __dbg.adv(.1); }, [x, z, t, n.startsWith('fort')]);
    await shot(n);
  }
  if (!process.env.SEUL || process.env.SEUL.split(',').includes('donjon')) {
    await p.evaluate(() => { __dbg.S.time = 108; __dbg.enterDungeon('d1'); }); await p.waitForFunction(() => __dbg.area === 'd1', null, { timeout: 30000 }); await p.evaluate(() => __dbg.adv(1)); await shot('donjon'); await p.evaluate(() => { __dbg.P.z = -30; __dbg.adv(2); }); await shot('donjon_2');
    await p.evaluate(() => __dbg.leaveDungeon()); await p.waitForFunction(() => __dbg.area === 'world', null, { timeout: 30000 });
    await p.evaluate(() => { const w = __dbg.nearWalk(0, 48); __dbg.P.x = w[0]; __dbg.P.z = w[1]; __dbg.S.time = 108; __dbg.adv(1); __dbg.toggleMenu(); }); await p.waitForTimeout(300); await shot('menu');
    const info = await p.evaluate(() => { __dbg.toggleMenu(); __dbg.adv(.1); const i = __dbg.renderer.info; i.autoReset = false; i.reset(); __dbg.frame(); i.autoReset = true; return { appels: i.render.calls, triangles: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries }; });
    fs.writeFileSync(path.join(OUT, 'mesures.json'), JSON.stringify(info)); console.log('  mesures village :', JSON.stringify(info));
  }
  console.log(errs.length ? 'ERREURS : ' + errs.join(' | ') : 'aucune erreur');
  await b.close(); srv.close();
})().catch(e => { console.error('ECHEC', e.message); process.exit(1); });
