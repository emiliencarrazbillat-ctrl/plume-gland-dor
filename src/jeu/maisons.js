'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   maisons.js — les maisons des villages autres que Cancan-les-Bains (refonte visuelle).
   Chargé après perso.js, dans le même espace. Chaque style garde son emprise au sol, sa porte
   tournée du même côté et ses couleurs de village (mur v.w, toit/accent v.r) : les collisions,
   posées ailleurs, ne changent pas.
   Styles : tree (cabane dans l'arbre), stilt (sur pilotis), igloo, tent (tente), forge (maison de
   pierre du volcan), et la tanière par défaut.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
function maison(g, st, v) {
  const w = v.w, r = v.r, N = '#1a1210', B1 = '#6b4a2e', B2 = '#8a5a30', B3 = '#4a3220'; HN++;
  const lampe = (x, y, z) => { const m = new THREE.Mesh(GEO.sph, matN('#ffb84a')); m.scale.set(.24, .3, .24); m.position.set(x, y, z); g.add(m); pt(g, 'cone', B3, .34, .2, .34, x, y + .36, z); };
  if (st === 'tree') {
    pm(g, pg('ma_tronc', () => volume([[0, -.4, 0, 3.3, 3.3], [0, .5, 0, 2.5, 2.5], [0, 2.2, 0, 2.05, 2.05], [0, 5, 0, 1.95, 1.95], [0, 6.5, 0, 2.4, 2.4], [0, 6.9, 0, .4, .4]], { rad: 14, sous: .1 })), '#5e3c1e');
    for (let i = 0; i < 5; i++) pm(g, pg('ma_racine', () => volume([[0, 1.7, .4, .5, .5], [0, .8, 1.5, .62, .52], [0, .15, 2.7, .46, .36], [0, -.2, 3.5, .1, .1]], { rad: 8 })), '#553619', 0, 0, 0, 0, i * 1.257 + .5, 0);
    pt(g, 'cyl', B2, 4.7, .28, 4.7, 0, 6.15, 0); pt(g, 'cyl', B3, 4.3, .5, 4.3, 0, 5.8, 0);                                  // plancher
    pt(g, 'cyl', w, 3.85, 3.1, 3.85, 0, 7.8, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + .26; if (Math.abs(Math.sin(a)) > .3 || Math.cos(a) < 0 || true) pt(g, 'box', B1, .22, 3.1, .16, Math.sin(a) * 3.82, 7.8, Math.cos(a) * 3.82, 0, a); }
    pt(g, 'cyl', B1, 3.95, .26, 3.95, 0, 9.3, 0);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; if (Math.abs(a - 0) < .5 || Math.abs(a - 6.283) < .5) continue; pt(g, 'cyl', B2, .1, 1.1, .1, Math.sin(a) * 4.5, 6.8, Math.cos(a) * 4.5); }
    pt(g, 'tor', B2, 4.5, 4.5, .9, 0, 7.36, 0, Math.PI / 2);                                                                // rambarde
    pt(g, 'cone', r, 5.2, 3.9, 5.2, 0, 11.3, 0); pt(g, 'cone', shade(r, .82), 3.2, 2.6, 3.2, 0, 12.9, 0); pt(g, 'sph', '#8a5a30', .5, .6, .5, 0, 14.5, 0); pt(g, 'cyl', B3, .58, .3, .58, 0, 14.9, 0);
    pt(g, 'box', N, 1.4, 2.2, .3, 0, 7.4, 3.75); pt(g, 'box', B2, 1.1, 1.9, .2, .1, 7.3, 3.9, 0, .25); pt(g, 'box', B1, 1.7, .22, .4, 0, 8.6, 3.8);
    win(g, 2.5, 8.1, 3.0, .7); win(g, -2.5, 8.1, 3.0, -.7); win(g, -3.3, 8.1, -2.1, -2.1);
    for (let i = 0; i < 12; i++) { const a = .9 + i * .42, y = .55 + i * .49; pt(g, 'box', i % 2 ? B2 : '#9a6a3a', 1.7, .16, .75, Math.sin(a) * 2.95, y, Math.cos(a) * 2.95, 0, a + Math.PI / 2); if (i % 3 === 1) pt(g, 'cyl', B3, .08, 1.2, .08, Math.sin(a) * 3.7, y + .6, Math.cos(a) * 3.7); }
    [[3.6, 9.6, -3.4, 1.9], [-3.8, 9.2, -3.0, 2.0], [0, 9.9, -4.8, 2.3]].forEach(([x, y, z, s], i) => pm(g, pg('ma_feuilles', () => bosse(soude(new THREE.IcosahedronGeometry(1, 2)), .22, 21)), ['#3f8a34', '#357a30', '#4a9a3a'][i], x, y, z, 0, x, 0, s, s * .8, s));   // feuillage derrière la cabane, sans cacher le toit
    lampe(3.9, 5.5, 2.4); pt(g, 'box', B3, .9, .7, .1, -1.6, 8.3, 3.72, 0, -.35); pt(g, 'sph', '#c98a4b', .2, .26, .2, -1.6, 8.3, 3.82);
  } else if (st === 'stilt') {
    for (const [x, z] of [[2.7, 2.7], [-2.7, 2.7], [2.7, -2.7], [-2.7, -2.7]]) { pt(g, 'cyl', '#3d3026', .3, 3.9, .3, x, 1.75, z); pt(g, 'cyl', '#2e241c', .42, .5, .42, x, .2, z); }
    for (const s of [1, -1]) { pt(g, 'box', '#3d3026', .16, 6.2, .16, 0, 1.9, s * 2.7, 0, 0, 1.05); pt(g, 'box', '#3d3026', .16, 6.2, .16, 0, 1.9, s * 2.7, 0, 0, -1.05); }
    pt(g, 'box', B3, 7.8, .32, 9.4, 0, 3.6, .9); for (let i = 0; i < 9; i++) pt(g, 'box', i % 2 ? B2 : '#7a5230', .8, .1, 9.3, -3.4 + i * .85, 3.8, .9);
    pt(g, 'box', w, 6, 3.5, 6, 0, 5.55, 0); for (let i = 0; i < 6; i++) for (const s of [1, -1]) { pt(g, 'box', shade(w, .8), .14, 3.5, .1, -2.5 + i, 5.55, s * 3.02); pt(g, 'box', shade(w, .8), .1, 3.5, .14, s * 3.02, 5.55, -2.5 + i); }
    for (const [x, z] of [[3, 3], [-3, 3], [3, -3], [-3, -3]]) pt(g, 'box', B3, .32, 3.7, .32, x, 5.6, z);
    pt(g, 'pyr', r, 6.2, 3.3, 6.2, 0, 8.95, 0, 0, Math.PI / 4); pt(g, 'pyr', shade(r, .8), 6.9, .9, 6.9, 0, 7.6, 0, 0, Math.PI / 4); pt(g, 'cyl', B3, .16, 1, .16, 0, 10.9, 0);
    pt(g, 'box', N, 1.4, 2.4, .3, 0, 4.95, 3.02); pt(g, 'box', B2, 1.1, 2.1, .2, -.12, 4.9, 3.2, 0, -.3); win(g, 2, 5.9, 3.0, 0); win(g, -3.02, 5.9, .4, -Math.PI / 2); win(g, 3.02, 5.9, -.6, Math.PI / 2);
    for (const x of [-3.7, -1.2, 1.2, 3.7]) pt(g, 'cyl', B2, .1, 1.2, .1, x, 4.4, 5.45); pt(g, 'box', B2, 2.6, .12, .12, -2.45, 5, 5.45); pt(g, 'box', B2, 2.6, .12, .12, 2.45, 5, 5.45);
    for (let i = 0; i < 7; i++) pt(g, 'box', i % 2 ? B2 : '#7a5230', 1.8, .16, .6, 0, 3.4 - i * .5, 5.9 + i * .52); for (const s of [1, -1]) pt(g, 'box', B3, .14, .2, 4.9, s * .95, 1.95, 7.5, .76);
    pt(g, 'cyl', '#a8743c', .5, 1, .5, 2.9, 4.3, 4.4); for (const y of [4.05, 4.6]) pt(g, 'cyl', '#4a3a2a', .54, .08, .54, 2.9, y, 4.4);
    pt(g, 'cyl', B3, .07, 3.2, .07, -3.5, 5.4, 4.9, 0, 0, .25); pt(g, 'box', '#c8d8d0', .04, 1.6, 1.4, -3.95, 5.2, 4.9, 0, 0, .25);                       // épuisette qui sèche
    lampe(3.3, 6.6, 3.3);
  } else if (st === 'igloo') {
    const d = new THREE.Mesh(GEO.hsph, mat(w)); d.scale.set(4.6, 3.8, 4.6); d.castShadow = true; g.add(d);
    for (let k = 0; k < 4; k++) { const y = .35 + k * .92, R = 4.6 * Math.sqrt(Math.max(.02, 1 - (y / 3.8) ** 2)), n = 15 - k * 3, incl = Math.asin(Math.min(.98, y / 3.8)); for (let i = 0; i < n; i++) { const a = (i + (k % 2) * .5) / n * 6.283; if (k < 2 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < .5) continue;
        const bl = pt(g, 'box', (i + k) % 2 ? '#f2f8fc' : '#dbe8f1', R * 6.283 / n * .88, .8, .14, Math.sin(a) * (R - .02), y, Math.cos(a) * (R - .02)); bl.rotation.order = 'YXZ'; bl.rotation.set(-incl * .9, a, 0); } }
    pt(g, 'cyl', w, 1.75, 2.3, 1.75, 0, .95, 4.5, Math.PI / 2); for (let i = 0; i < 7; i++) { const a = -1.4 + i * .467; pt(g, 'box', i % 2 ? '#eef6fb' : '#cfe0ec', .8, .5, .5, Math.sin(a) * 1.75, .95 + Math.cos(a) * 1.75, 5.55, 0, 0, -a); }
    pt(g, 'sph', N, 1.25, 1.45, .4, 0, .9, 5.6); pt(g, 'box', B2, 1.2, 2.1, .14, -.35, 1.0, 5.7, 0, .5);
    win(g, 2.75, 2.2, 2.95, .75); pt(g, 'cyl', '#7a7068', .34, 1.5, .34, -1.5, 3.7, -1); pt(g, 'cyl', '#5a524a', .46, .2, .46, -1.5, 4.5, -1); smoke(g, -1.5, 4.9, -1);
    for (const [x, z, s] of [[4.6, 1.5, 1.5], [-4.8, .8, 1.8], [-3.6, -3.4, 1.4], [3.9, -3.2, 1.6]]) pt(g, 'sph', '#f4f9fc', s, s * .45, s, x, .1, z);            // congères
    for (const s of [1, -1]) { pt(g, 'box', B2, .12, .14, 2.6, 5.4 + s * .5, .25, 4.2); pt(g, 'box', B2, .12, .5, .12, 5.4 + s * .5, .45, 5.4, .5); } for (let i = 0; i < 4; i++) pt(g, 'box', '#9a6a3a', 1.2, .08, .42, 5.4, .42, 3.3 + i * .55);
    for (const x of [-5.6, -4.0]) pt(g, 'cyl', B3, .09, 2.4, .09, x, 1.2, 3.9); pt(g, 'cyl', B3, .07, 1.9, .07, -4.8, 2.3, 3.9, 0, 0, Math.PI / 2); for (let i = 0; i < 3; i++) pt(g, 'sph', ['#e8866a', '#c8d0d8', '#e8a06a'][i], .14, .42, .08, -5.3 + i * .5, 1.8, 3.9);   // poissons qui sèchent
  } else if (st === 'tent') {
    pt(g, 'cone', w, 4, 6, 4, 0, 3, 0, 0, .4); pt(g, 'cone', shade(w, .82), 4.12, 1.2, 4.12, 0, .6, 0, 0, .4); pt(g, 'cone', r, 2.05, 3, 2.05, 0, 4.55, 0, 0, .4); pt(g, 'cone', shade(r, .75), 2.5, .5, 2.5, 0, 3.3, 0, 0, .4);
    for (let i = 0; i < 3; i++) pt(g, 'cyl', B3, .07, 2.6, .07, Math.sin(i * 2.1) * .3, 6.6, Math.cos(i * 2.1) * .3, Math.cos(i * 2.1) * .3, 0, -Math.sin(i * 2.1) * .3);
    pt(g, 'cone', N, 1.3, 3.2, .5, 0, 1.6, 3.05); for (const s of [1, -1]) pt(g, 'box', shade(w, 1.08), 1.1, 3.1, .1, s * 1.05, 1.5, 3.2, -.35, s * .5, s * .35);
    for (let i = 0; i < 5; i++) { const a = i * 1.257 + 1.0; if (Math.cos(a) > .8) continue; pt(g, 'cyl', '#c8b89a', .035, 3.6, .035, Math.sin(a) * 4.4, 1.5, Math.cos(a) * 4.4, Math.cos(a) * -.95, 0, Math.sin(a) * .95); pt(g, 'cyl', B3, .09, .6, .09, Math.sin(a) * 5.7, .2, Math.cos(a) * 5.7, Math.cos(a) * .3, 0, Math.sin(a) * -.3); }
    pt(g, 'box', r, 1.1, .7, .06, .62, 7.3, 0); pt(g, 'box', '#b98a52', 1.1, .9, 1.1, 3.6, .45, 2.6, 0, .4); pt(g, 'box', B2, 1.14, .1, 1.14, 3.6, .9, 2.6, 0, .4); pt(g, 'cyl', shade(r, .9), .32, 1.5, .32, -3.4, .34, 2.8, 0, .6, Math.PI / 2);
  } else if (st === 'forge') {
    const P1 = shade(w, .72), P2 = shade(w, 1.18);
    pt(g, 'box', P1, 7.6, .9, 7.2, 0, .45, 0); pt(g, 'box', w, 6.8, 5, 6.4, 0, 2.9, 0);
    for (const [x, z] of [[3.4, 3.2], [-3.4, 3.2], [3.4, -3.2], [-3.4, -3.2]]) { pt(g, 'box', P1, 1.1, 5.6, 1.1, x, 2.8, z); pt(g, 'box', P2, 1.3, .35, 1.3, x, 5.7, z); }
    for (let k = 0; k < 4; k++) for (let i = 0; i < 5; i++) for (const s of [1, -1]) { if (s > 0 && Math.abs(-2.2 + i * 1.1 + (k % 2) * .4 - .2) < 1.2 && k < 3) continue; pt(g, 'box', (i + k) % 2 ? P2 : P1, 1.0, .5, .12, -2.2 + i * 1.1 + (k % 2) * .4 - .2, 1.4 + k * 1.05, s * 3.22); }
    pt(g, 'box', r, 7.8, .5, 7.4, 0, 5.75, 0); pt(g, 'box', shade(r, .8), 6.6, .5, 6.2, 0, 6.2, 0); for (let i = 0; i < 4; i++) pt(g, 'box', B3, .4, .4, 8, -2.7 + i * 1.8, 5.35, 0);
    pt(g, 'box', P1, 2.0, 5.2, 2.0, -2, 7.4, -1.6); pt(g, 'box', w, 1.7, 1.4, 1.7, -2, 10.2, -1.6); pt(g, 'box', P2, 2.2, .35, 2.2, -2, 9.4, -1.6); pt(g, 'box', '#55504a', 2.25, .2, 2.25, -2, 8.2, -1.6);
    const ch = new THREE.Mesh(GEO.cone, glow('#ff6a1a', 2.4)); ch.scale.set(.6, 1.4, .6); ch.position.set(-2, 11.3, -1.6); g.add(ch); SPIN.push({ m: ch, fire: 1 }); smoke(g, -2, 11.8, -1.6);
    pt(g, 'box', N, 1.9, 3.0, .3, 0, 1.9, 3.2); pt(g, 'box', P2, 2.6, .5, .5, 0, 3.6, 3.3); for (const s of [1, -1]) pt(g, 'box', P1, .45, 3.1, .5, s * 1.2, 1.9, 3.3); pt(g, 'box', B3, 1.4, 2.6, .14, -.3, 1.8, 3.42, 0, -.45);
    for (const x of [2.3, -2.3]) { const fw = new THREE.Mesh(GEO.box, glow('#ff7a2a', 2)); fw.scale.set(1.1, .9, .25); fw.position.set(x, 3.0, 3.2); g.add(fw); for (const k of [-.3, 0, .3]) pt(g, 'box', '#2a2622', .07, 1, .1, x + k, 3.0, 3.36); pt(g, 'box', P2, 1.5, .22, .3, x, 2.42, 3.3); }
    pt(g, 'box', '#2a2622', 1.2, .7, .7, 4.9, .35, 1.6); pt(g, 'box', '#3a3632', .6, .5, .6, 4.9, .95, 1.6); pt(g, 'box', '#55504a', 1.9, .4, .9, 4.9, 1.4, 1.6); pt(g, 'cone', '#55504a', .3, .8, .45, 6.1, 1.4, 1.6, 0, 0, -Math.PI / 2);    // enclume
    pt(g, 'box', P1, 1.6, .7, 1, 4.8, .35, -1.4); pt(g, 'box', '#2f6a8a', 1.3, .1, .7, 4.8, .68, -1.4);                                                                                                     // bac de trempe
    lampe(1.5, 4.3, 3.5);
  } else {   // tanière
    pm(g, pg('ma_butte', () => volume([[0, -.3, 0, 5.6, 5.6], [0, 1.2, 0, 5.1, 5.1], [0, 2.6, 0, 3.8, 3.8], [0, 3.5, 0, 1.9, 1.9], [0, 3.75, 0, .2, .2]], { rad: 18, sous: .08 })), w);
    pm(g, pg('ma_butte2', () => volume([[0, -.3, 0, 3.5, 3.6], [0, 1.0, 0, 3.0, 3.1], [0, 2.1, 0, 1.6, 1.7], [0, 2.4, 0, .2, .2]], { rad: 14 })), '#6a3a20', 2.7, 0, -1.6);
    pt(g, 'cyl', B3, 1.85, .6, 1.85, 0, 1.25, 4.55, Math.PI / 2); pt(g, 'cyl', N, 1.5, .64, 1.5, 0, 1.25, 4.6, Math.PI / 2); pt(g, 'cyl', B2, 1.4, .16, 1.4, -.5, 1.25, 5.0, Math.PI / 2, 0, .55);
    for (const x of [-.5, 0, .5]) pt(g, 'box', B3, .06, 2.4, .1, -.5 + x * .7, 1.25, 5.12, 0, -.55 * 0, 0);
    pt(g, 'cone', '#f6efe6', .25, 1.7, .25, 1.9, 2.6, 4.5, .3); pt(g, 'cone', '#f6efe6', .25, 1.7, .25, -1.9, 2.6, 4.5, .3);
    win(g, 3.1, 2.2, 3.35, .75); pt(g, 'tor', B3, .85, .85, .9, 3.14, 2.2, 3.4, 0, .75);
    pt(g, 'cyl', '#9a9288', .55, 2.2, .55, -2.2, 3.6, -.8); pt(g, 'cyl', '#7c746a', .7, .3, .7, -2.2, 4.75, -.8); smoke(g, -2.2, 5.2, -.8);
    for (let i = 0; i < 9; i++) { const a = i * .7, d = 1 + (i % 3) * .9; pt(g, 'cone', ['#5fae3e', '#74bd48', '#4f9e38'][i % 3], .16, .9, .16, Math.sin(a) * d, 3.5 - d * .28, Math.cos(a) * d - .3, Math.cos(a) * .2, 0, Math.sin(a) * -.2); }
    for (let i = 0; i < 6; i++) pt(g, 'cyl', i % 2 ? '#c9955a' : '#b07d44', .28, 1.5, .28, -4.6 + (i % 3) * .58 + (i > 2 ? .29 : 0), .3 + (i > 2 ? .5 : 0), 3.6, Math.PI / 2);                                 // tas de bois
    lampe(1.9, 3.3, 4.6);
  }
}

