/* Filet de sécurité : tests automatiques du jeu (Playwright).
   Usage :  node tests/filet.cjs [dossier à servir]      (par défaut : dist/ s'il existe, sinon la racine)
            GEN_REF=1 node tests/filet.cjs .             (ré)enregistre l'empreinte de référence — à ne faire que sur le jeu d'origine
            SEUL=nage,vol node tests/filet.cjs           ne lance que certains tests
   Le rendu logiciel étant lent, les tests font avancer la simulation eux-mêmes via window.__dbg.adv(). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.resolve(process.argv[2] || (fs.existsSync(path.join(ROOT, 'dist/index.html')) ? path.join(ROOT, 'dist') : ROOT));
const REF = path.join(__dirname, 'reference.json'), FIX = path.join(__dirname, 'fixtures', 'sauvegarde_origine.json');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(DIR, p);
      if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, '127.0.0.1', () => res(s));
  });
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const near = (a, b, e, m) => assert(Math.abs(a - b) <= e, `${m} (attendu ≈${b}, obtenu ${a})`);

let browser, URL0;
async function ouvrir(opts = {}, init) {
  const ctx = await browser.newContext({ viewport: { width: 480, height: 270 }, ...opts });
  await ctx.addInitScript(() => { try { if (localStorage.getItem('plume_quality') === null) localStorage.setItem('plume_quality', '0'); } catch (e) { } });
  if (init) await ctx.addInitScript(init);
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push('erreur page : ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.errs.push('console : ' + m.text()); });
  await charger(p); return p;
}
async function charger(p) { await p.goto(URL0, { timeout: 180000 }); await p.waitForFunction(() => window.__dbg && __dbg.state === 'title' && document.getElementById('title').style.display === 'flex', null, { timeout: 120000 }); }
async function passerDialogues(p, max = 40) {
  for (let i = 0; i < max; i++) { const d = await p.evaluate(() => { if (__dbg.DLG) { __dbg.advDlg(); return true; } return false; }); await p.waitForTimeout(d ? 120 : 250); if (!d && i > 2) break; }
}
async function nouvellePartie(p, slot = 1) {
  await p.click('#bNew'); await p.click(`#slots .sl[data-slot="${slot}"]`);
  await p.waitForFunction(() => __dbg.state === 'play', null, { timeout: 60000 });
  await p.waitForFunction(() => !!__dbg.DLG, null, { timeout: 30000 });      // l'introduction
  for (let i = 0; i < 60 && !(await p.evaluate(() => __dbg.S.intro)); i++) { await p.evaluate(() => __dbg.DLG && __dbg.advDlg()); await p.waitForTimeout(150); }
  assert(await p.evaluate(() => __dbg.S.intro === 1), "l'introduction ne se termine pas");
}
const placer = (p, x, z) => p.evaluate(([x, z]) => { __dbg.P.x = x; __dbg.P.z = z; __dbg.adv(.2); }, [x, z]);
async function parlerA(p, id) {
  await p.evaluate(id => { const n = __dbg.NPCS.find(n => n.id === id); __dbg.P.x = n.x; __dbg.P.z = n.z + 3; __dbg.adv(.3); }, id);
  await p.keyboard.press('Space'); await p.waitForFunction(() => !!__dbg.DLG, null, { timeout: 20000 });
}
async function queteM1Debut(p) { await parlerA(p, 'cacarde'); await passerDialogues(p); await p.waitForFunction(() => __dbg.S.q && __dbg.S.q.id === 'm1', null, { timeout: 20000 }); await placer(p, 20, 11); await p.evaluate(() => __dbg.adv(1)); }
const brigands = p => p.evaluate(() => __dbg.ENT.filter(e => !e.dead && e.hp > 0 && e.kind === 'brigand' && Math.hypot(e.x - 20, e.z - 5) < 25).map(e => ({ x: e.x, z: e.z, hp: e.hp })));

/* Empreinte de tout ce qui ne doit pas changer : relief, zones praticables, positions, textes, équilibrage, caméra. */
const empreinte = () => {
  const d = __dbg, h32 = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  let hs = '', n = 0, w = ''; for (let x = -680; x <= 680; x += 20) for (let z = -680; z <= 680; z += 20) hs += d.height(x, z).toFixed(3) + ',';
  for (let x = -684; x <= 684; x += 6) for (let z = -684; z <= 684; z += 6) { const k = d.walkable(x, z) ? 1 : 0; n += k; w += k; }
  const bi = []; for (let x = -680; x <= 680; x += 40) for (let z = -680; z <= 680; z += 40) bi.push(d.biome(x, z));
  const P = d.P, c = d.cam.position, gy = Math.max(0, d.height(P.x, P.z));
  return {
    relief: h32(hs), praticable: h32(w), casesPraticables: n, biomes: h32(bi.join()), obstacles: d.COL.length + ':' + h32(d.COL.map(c => [c.x.toFixed(2), c.z.toFixed(2), c.r.toFixed(2)].join()).join(';')),
    quetes: d.QL.length, textesQuetes: h32(JSON.stringify(d.QL)), pnj: d.NPCS.length, pnjPositions: h32(d.NPCS.map(n => [n.id, n.name, n.role, n.x.toFixed(2), n.z.toFixed(2)].join()).join(';')),
    villages: h32(JSON.stringify(d.VIL)), forts: h32(JSON.stringify(d.FORT)), donjons: h32(JSON.stringify(d.DUN)), ennemis: h32(JSON.stringify(d.ET)), zonesEnnemis: d.SPAWNS.length,
    statsDepart: JSON.stringify(d.stats()), camera: [c.x - P.x, c.y - gy, c.z - P.z].map(v => +v.toFixed(2)).join(), champ: d.cam.fov,
  };
};

