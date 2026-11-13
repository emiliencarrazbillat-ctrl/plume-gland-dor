/* Captures de l'interface : écran titre, emplacements, HUD, dialogue, chaque onglet du menu, et un téléphone.
   Usage : node tests/captures_ui.cjs <dossier servi> <dossier de sortie> */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIR = path.resolve(process.argv[2] || 'dist'), OUT = path.resolve(process.argv[3] || 'captures/ui');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await new Promise(res => { const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIR, p); if (!f.startsWith(DIR) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, '127.0.0.1', () => res(s)); });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const serie = async (nom, opts) => {
    const ctx = await b.newContext(opts); await ctx.addInitScript(() => { try { localStorage.setItem('plume_quality', '0'); } catch (e) { } });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const shot = async n => { await p.screenshot({ path: path.join(OUT, nom + '_' + n + '.png'), timeout: 180000 }); console.log('  ' + nom + '_' + n); };
    await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { timeout: 180000 }); await p.waitForFunction(() => window.__dbg && __dbg.state === 'title', null, { timeout: 120000 }); await p.waitForTimeout(1500);
    await shot('1_titre'); await p.click('#bNew'); await p.waitForTimeout(400); await shot('2_emplacements');
    await p.click('#slots .sl[data-slot="1"]'); await p.waitForFunction(() => !!__dbg.DLG, null, { timeout: 60000 }); await p.waitForTimeout(600); await shot('3_dialogue');
    for (let i = 0; i < 60 && !(await p.evaluate(() => __dbg.S.intro)); i++) { await p.evaluate(() => __dbg.DLG && __dbg.advDlg()); await p.waitForTimeout(150); }
    await p.evaluate(() => { const d = __dbg; d.S.gold = 1250; d.S.mat = 40; d.S.sp = [1, 1, 1, 0, 0, 0, 0]; d.S.mp = 62; d.S.hp = 80; d.S.xp = 30; d.adv(1); d.startQuest(d.QBY.m1); d.adv(.5); });
    await p.waitForTimeout(2500); await shot('4_hud');
    for (const [t, n] of [['q', 'quetes'], ['m', 'carte'], ['e', 'equipement'], ['a', 'armee'], ['v', 'village'], ['c', 'clans'], ['h', 'options'], ['p', 'manette']]) {
      await p.evaluate(t => { if (document.getElementById('menu').style.display === 'none' || !document.getElementById('menu').style.display) __dbg.toggleMenu(); __dbg.setTab(t); }, t); await p.waitForTimeout(500); await shot('5_menu_' + n);
    }
    if (errs.length) console.log('ERREURS', errs.join(' | ')); await ctx.close();
  };
  const seul = process.env.SEUL;
  if (!seul || seul === 'ordi') await serie('ordi', { viewport: { width: 1280, height: 720 } });
  if (!seul || seul === 'tel') await serie('tel', { viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  if (!seul || seul === 'telp') await serie('telp', { viewport: { width: 780, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await b.close(); srv.close();
})().catch(e => { console.error('ECHEC', e.message); process.exit(1); });