/* ───────── ENTRÉE DE DONJON ─────────
   Une butte rocheuse percée d'un porche de pierre : piliers, voûte de claveaux, marches, deux torches.
   L'anneau lumineux et l'étiquette sont posés par gfx.js, comme avant. */
function entreeDonjon(g, d) {
  const P1 = '#6a6660', P2 = '#57534e', P3 = '#7d7972', roc = () => pg('dj_roc', () => bosse(soude(new THREE.IcosahedronGeometry(1, 2)), .16, 31));
  pm(g, roc(), P1, 0, 2.4, -2.9, 0, .4, 0, 5.5, 4.7, 4.3); pm(g, roc(), P2, -4.6, 1.1, -1.0, 0, 1, 0, 2.7, 2.9, 2.5); pm(g, roc(), P2, 4.4, .9, -.8, 0, 2, 0, 2.3, 2.3, 2.1); pm(g, roc(), P3, .6, 5.7, -3.4, 0, .9, 0, 2.7, 1.6, 2.4); pm(g, roc(), P2, -2.6, .5, 2.6, 0, 3, 0, .9, .7, .8); pm(g, roc(), P1, 3.4, .4, 2.9, 0, 4, 0, .7, .55, .7);
  pt(g, 'sph', '#07060a', 2.4, 3, 1.2, 0, 1.8, 0);
  for (const s of [1, -1]) { pt(g, 'box', P3, 1.15, 4.3, 1.4, s * 2.75, 2.15, .55); pt(g, 'box', P2, 1.5, .5, 1.75, s * 2.75, .25, .55); pt(g, 'box', P1, 1.45, .4, 1.7, s * 2.75, 4.45, .55);
    pt(g, 'cyl', '#3a2a1a', .14, 2.8, .14, s * 4.1, 1.4, 2.0); pt(g, 'cyl', '#2a2622', .34, .3, .34, s * 4.1, 2.9, 2.0); const f = new THREE.Mesh(GEO.cone, glow(d[8] ? '#ff5a3a' : '#ff9a2b', 2.6)); f.scale.set(.32, .8, .32); f.position.set(s * 4.1, 3.5, 2.0); g.add(f); SPIN.push({ m: f, fire: 1 }); }
  for (let i = 0; i < 7; i++) { const a = Math.PI * (i + .5) / 7; pt(g, 'box', i % 2 ? P3 : P1, 1.25, .95, 1.45, Math.cos(a) * 2.75, 4.5 + Math.sin(a) * 1.7, .55, 0, 0, a - Math.PI / 2); }
  pt(g, 'box', d[8] ? '#b3262e' : '#e0a020', .8, 1.0, .3, 0, 6.55, 1.2); pt(g, 'box', '#2a2622', .5, .6, .32, 0, 6.55, 1.24, 0, 0, .785);
  for (let i = 0; i < 3; i++) pt(g, 'box', i % 2 ? P1 : P3, 5.2 - i * .5, .28, 1.0, 0, .14, 1.7 + i * .95);
  bakeStatic(g);
}