const TESTS = {
  async chargement() {
    const p = await ouvrir(); await p.waitForTimeout(1500);
    assert(p.errs.length === 0, 'erreurs au chargement : ' + p.errs.join(' | '));
    assert(await p.evaluate(() => document.querySelector('#title h1').innerText.includes('Plume')), 'écran titre absent');
    assert(await p.evaluate(() => __dbg.renderer.info.render.triangles > 1000), 'rien ne se dessine');
    return p;
  },
  async quetes_285_valides() {
    const p = await ouvrir();
    const r = await p.evaluate(() => {
      const d = __dbg, ids = new Set(d.QL.map(q => q.id)), npc = new Set(d.NPCS.map(n => n.id)), bad = [];
      const kinds = ks => ks.every(k => d.ET[k[0]]);
      for (const q of d.QL) {
        if (!npc.has(q.g)) bad.push(q.id + ' : donneur inconnu ' + q.g);
        if (q.pre != null && !ids.has(q.pre)) bad.push(q.id + ' : prérequis inconnu ' + q.pre);
        if (!q.n || !q.i || !q.i.length || !q.e || !q.s || !q.s.length) bad.push(q.id + ' : textes ou étapes manquants');
        for (const s of q.s || []) {
          const t = s[0], xz = (x, z) => Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) < 690 && Math.abs(z) < 690; let ok = true;
          if (t === 'spawn') ok = xz(s[1], s[2]) && kinds(s[3]);
          else if (t === 'dungeon') ok = !!d.DUN[s[1]];
          else if (t === 'talk' || t === 'choice') ok = npc.has(s[1]);
          else if (['collect', 'goto', 'fish', 'chase', 'tcollect', 'simon', 'defend'].includes(t)) ok = xz(s[1], s[2]) && (t !== 'defend' || s[4].every(kinds));
          else if (t === 'race') ok = s[1].every(c => xz(c[0], c[1]));
          else if (t === 'puzzle') ok = !!d.PUZ[s[1]];
          else if (t === 'event') ok = !!d.EVENTS[s[1]];
          else if (t === 'kills') ok = !!d.ET[s[1]] && s[2] > 0;
          else if (t === 'cond' || t === 'ask') ok = true;
          else ok = false;
          if (!ok) bad.push(q.id + ' : cible invalide ' + JSON.stringify(s).slice(0, 80));
        }
      }
      return { n: d.QL.length, principales: d.QL.filter(q => q.m).length, bad };
    });
    assert(r.n === 285, 'nombre de quêtes : ' + r.n); assert(r.principales === 27, 'quêtes principales : ' + r.principales);
    assert(r.bad.length === 0, r.bad.slice(0, 8).join(' | ')); return p;
  },
  async rien_ne_change_dans_les_regles() {
    const p = await ouvrir(); await nouvellePartie(p); await p.evaluate(() => { __dbg.P.x = -30; __dbg.P.z = 70; __dbg.adv(3); if (__dbg.pnjMaison) __dbg.pnjMaison(); });
    const e = await p.evaluate(empreinte);
    if (process.env.GEN_REF) { fs.writeFileSync(REF, JSON.stringify(e, null, 1)); console.log('   (référence enregistrée)'); return p; }
    const ref = JSON.parse(fs.readFileSync(REF, 'utf8')), diff = Object.keys(ref).filter(k => String(ref[k]) !== String(e[k]));
    assert(diff.length === 0, 'différences avec le jeu d\'origine : ' + diff.map(k => `${k} (${ref[k]} → ${e[k]})`).join(' ; ')); return p;
  },
  async nouvelle_partie() {
    const p = await ouvrir(); await nouvellePartie(p);
    const r = await p.evaluate(() => ({ hud: getComputedStyle(document.getElementById('hud')).display, titre: document.getElementById('title').style.display, lvl: __dbg.S.lvl, zone: document.getElementById('zone').innerText, sorts: document.querySelectorAll('#spells .sp').length }));
    assert(r.hud === 'block' && r.titre === 'none', 'HUD ou titre mal affiché'); assert(r.lvl === 1, 'niveau de départ'); assert(r.sorts === 7, 'barre de sorts : ' + r.sorts);
    await p.evaluate(() => __dbg.adv(.5)); assert((await p.evaluate(() => document.getElementById('zone').innerText)).includes('Cancan'), 'nom de zone absent');
    assert(p.errs.length === 0, p.errs.join(' | ')); return p;
  },
  async deplacement_clavier() {
    const p = await ouvrir(); await nouvellePartie(p); await placer(p, -30, 70);
    for (const [k, ax, s] of [['KeyW', 'z', -1], ['KeyS', 'z', 1], ['KeyA', 'x', -1], ['KeyD', 'x', 1], ['ArrowUp', 'z', -1], ['ArrowRight', 'x', 1]]) {
      const a = await p.evaluate(() => [__dbg.P.x, __dbg.P.z]); await p.keyboard.down(k); await p.evaluate(() => __dbg.adv(.5)); await p.keyboard.up(k);
      const b = await p.evaluate(() => [__dbg.P.x, __dbg.P.z]), d = ax === 'x' ? b[0] - a[0] : b[1] - a[1];
      assert(d * s > 1.5, `touche ${k} : déplacement ${d.toFixed(2)}`);
    }
    // un obstacle (maison) arrête Plume
    const r = await p.evaluate(() => { const c = __dbg.COL.find(c => c.r > 2.5 && __dbg.walkable(c.x, c.z + c.r + 3)); __dbg.P.x = c.x; __dbg.P.z = c.z + c.r + 3; __dbg.keys.KeyW = true; __dbg.adv(3); __dbg.keys.KeyW = false; return { ok: __dbg.walkable(__dbg.P.x, __dbg.P.z, .5), d: Math.hypot(__dbg.P.x - c.x, __dbg.P.z - c.z), r: c.r }; });
    assert(r.d >= r.r, 'Plume traverse un obstacle'); return p;
  },
  async dialogue_et_quete() {
    const p = await ouvrir(); await nouvellePartie(p); await parlerA(p, 'cacarde');
    assert((await p.evaluate(() => document.getElementById('dname').innerText)).includes('Cacarde'), 'nom du PNJ absent du dialogue');
    assert((await p.evaluate(() => document.getElementById('dtext').innerText)).startsWith('Plume ! Te voilà debout'), 'texte du dialogue modifié');
    await passerDialogues(p); await p.waitForFunction(() => __dbg.S.q && __dbg.S.q.id === 'm1'); await p.evaluate(() => __dbg.adv(.2));
    assert((await p.evaluate(() => document.getElementById('qt').innerText)).includes('Le réveil de Plume'), 'suivi de quête absent');
    await placer(p, 20, 11); for (let i = 0; i < 10 && (await brigands(p)).length < 3; i++) await p.evaluate(() => { __dbg.S.hp = 114; __dbg.adv(.5); });
    assert((await brigands(p)).length >= 3, 'les 3 brigands de la quête ne sont pas apparus (' + (await brigands(p)).length + ')');   // un brigand de passage peut s'y ajouter
    for (let i = 0; i < 80 && (await brigands(p)).length; i++) await p.evaluate(() => { const e = __dbg.ENT.find(e => !e.dead && e.hp > 0 && e.kind === 'brigand' && Math.hypot(e.x - 20, e.z - 5) < 25); if (!e) return; __dbg.P.x = e.x; __dbg.P.z = e.z + 2.2; __dbg.S.hp = 114; __dbg.attack(); __dbg.adv(.45); });
    await p.evaluate(() => __dbg.adv(1)); assert(await p.evaluate(() => __dbg.S.q && __dbg.S.q.step === 1), "l'étape de combat ne se valide pas");
    await parlerA(p, 'cacarde'); await passerDialogues(p); await p.waitForFunction(() => __dbg.S.qd.m1 === 1, null, { timeout: 20000 });
    const r = await p.evaluate(() => ({ inv: __dbg.S.inv, xp: __dbg.S.xp + __dbg.S.lvl * 1000, q: __dbg.S.q })); assert(r.inv.roseau === 1, 'récompense (épée de roseau) non reçue'); assert(r.q === null, 'quête toujours en cours');
    assert(p.errs.length === 0, p.errs.join(' | ')); return p;
  },
  async attaque() {
    const p = await ouvrir(); await nouvellePartie(p); await queteM1Debut(p);
    const e0 = (await brigands(p))[0]; await p.evaluate(e => { __dbg.P.x = e.x; __dbg.P.z = e.z + 2.2; __dbg.P.ang = Math.PI; __dbg.adv(.05); }, e0);
    const hp0 = (await p.evaluate(() => __dbg.ENT.filter(e => e.kind === 'brigand' && Math.hypot(e.x - 20, e.z - 5) < 25).reduce((s, e) => s + Math.max(0, e.hp), 0)));
    await p.keyboard.press('Space'); await p.evaluate(() => __dbg.adv(.5));
    const hp1 = (await p.evaluate(() => __dbg.ENT.filter(e => !e.dead && e.kind === 'brigand' && Math.hypot(e.x - 20, e.z - 5) < 25).reduce((s, e) => s + Math.max(0, e.hp), 0)));
    assert(hp1 < hp0, `le coup (Espace) ne blesse pas : ${hp0} → ${hp1}`);
    // les ennemis ripostent, et la roulade se déclenche
    const pv0 = await p.evaluate(() => __dbg.S.hp); await p.evaluate(() => __dbg.adv(6)); assert(await p.evaluate(() => __dbg.S.hp) < pv0, 'les ennemis ne blessent pas Plume');
    await p.keyboard.press('ShiftLeft'); assert(await p.evaluate(() => __dbg.P.roll > 0 || __dbg.P.rollCd > 0), 'la roulade (Maj) ne part pas'); return p;
  },
  async sort() {
    const p = await ouvrir(); await nouvellePartie(p); await queteM1Debut(p);
    const e0 = (await brigands(p))[0]; await p.evaluate(e => { __dbg.S.sp[0] = 1; __dbg.P.x = e.x; __dbg.P.z = e.z + 5; __dbg.P.ang = Math.PI; __dbg.adv(.05); }, e0);
    const somme = () => p.evaluate(() => ({ mp: __dbg.S.mp, hp: __dbg.ENT.filter(e => !e.dead && e.kind === 'brigand' && Math.hypot(e.x - 20, e.z - 5) < 25).reduce((s, e) => s + Math.max(0, e.hp), 0) }));
    const a = await somme();
    await p.keyboard.press('Digit1'); await p.evaluate(() => __dbg.adv(1.5));
    const b = await somme();
    assert(b.mp < a.mp - 20, `le sort ne coûte pas de magie : ${a.mp} → ${b.mp}`); assert(b.hp < a.hp, `le sort ne blesse pas : ${a.hp} → ${b.hp}`); return p;
  },
  async nage() {
    const p = await ouvrir(); await nouvellePartie(p);
    assert(await p.evaluate(() => __dbg.height(45, 95) < 0 && !__dbg.walkable(45, 95)), "l'eau devrait être infranchissable sans savoir nager");
    const rive = await p.evaluate(() => { let x = 31; while (!__dbg.walkable(x, 80, 1.5)) x--; return x - 2; });
    await placer(p, rive, 80); await p.evaluate(() => { __dbg.keys.KeyD = true; __dbg.adv(3); __dbg.keys.KeyD = false; });
    assert(await p.evaluate(() => __dbg.height(__dbg.P.x, __dbg.P.z) >= .3), 'Plume entre dans l\'eau sans savoir nager');
    await p.evaluate(() => { __dbg.S.ab.swim = 1; __dbg.keys.KeyD = true; __dbg.adv(3); __dbg.keys.KeyD = false; });
    const r = await p.evaluate(() => ({ h: __dbg.height(__dbg.P.x, __dbg.P.z), y: __dbg.P.g.position.y })); assert(r.h < 0, 'Plume ne nage pas (hauteur du fond ' + r.h.toFixed(2) + ')'); return p;
  },
  async vol() {
    const p = await ouvrir(); await nouvellePartie(p); await placer(p, -30, 70);
    await p.keyboard.press('KeyV'); await p.evaluate(() => __dbg.adv(1)); assert(await p.evaluate(() => !__dbg.P.fly), 'Plume vole sans avoir appris');
    await p.evaluate(() => { __dbg.S.ab.fly = 1; }); await p.keyboard.press('KeyV'); await p.evaluate(() => __dbg.adv(3));
    const a = await p.evaluate(() => ({ fly: !!__dbg.P.fly, y: __dbg.P.g.position.y, sol: __dbg.height(__dbg.P.x, __dbg.P.z) })); assert(a.fly && a.y > a.sol + 4, 'Plume ne décolle pas (altitude ' + a.y.toFixed(1) + ')');
    await p.evaluate(() => { __dbg.keys.KeyD = true; __dbg.adv(6); __dbg.keys.KeyD = false; }); // survole le lac
    await placer(p, -30, 70); await p.keyboard.press('KeyV'); await p.evaluate(() => __dbg.adv(3));
    const b = await p.evaluate(() => ({ fly: !!__dbg.P.fly, y: __dbg.P.g.position.y, sol: __dbg.height(__dbg.P.x, __dbg.P.z) })); assert(!b.fly && b.y < b.sol + 1.5, 'Plume ne se repose pas'); return p;
  },
  async donjon() {
    const p = await ouvrir(); await nouvellePartie(p);
    await p.evaluate(() => __dbg.enterDungeon('d1')); await p.waitForFunction(() => __dbg.area === 'd1', null, { timeout: 120000 }); await p.evaluate(() => { __dbg.adv(1); __dbg.frame(); });
    const r = await p.evaluate(() => ({ mobs: __dbg.ENT.filter(e => !e.dead).length, ok: __dbg.walkable(__dbg.P.x, __dbg.P.z), mur: __dbg.walkable(25, 0), zone: document.getElementById('zone').innerText }));
    assert(r.mobs >= 7, 'ennemis du donjon : ' + r.mobs); assert(r.ok && !r.mur, 'collisions du donjon'); assert(r.zone.includes('Terrier des Brigands'), 'nom du donjon : ' + r.zone);
    await p.evaluate(() => __dbg.leaveDungeon()); await p.waitForFunction(() => __dbg.area === 'world', null, { timeout: 120000 }); await p.evaluate(() => __dbg.adv(.5));
    assert(await p.evaluate(() => __dbg.walkable(__dbg.P.x, __dbg.P.z)), 'sortie de donjon hors zone praticable'); assert(p.errs.length === 0, p.errs.join(' | ')); return p;
  },
  async construction() {
    const p = await ouvrir(); await nouvellePartie(p);
    assert(await p.evaluate(() => __dbg.vCan('mairie') !== ''), 'la mairie ne devrait pas être constructible au départ');
    await p.evaluate(() => { __dbg.S.lvl = 3; __dbg.S.gold = 5000; __dbg.S.mat = 500; });
    assert(await p.evaluate(() => __dbg.vCan('mairie') === ''), 'mairie non constructible : ' + await p.evaluate(() => __dbg.vCan('mairie')));
    await p.evaluate(() => { __dbg.vBuild('mairie'); __dbg.adv(.5); __dbg.frame(); });
    const r = await p.evaluate(() => ({ b: __dbg.S.vil.b.mairie, g: __dbg.S.gold, m: __dbg.S.mat })); assert(r.b === 1 && r.g < 5000 && r.m < 500, 'construction non prise en compte');
    await p.keyboard.press('KeyB'); await p.waitForTimeout(300); assert(await p.evaluate(() => document.getElementById('menu').style.display !== 'none' && document.getElementById('mbody').innerText.length > 50), 'le menu Village (B) ne s\'ouvre pas');
    assert(p.errs.length === 0, p.errs.join(' | ')); return p;
  },
  async sauvegarde_et_emplacements() {
    const p = await ouvrir(); await nouvellePartie(p, 1);
    await p.evaluate(() => { __dbg.S.gold = 1234; __dbg.S.lvl = 4; __dbg.P.x = 12; __dbg.P.z = 62; __dbg.adv(.2); __dbg.save(); });
    assert(await p.evaluate(() => JSON.parse(localStorage.getItem('plume_gland_s1')).gold === 1234 && localStorage.getItem('plume_slot') === '1'), 'sauvegarde non écrite');
    await charger(p); assert(await p.evaluate(() => document.getElementById('bCont').style.display !== 'none'), 'bouton Continuer absent');
    await p.click('#bCont'); await p.click('#slots .sl[data-slot="1"]'); await p.waitForFunction(() => __dbg.state === 'play');
    const r = await p.evaluate(() => ({ g: __dbg.S.gold, l: __dbg.S.lvl, x: __dbg.P.x, z: __dbg.P.z })); assert(r.g === 1234 && r.l === 4, 'partie mal rechargée'); near(r.x, 12, 2, 'position x'); near(r.z, 62, 2, 'position z');
    // deuxième emplacement, indépendant du premier
    await p.evaluate(() => __dbg.toTitle()); await p.waitForFunction(() => __dbg.state === 'title'); await p.evaluate(() => { const b = document.getElementById('slBack'); if (b) b.click(); });
    await nouvellePartie(p, 2); await p.evaluate(() => { __dbg.S.gold = 77; __dbg.save(); });
    const s = await p.evaluate(() => ({ a: JSON.parse(localStorage.getItem('plume_gland_s1')).gold, b: JSON.parse(localStorage.getItem('plume_gland_s2')).gold, slot: localStorage.getItem('plume_slot'), cur: __dbg.CURSLOT }));
    assert(s.a === 1234 && s.b === 77 && s.slot === '2' && s.cur === 2, 'emplacements mélangés : ' + JSON.stringify(s));
    if (process.env.GEN_REF) { fs.mkdirSync(path.dirname(FIX), { recursive: true }); fs.writeFileSync(FIX, await p.evaluate(() => localStorage.getItem('plume_gland_s1'))); }
    return p;
  },
  async anciennes_sauvegardes() {
    const fixture = fs.readFileSync(FIX, 'utf8');
    const p = await ouvrir({}, `try{if(!localStorage.getItem('plume_gland_s1')){localStorage.setItem('plume_gland_s1',${JSON.stringify(fixture)});localStorage.setItem('plume_slot','1');}}catch(e){}`);
    await charger(p); await p.click('#bCont'); await p.click('#slots .sl[data-slot="1"]'); await p.waitForFunction(() => __dbg.state === 'play');
    const a = JSON.parse(fixture), r = await p.evaluate(() => { __dbg.adv(.5); __dbg.save(); return JSON.parse(localStorage.getItem('plume_gland_s1')); });
    for (const k of Object.keys(a)) assert(k in r, 'champ de sauvegarde perdu : ' + k); assert(r.gold === a.gold && r.lvl === a.lvl, 'sauvegarde d\'origine mal relue'); assert(p.errs.length === 0, p.errs.join(' | ')); return p;
  },
  async villageois_vivants() {
    const p = await ouvrir(); await nouvellePartie(p); await placer(p, -30, 70);
    // de jour : ils se promènent, sans s'éloigner ni traverser d'obstacle, et ceux qui ont une quête restent dehors
    const a = await p.evaluate(() => { const d = __dbg; d.S.time = 108; let maxEcart = 0, horsSol = 0, bouges = 0, marqueDedans = 0; const loin = {}; const vus = new Set();
      for (let i = 0; i < 240; i++) { d.adv(.5); d.S.time = 108; for (const n of d.PNJV.liste) { const e = Math.hypot(n.x - n.hx, n.z - n.hz); if (n.vie.etat === 'pause' && e <= 4.8) maxEcart = Math.max(maxEcart, e); if (n.vie.etat === 'pause' && e > 4.8) loin[n.id] = (loin[n.id] || 0) + 1; if (e > .5) vus.add(n.id); if (n.vie.etat === 'dedans' && n.markT) marqueDedans++;
          if (n.vie.etat === 'marche') { const cx = n.col.x; n.col.x = 1e7; if (!d.walkable(n.x, n.z, .5)) horsSol++; n.col.x = cx; } } }
      return { coince: Math.max(0, ...Object.values(loin)), n: d.PNJV.liste.length, bouges: vus.size, maxEcart, horsSol, marqueDedans, cacarde: d.NPCS.find(n => n.id === 'cacarde').vie.etat }; });
    assert(a.n >= 60, 'villageois suivis : ' + a.n); assert(a.bouges >= 4, 'presque personne ne bouge : ' + a.bouges); assert(a.maxEcart <= 4.6, 'un villageois s\'éloigne trop : ' + a.maxEcart.toFixed(1));
    assert(a.horsSol === 0, 'un villageois traverse un obstacle'); assert(a.coince < 60, 'un villageois reste coincé loin de sa place'); assert(a.marqueDedans === 0, 'un donneur de quête est rentré chez lui'); assert(a.cacarde !== 'dedans' && a.cacarde !== 'entre', 'la Doyenne (quête principale) est rentrée');
    // on peut toujours parler au donneur de la quête principale et lancer la quête
    await parlerA(p, 'cacarde'); await passerDialogues(p); await p.waitForFunction(() => __dbg.S.q && __dbg.S.q.id === 'm1', null, { timeout: 20000 });
    // de nuit : certains rentrent ; en approchant de la porte, le villageois ressort et on peut lui parler
    const b = await p.evaluate(() => { const d = __dbg; d.P.x = -30; d.P.z = 70; for (let i = 0; i < 200; i++) { d.S.time = 408; d.adv(.5); } const L = d.PNJV.liste.filter(n => n.vie.etat === 'dedans' && Math.hypot(n.hx, n.hz - 40) < 40); return { dedans: L.length, id: L[0] && L[0].id, visible: L[0] && L[0].g.visible }; });
    assert(b.dedans >= 1, 'personne ne rentre chez soi la nuit'); assert(b.visible === false, 'villageois rentré mais encore visible');
    const c = await p.evaluate(id => { const d = __dbg, n = d.NPCS.find(n => n.id === id); const w = d.nearWalk(n.x, n.z + 3); d.P.x = w[0]; d.P.z = w[1]; for (let i = 0; i < 6; i++) { d.S.time = 408; d.adv(.3); } return { etat: n.vie.etat, visible: n.g.visible, dist: Math.hypot(d.P.x - n.x, d.P.z - n.z) }; }, b.id);
    assert(c.visible && c.etat !== 'dedans', 'le villageois ne ressort pas quand Plume approche (' + c.etat + ')'); assert(c.dist < 5.5, 'villageois ressorti hors de portée : ' + c.dist.toFixed(1));
    // et tout le monde retrouve exactement sa place d'origine sur demande
    assert(await p.evaluate(() => { __dbg.pnjMaison(); return __dbg.PNJV.liste.every(n => n.x === n.hx && n.z === n.hz && n.col.x === n.hx && n.col.r === 1.1 && n.g.visible); }), 'retour à la place d\'origine incomplet');
    assert(p.errs.length === 0, p.errs.join(' | ')); return p;
  },
  async manette() {
    const p = await ouvrir({}, () => { const b = () => Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })); window.__pad = { connected: true, index: 0, id: 'test', mapping: 'standard', axes: [0, 0, 0, 0], buttons: b() }; navigator.getGamepads = () => [window.__pad]; });
    await nouvellePartie(p); await placer(p, -30, 70);
    await p.evaluate(() => { __pad.axes = [1, 0, 0, 0]; }); await p.waitForFunction(() => __dbg.PADV.on && __dbg.PADV.x > .5, null, { timeout: 30000 });
    const x0 = await p.evaluate(() => __dbg.P.x); await p.evaluate(() => __dbg.adv(.6)); assert(await p.evaluate(() => __dbg.P.x) > x0 + 1.5, 'le stick ne déplace pas Plume');
    await p.evaluate(() => { __pad.axes = [0, 0, 0, 0]; }); await p.waitForFunction(() => !__dbg.PADV.on || Math.abs(__dbg.PADV.x) < .2, null, { timeout: 60000 });
    await p.evaluate(() => { __pad.buttons[1] = { pressed: true, value: 1 }; }); await p.waitForFunction(() => __dbg.P.roll > 0 || __dbg.P.rollCd > 0, null, { timeout: 30000 }).catch(() => { throw new Error('bouton B : pas de roulade'); });
    await p.evaluate(() => { __pad.buttons[1] = { pressed: false, value: 0 }; __pad.buttons[9] = { pressed: true, value: 1 }; });
    await p.waitForFunction(() => document.getElementById('menu').style.display !== 'none' && document.getElementById('menu').style.display !== '', null, { timeout: 30000 }).catch(() => { throw new Error('bouton Start : pas de menu'); });
    return p;
  },
  async tactile_et_menus() {
    const p = await ouvrir({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 780 } }); await nouvellePartie(p);
    assert(await p.evaluate(() => getComputedStyle(document.getElementById('touch')).display === 'block'), 'commandes tactiles absentes');
    await p.tap('#tM'); await p.waitForTimeout(400);
    const tabs = await p.evaluate(() => document.getElementById('side').innerText); for (const t of ['Quêtes', 'Carte', 'Équipement', 'Armée', 'Village', 'Clans', 'options', 'Manette', 'Sauvegarder']) assert(tabs.includes(t), 'onglet de menu manquant : ' + t);
    assert(p.errs.length === 0, p.errs.join(' | ')); return p;
  },
};

(async () => {
  const srv = await serve(); URL0 = `http://127.0.0.1:${srv.address().port}/index.html`;
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const seul = process.env.SEUL ? process.env.SEUL.split(',') : null; let ko = 0; const t0 = Date.now();
  console.log('Tests sur : ' + DIR);
  for (const [nom, fn] of Object.entries(TESTS)) {
    if (seul && !seul.some(s => nom.includes(s))) continue;
    const t = Date.now(); let p = null;
    try { p = await Promise.race([fn(), new Promise((_, r) => setTimeout(() => r(new Error('délai dépassé (5 min)')), 300000))]); console.log(`  ✔ ${nom} (${((Date.now() - t) / 1000).toFixed(0)} s)`); }
    catch (e) { ko++; console.log(`  ✘ ${nom} : ${e.message.split('\n')[0]}`); }
    for (const c of browser.contexts()) await c.close().catch(() => { });
  }
  console.log(ko ? `ÉCHEC : ${ko} test(s) en erreur` : `TOUT EST BON (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  await browser.close(); srv.close(); process.exit(ko ? 1 : 0);
})();