/* ───────── FORT ─────────
   Palissade de rondins ligaturés, portail à linteau et bannière, donjon de pierre crénelé sous un toit de guet.
   Les drapeaux, le feu et la tente sont posés par gfx.js, comme avant. */
function fortDecor(g, f, x, y, z) {
  const c = FACTION[f[4]].c, B1 = '#6b4a2a', B2 = '#5a3c20', N = '#1a1210', S1 = '#7a7068', S2 = '#5f574f', S3 = '#8d837a';
  for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283; if (Math.abs(a - 1.571) < .42) continue; const px = Math.cos(a) * 12, pz = Math.sin(a) * 12, hy = height(x + px, z + pz) - y, k = 1 + (i % 3) * .06;
    pt(g, 'cyl', i % 2 ? B1 : '#75522f', .6, 5.2 * k, .6, px, hy + 2.4 * k, pz); pt(g, 'cone', B2, .6, 1.1, .6, px, hy + 5.5 * k, pz); pt(g, 'cyl', '#3a2a1a', .64, .2, .64, px, hy + 3.7, pz); pt(g, 'cyl', '#3a2a1a', .64, .2, .64, px, hy + 1.3, pz); }
  const gy = height(x, z + 11) - y;                                                                   // portail
  for (const s of [1, -1]) { pt(g, 'cyl', B2, .78, 7, .78, s * 4.9, gy + 3.5, 10.95); pt(g, 'cone', '#3a2a1a', .78, 1.2, .78, s * 4.9, gy + 7.6, 10.95);
    const t = new THREE.Mesh(GEO.cone, glow('#ff9a2b', 2.6)); t.scale.set(.3, .75, .3); t.position.set(s * 4.9, gy + 4.6, 11.95); g.add(t); SPIN.push({ m: t, fire: 1 }); pt(g, 'cyl', '#2a2622', .3, .25, .3, s * 4.9, gy + 4.05, 11.95); }
  pt(g, 'box', B2, 11.2, .6, .8, 0, gy + 6.3, 10.95); pt(g, 'box', '#3a2a1a', 11.6, .2, .95, 0, gy + 6.7, 10.95); pt(g, 'box', c, 2.4, 2.2, .12, 0, gy + 4.9, 11.0); pt(g, 'box', shade(c, .7), 2.4, .3, .14, 0, gy + 3.9, 11.0);
  for (let i = 0; i < 4; i++) for (const s of [1, -1]) { const sx = s * (7.5 + i * 1.3); pt(g, 'cyl', B1, .14, 2.6, .14, sx, height(x + sx, z + 14) - y + .9, 14, .7, 0, .5); pt(g, 'cyl', B1, .14, 2.6, .14, sx, height(x + sx, z + 14) - y + .9, 14, .7, 0, -.5); }   // chevaux de frise
  // donjon de pierre
  pt(g, 'box', S2, 5, .8, 5, 0, .4, -4); pt(g, 'box', S1, 4.4, 8, 4.4, 0, 4, -4);
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let k = 0; k < 5; k++) pt(g, 'box', k % 2 ? S3 : S2, .8, .7, .8, sx * 2.0, 1.1 + k * 1.6, -4 + sz * 2.0);
  for (let k = 0; k < 3; k++) pt(g, 'box', S2, 4.5, .16, 4.5, 0, 2.6 + k * 2, -4);
  pt(g, 'box', S2, 5.8, .6, 5.8, 0, 8.3, -4); for (let i = 0; i < 12; i++) { const e = i % 3, sd = (i / 3) | 0, o = (e - 1) * 2.1, px = sd === 0 ? o : sd === 1 ? 2.5 : sd === 2 ? o : -2.5, pz = sd === 0 ? 2.5 : sd === 1 ? o : sd === 2 ? -2.5 : o; pt(g, 'box', i % 2 ? S3 : S1, 1.0, .95, 1.0, px, 9.05, -4 + pz); }
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) pt(g, 'cyl', B2, .2, 2.6, .2, sx * 1.9, 9.9, -4 + sz * 1.9);
  pt(g, 'pyr', '#4a3a2a', 4.4, 2.4, 4.4, 0, 12.3, -4, 0, Math.PI / 4); pt(g, 'pyr', '#3a2c20', 4.9, .7, 4.9, 0, 11.3, -4, 0, Math.PI / 4);
  pt(g, 'box', N, 1.5, 2.6, .2, 0, 1.7, -1.75); pt(g, 'box', B1, 1.2, 2.3, .16, -.2, 1.6, -1.6, 0, -.4); pt(g, 'box', S3, 2.1, .45, .4, 0, 3.15, -1.75); win(g, 0, 5.8, -1.75);
  for (const s of [1, -1]) { pt(g, 'box', N, .2, 1.3, .35, s * 2.22, 5.4, -4); pt(g, 'box', N, .35, 1.3, .2, s * 1.1, 3.4 + (s > 0 ? 3.6 : 0), -1.78); }
  // vie du camp
  for (const [bx, bz] of [[5.6, -2.2], [6.6, -1.2]]) { pt(g, 'cyl', '#a8743c', .6, 1.3, .6, bx, .65, bz); for (const yy of [.3, 1]) pt(g, 'cyl', '#4a3a2a', .64, .1, .64, bx, yy, bz); }
  pt(g, 'box', '#b98a52', 1.3, 1, 1.3, 6.2, .5, -3.6, 0, .3); pt(g, 'box', '#8a5a30', 1.34, .1, 1.34, 6.2, 1, -3.6, 0, .3);
  for (const s of [1, -1]) pt(g, 'cyl', B2, .1, 2.2, .1, -6.2 + s * 1.2, 1.1, -3); pt(g, 'cyl', B2, .08, 2.8, .08, -6.2, 1.9, -3, 0, 0, Math.PI / 2); for (let i = 0; i < 3; i++) { pt(g, 'cyl', B1, .05, 3, .05, -7 + i * .8, 1.5, -2.8, .12); pt(g, 'cone', matMetal('#c8ccd4'), .12, .45, .12, -7 + i * .8, 3.1, -2.62, .12); }
  bakeStatic(g);
}

/* ───────── INTÉRIEUR DES DONJONS ─────────
   Le jeu construit la salle (et ses obstacles) ; on habille ensuite ce qui est là, sans rien déplacer :
   sol dallé, pierre sur les murs et les rochers, piliers engagés le long des murs, éboulis au pied des parois. */
const DJM = {};
function donjonDeco() {
  const len = DG.len, r = rng(hstr(DG.id) + 7);
  for (const m of DGp.children.slice()) {
    if (!m.isMesh) continue;
    if (m.geometry.type === 'PlaneGeometry' && m.material.isMeshStandardMaterial) {
      const mk = (n, c) => { const t = TEX(n, c).clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, (len + 16) / 4.9); t.needsUpdate = true; return t; };
      m.material = new THREE.MeshStandardMaterial({ color: m.material.color.clone().multiplyScalar(3.2), roughness: .92, map: mk('paves_c', 1), normalMap: mk('paves_n', 0) });
    } else if (m.material.isMeshToonMaterial) { const k = m.material.color.getHexString(); let dm = DJM[k]; if (!dm) { dm = DJM[k] = decorMaterial('roche'); dm.color.copy(m.material.color).multiplyScalar(1.5); } m.material = dm; m.receiveShadow = true; }
  }
  const dk = Object.values(DJM)[0] || decorMaterial('roche'), P = (geo, sx, sy, sz, x, y, z, ry) => { const m = new THREE.Mesh(geo, dk); m.scale.set(sx, sy, sz); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = m.receiveShadow = true; DGp.add(m); };
  for (let z = 2; z > -len; z -= 9) for (const s of [-1, 1]) { P(GEO.box, 1.5, 9.4, 1.5, s * 20.1, 4.7, z); P(GEO.box, 2.0, .5, 2.0, s * 20.1, .25, z); P(GEO.box, 1.9, .5, 1.9, s * 20.1, 9.0, z); P(GEO.box, 1.1, .5, 2.6, s * 20.3, 7.6, z + 1.6, 0); P(GEO.box, 1.1, .5, 2.6, s * 20.3, 7.6, z - 1.6, 0); }
  const roc = pg('dj_roc', () => bosse(soude(new THREE.IcosahedronGeometry(1, 2)), .16, 31));
  for (let i = 0; i < len * .9; i++) { const s = r() < .5 ? -1 : 1, q = .25 + r() * .45; P(roc, q, q * .7, q, s * (19.3 + r() * .5), q * .3, 4 - r() * (len + 2), r() * 6); }
}
