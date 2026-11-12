'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   perso.js — les personnages (refonte visuelle). Chargé après gfx.js, dans le même espace.
   Les quatre gabarits du jeu (oie, écureuil, quadrupède, bulldog) sont refaits avec des volumes
   lisses et continus à la place des boules. Les points d'attache (cou, ailes, pattes, queue, épée,
   cape) gardent les mêmes noms et les mêmes positions : le jeu les anime exactement comme avant.
   Rien ici ne touche aux règles : tailles de collision, portées et vitesses viennent d'ailleurs.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */

/* ───────── OUTILS DE MODELAGE ───────── */
/* Volume « balayé » : une suite d'anneaux [x,y,z,rayonX,rayonY] reliés en douceur (corps, cou, queue…).
   opt.sous : assombrit le dessous (0 à 1) pour donner du volume ; opt.rad : finesse du contour. */
function volume(an, opt = {}) {
  const RAD = opt.rad || 14, SUB = opt.sub || 4, n = an.length, cr = (a, b, c, d, t) => .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  const S = []; for (let i = 0; i < n - 1; i++) for (let s = 0; s < SUB; s++) { const t = s / SUB, p0 = an[Math.max(0, i - 1)], p1 = an[i], p2 = an[i + 1], p3 = an[Math.min(n - 1, i + 2)]; S.push([0, 1, 2, 3, 4].map(k => cr(p0[k], p1[k], p2[k], p3[k], t))); } S.push(an[n - 1].slice(0, 5));
  for (const s of S) { s[3] = Math.max(.004, s[3]); s[4] = Math.max(.004, s[4]); }
  const M = S.length, pos = [], col = [], idx = [], T = new THREE.Vector3(), X = new THREE.Vector3(), N = new THREE.Vector3(), A = new THREE.Vector3(), sous = opt.sous || 0;
  for (let j = 0; j < M; j++) { const a = S[Math.max(0, j - 1)], b = S[Math.min(M - 1, j + 1)], c = S[j]; T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    X.set(1, 0, 0); if (Math.abs(T.x) > .9) X.set(0, 0, 1); N.crossVectors(T, X).normalize(); A.crossVectors(N, T).normalize();
    for (let i = 0; i < RAD; i++) { const g = i / RAD * 6.2832, cx = Math.cos(g), sy = Math.sin(g), dy = A.y * cx + N.y * sy;
      pos.push(c[0] + A.x * c[3] * cx + N.x * c[4] * sy, c[1] + A.y * c[3] * cx + N.y * c[4] * sy, c[2] + A.z * c[3] * cx + N.z * c[4] * sy);
      const k = 1 - sous * sstep(.15, -.85, dy); col.push(k, k, k); } }
  const p0 = pos.length / 3; pos.push(S[0][0], S[0][1], S[0][2], S[M - 1][0], S[M - 1][1], S[M - 1][2]); col.push(1, 1, 1, 1, 1, 1);
  for (let j = 0; j < M - 1; j++) for (let i = 0; i < RAD; i++) { const a = j * RAD + i, b = j * RAD + (i + 1) % RAD, c = a + RAD, d = b + RAD; idx.push(a, c, b, b, c, d); }
  for (let i = 0; i < RAD; i++) { idx.push(p0, i, (i + 1) % RAD); idx.push(p0 + 1, (M - 1) * RAD + (i + 1) % RAD, (M - 1) * RAD + i); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3)); g.setIndex(idx);
  // faces tournées vers l'extérieur
  { let v = 0; const P3 = g.attributes.position; for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2]; v += P3.getX(a) * (P3.getY(b) * P3.getZ(c) - P3.getZ(b) * P3.getY(c)) - P3.getY(a) * (P3.getX(b) * P3.getZ(c) - P3.getZ(b) * P3.getX(c)) + P3.getZ(a) * (P3.getX(b) * P3.getY(c) - P3.getY(b) * P3.getX(c)); }
    const cx = S.reduce((s, r) => s + r[0], 0) / M, cy = S.reduce((s, r) => s + r[1], 0) / M, cz = S.reduce((s, r) => s + r[2], 0) / M; let vc = 0;
    for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2], ax = P3.getX(a) - cx, ay = P3.getY(a) - cy, az = P3.getZ(a) - cz, bx = P3.getX(b) - cx, by = P3.getY(b) - cy, bz = P3.getZ(b) - cz, qx = P3.getX(c) - cx, qy = P3.getY(c) - cy, qz = P3.getZ(c) - cz; vc += ax * (by * qz - bz * qy) - ay * (bx * qz - bz * qx) + az * (bx * qy - by * qx); }
    if (vc < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); }
  g.computeVertexNormals(); return g;
}
/* Plaque arrondie découpée selon un contour (aile, plume, oreille, palme). plan : 'yz' (de profil), 'xz' (à plat), 'xy' (de face). */
function plaque(pts, ep, plan = 'xy', lisse = true) {
  const sh = new THREE.Shape(); const V = pts.map(p => new THREE.Vector2(p[0], p[1]));
  if (lisse) { sh.moveTo(V[0].x, V[0].y); sh.splineThru(V.slice(1).concat([V[0]])); } else { sh.moveTo(V[0].x, V[0].y); for (let i = 1; i < V.length; i++) sh.lineTo(V[i].x, V[i].y); sh.closePath(); }
  const b = Math.min(ep * .45, .06), g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(.01, ep - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 7 });
  g.translate(0, 0, -(ep - 2 * b) / 2); if (plan === 'yz') g.rotateY(-Math.PI / 2); else if (plan === 'xz') g.rotateX(Math.PI / 2);
  g.deleteAttribute('uv'); return g;
}
const PGEO = {};
function pg(cle, f) { return PGEO[cle] || (PGEO[cle] = f()); }                 // les formes sont fabriquées une seule fois
function pm(p, geo, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { const m = new THREE.Mesh(geo, typeof c === 'string' ? mat(c) : c); m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); m.castShadow = true; p.add(m); return m; }
function grp(p, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; }
/* yeux : dans un groupe à part pour pouvoir cligner */
function yeux(p, y, z, ecart, taille, blanc) {
  const e = grp(p, 0, y, 0);
  for (const s of [1, -1]) { if (blanc) pt(e, 'sph', '#ffffff', .13 * taille, .15 * taille, .09 * taille, s * ecart, 0, z); pt(e, 'sph', '#15121a', .085 * taille, .105 * taille, .06 * taille, s * ecart * 1.05, 0, z + .06 * taille); pt(e, 'sph', '#ffffff', .032 * taille, .032 * taille, .03 * taille, s * ecart * 1.05 + .028 * taille, .042 * taille, z + .105 * taille); }
  return e;
}

/* ───────── OIE ───────── */
const PLUME_F = [[0, -.5], [.15, -.2], [.16, .2], [.1, .46], [0, .56], [-.1, .46], [-.16, .2], [-.15, -.2]];
const AILE_F = [[.72, .04], [.52, -.44], [.08, -.76], [-.55, -.74], [-.98, -.56], [-1.18, -.3], [-1.34, -.02], [-1.0, .2], [-.4, .3], [.3, .26]];
const PALME_F = [[0, -.14], [.26, .12], [.3, .42], [.17, .52], [.09, .36], [0, .58], [-.09, .36], [-.17, .52], [-.3, .42], [-.26, .12]];
function mGoose1(c, o = {}) {
  const g = new THREE.Group(), Wc = c || '#fff', Sh = shade(Wc, .84), B = o.crow ? '#26262c' : '#f59a23', B2 = o.crow ? '#16161a' : '#d9730f', oison = o.evo === 1, royal = o.evo === 3;
  // corps : un seul volume, du croupion au poitrail
  pm(g, pg(oison ? 'go_corps1' : 'go_corps', () => volume(oison
    ? [[0, 1.78, -1.22, .04, .04], [0, 1.66, -.95, .62, .56], [0, 1.5, -.25, 1.04, .98], [0, 1.52, .45, .94, .9], [0, 1.66, .98, .5, .48], [0, 1.72, 1.16, .06, .06]]
    : [[0, 2.02, -1.66, .04, .04], [0, 1.9, -1.34, .4, .34], [0, 1.62, -.72, .9, .8], [0, 1.5, 0, 1.06, .97], [0, 1.56, .62, .92, .86], [0, 1.74, 1.08, .56, .54], [0, 1.82, 1.3, .08, .08]], { sous: .2, rad: 16 })), Wc);
  // plumes de la queue
  if (!oison) { const N = royal ? 5 : 3; for (let i = 0; i < N; i++) { const a = (i - (N - 1) / 2) * (royal ? .3 : .4); pm(g, pg('go_plume', () => plaque(PLUME_F, .08)), i % 2 ? Sh : Wc, Math.sin(a) * .5, 1.98, -1.4, -1.95, 0, a * .8, 1, royal ? 1.5 : 1.05, 1); } }
  else pm(g, pg('go_plume', () => plaque(PLUME_F, .08)), Wc, 0, 1.78, -1.1, -2.1, 0, 0, .8, .55, 1);
  // cou et tête
  const neck = grp(g, 0, 2, .9);
  pm(neck, pg('go_cou', () => volume([[0, -.55, -.3, .5, .5], [0, -.1, -.06, .43, .43], [0, .5, .08, .31, .31], [0, 1.0, .16, .27, .27], [0, 1.42, .22, .3, .3], [0, 1.6, .24, .1, .1]], { sous: .12 })), Wc);
  pm(neck, pg('go_tete', () => volume([[0, 1.56, -.3, .05, .05], [0, 1.6, -.14, .4, .38], [0, 1.6, .2, .51, .48], [0, 1.56, .5, .45, .41], [0, 1.5, .74, .28, .24], [0, 1.48, .82, .06, .06]], { sous: .1 })), Wc);
  pm(neck, pg('go_bec', () => volume([[0, 1.53, .6, .05, .05], [0, 1.52, .7, .27, .2], [0, 1.5, .95, .23, .14], [0, 1.47, 1.2, .17, .085], [0, 1.455, 1.37, .09, .04], [0, 1.45, 1.42, .02, .02]], { rad: 12 })), B);
  pm(neck, pg('go_bec2', () => volume([[0, 1.42, .6, .04, .04], [0, 1.4, .72, .2, .1], [0, 1.385, 1.0, .15, .06], [0, 1.38, 1.24, .06, .03]], { rad: 10 })), B2);
  const eyes = yeux(neck, 1.69, .55, .3, 1, true);
  if (!o.crow) for (const s of [1, -1]) pt(neck, 'sph', '#ffb4a6', .085, .06, .04, s * .37, 1.5, .58);
  // ailes
  const wing = s => { const w = grp(g, s, 1.78, -.05), k = oison ? .58 : royal ? 1.14 : 1;
    pm(w, pg('go_aile', () => plaque(AILE_F, .17, 'yz')), Wc, 0, -.02, 0, 0, 0, s * .08, 1, k, k); pm(w, pg('go_aile', () => plaque(AILE_F, .17, 'yz')), Sh, s * .1, -.16 * k, -.14 * k, 0, 0, s * .1, 1, k * .74, k * .74); return w; }, wl = wing(-1), wr = wing(1);
  // pattes palmées
  const leg = s => { const L = grp(g, s * .4, .8, 0); pm(L, pg('go_patte', () => volume([[0, .12, 0, .05, .05], [0, 0, 0, .14, .14], [0, -.36, .03, .085, .085], [0, -.7, 0, .1, .1], [0, -.76, 0, .04, .04]], { rad: 8 })), B);
    pm(L, pg('go_palme', () => plaque(PALME_F, .08, 'xz')), B2, 0, -.74, .12, 0, 0, 0, 1.25); g.add(L); return L; }, legL = leg(1), legR = leg(-1);
  // les trois âges de Plume
  if (oison) { neck.scale.set(1.14, .8, 1.14); for (const [x, z, r] of [[0, .18, -.35], [.1, .3, -.1], [-.09, .26, -.2]]) pt(neck, 'cone', Wc, .09, .4, .09, x, 2.08, z, r, 0, x * -4); pt(g, 'sph', Wc, .9, .6, .9, 0, 1.9, -.5); }
  if (royal) { pt(g, 'sph', matMetal('#ffd24a'), .82, .42, .7, 0, 2.05, .62); for (const s of [1, -1]) { pt(g, 'sph', matMetal('#e6edf4'), .44, .36, .66, s * 1.02, 2.22, -.02); pt(g, 'sph', matMetal('#ffd24a'), .2, .2, .2, s * 1.12, 2.42, .3); }
    pt(neck, 'sph', matMetal('#ffd24a'), .53, .3, .57, 0, 1.8, .24); pt(neck, 'box', matMetal('#ffd24a'), .12, .34, .5, 0, 1.5, .62); for (let i = 0; i < 4; i++) pm(neck, pg('go_plume', () => plaque(PLUME_F, .08)), i % 2 ? '#ff6a3a' : '#e23b2e', 0, 2.25 - i * .1, .3 - i * .3, -.45 - i * .2, Math.PI / 2, 0, 1, .85 - i * .1, 1); pt(g, 'cyl', matMetal('#ffd24a'), 1.08, .12, 1.46, 0, 1.42, 0); }
  // tenues et armes (mêmes emplacements qu'avant)
  if (o.scarf) { pt(g, 'cyl', o.scarf, .42, .28, .42, 0, 2.3, .93, .15); if (o.hero) { pt(g, 'sph', o.scarf, .17, .17, .17, .3, 2.26, 1.3); pt(g, 'box', o.scarf, .15, .62, .07, .38, 1.9, 1.34, .2, 0, -.22); pt(g, 'box', shade(o.scarf, .8), .13, .5, .07, .2, 1.92, 1.38, .25, 0, .1); } }
  if (o.hero) { pt(g, 'cyl', '#7a4e28', 1.07, .13, 1.44, 0, 1.18, 0); pt(g, 'box', '#ffd24a', .24, .2, .08, 0, 1.2, 1.42); pt(g, 'box', '#8a5a30', .3, .55, .5, -1, 1.22, .35); pt(g, 'box', '#a8743c', .32, .2, .52, -1, 1.52, .35); }
  if (o.tab) { pt(g, 'sph', o.tab, 1.09, .7, 1.1, 0, 1.6, .3); pt(g, 'cyl', o.tab, .4, .2, .4, 0, 2.3, .93, .15); }
  if (o.armor) { pt(g, 'sph', matMetal('#aab4c0'), 1.1, .8, 1.3, 0, 1.62, .05); pt(neck, 'sph', matMetal('#aab4c0'), .52, .34, .56, 0, 1.76, .26); pt(neck, 'box', matMetal('#8d99a6'), .1, .3, .5, 0, 2.02, .3); }
  if (o.shield) { pt(g, 'cyl', matMetal('#8d99a6'), .9, .14, .9, -1.25, 1.6, .4, 0, 0, Math.PI / 2); pt(g, 'cyl', o.tab || '#3f7fd0', .55, .16, .55, -1.27, 1.6, .4, 0, 0, Math.PI / 2); }
  if (o.spear) { pt(g, 'cyl', '#6b4423', .07, 4.2, .07, 1.15, 2.2, .5, .25); pt(g, 'cone', matMetal('#dfe7ee'), .18, .7, .18, 1.15, 4.4, 1.05, .25); }
  if (o.bow) pt(g, 'tor', '#6b4423', .9, .9, .5, 1.2, 1.9, .5, 0, Math.PI / 2, 0);
  if (o.staffG) { pt(g, 'cyl', '#3a2a3a', .07, 3.4, .07, 1.15, 1.9, .4); pt(g, 'ico', glow('#b06aff', 2.5), .28, .28, .28, 1.15, 3.7, .4); }
  if (o.crownG) { pt(neck, 'cyl', matMetal('#ffd24a'), .4, .22, .4, 0, 2.02, .3); for (let i = 0; i < 5; i++) pt(neck, 'cone', matMetal('#ffd24a'), .08, .26, .08, Math.cos(i * 1.257) * .34, 2.25, .3 + Math.sin(i * 1.257) * .34); }
  if (o.hat) { pt(neck, 'cyl', '#5a3a8a', .62, .06, .62, 0, 1.98, .24); pt(neck, 'cone', '#5a3a8a', .36, .8, .36, 0, 2.4, .24, -.12); }
  if (o.cape) { const cp = grp(g, 0, 2.35, .5); pm(cp, pg('go_cape', () => plaque([[-.62, 0], [-.95, -1.4], [-1.0, -2.9], [-.5, -2.7], [0, -3.0], [.5, -2.7], [1.0, -2.9], [.95, -1.4], [.62, 0]], .09, 'xy', false)), o.cape, 0, -.02, -.42, 1.22, 0, 0); pm(cp, pg('go_cape2', () => plaque([[-1.0, -2.6], [-1.0, -2.9], [-.5, -2.7], [0, -3.0], [.5, -2.7], [1.0, -2.9], [1.0, -2.6]], .11, 'xy', false)), shade(o.cape, .75), 0, -.02, -.42, 1.22, 0, 0); g.userData.cape = cp; }
  if (o.sword) { const s = grp(g, 1.2, 1.7, .3); pm(s, pg('go_lame', () => plaque([[-.1, 0], [-.1, 1.75], [0, 2.25], [.1, 1.75], [.1, 0]], .1, 'xz', false)), matMetal('#eef3f8'), 0, 0, .2); pt(s, 'box', glow('#bfe4ff', 1.3), .05, .12, 1.7, 0, 0, 1.1); pt(s, 'box', matMetal('#ffd24a'), .74, .2, .18, 0, 0, .15); pt(s, 'sph', matMetal('#ffd24a'), .13, .13, .13, 0, 0, -.42); pt(s, 'cyl', '#3a2a1a', .09, .5, .09, 0, 0, -.15, Math.PI / 2); g.userData.sword = s; }
  Object.assign(g.userData, { neck, wl, wr, legL, legR, eyes }); return g;
}

/* ───────── ÉCUREUIL (et loutre) ───────── */
const OREILLE_F = [[0, -.2], [.2, .0], [.14, .34], [0, .5], [-.14, .34], [-.2, .0]];
function mSquirrel1(c, o = {}) {
  const g = new THREE.Group(), F = c || '#b5651d', B = '#f3d9b1', Fd = shade(F, .8);
  pm(g, pg('sq_corps', () => volume([[0, .12, 0, .05, .05], [0, .3, 0, .6, .56], [0, .85, .02, .84, .78], [0, 1.4, .04, .76, .7], [0, 1.85, .08, .5, .48], [0, 2.1, .1, .3, .3]], { sous: .15 })), F);
  pm(g, pg('sq_ventre', () => volume([[0, .4, .42, .04, .04], [0, .7, .6, .42, .2], [0, 1.2, .68, .5, .22], [0, 1.65, .52, .36, .18], [0, 1.9, .4, .05, .05]], { rad: 12 })), B);
  pm(g, pg('sq_tete', () => volume([[0, 2.45, -.52, .05, .05], [0, 2.5, -.34, .52, .48], [0, 2.5, .08, .7, .63], [0, 2.42, .46, .56, .47], [0, 2.33, .76, .3, .24], [0, 2.32, .9, .06, .06]], { sous: .1 })), F);
  pt(g, 'sph', B, .36, .25, .28, 0, 2.27, .64); pt(g, 'sph', '#2a1a16', .1, .08, .08, 0, 2.4, .9);
  for (const s of [1, -1]) { pt(g, 'sph', F, .3, .26, .3, s * .44, 2.3, .34);
    pm(g, pg('sq_oreille', () => plaque(OREILLE_F, .1)), F, s * .42, 3.0, .05, -.1, 0, s * -.25, 1.15); pm(g, pg('sq_oreille', () => plaque(OREILLE_F, .1)), '#f0b89a', s * .42, 2.98, .1, -.1, 0, s * -.25, .7);
    pm(g, pg('sq_bras', () => volume([[0, .1, -.1, .05, .05], [0, 0, 0, .2, .2], [0, -.25, .2, .17, .17], [0, -.42, .42, .19, .19], [0, -.45, .56, .05, .05]], { rad: 10 })), F, s * .68, 1.75, .12, 0, 0, s * .25);
    pm(g, pg('sq_pied', () => volume([[0, 0, -.2, .05, .04], [0, 0, 0, .28, .15], [0, 0, .34, .26, .13], [0, 0, .5, .05, .04]], { rad: 10 })), Fd, s * .4, .14, .22); }
  const eyes = yeux(g, 2.6, .62, .3, 1.1, false);
  const tail = grp(g, 0, 1, -.7);
  pm(tail, pg('sq_queue', () => volume([[0, -.1, .1, .1, .1], [0, .15, -.3, .42, .42], [0, .8, -.78, .7, .68], [0, 1.6, -.82, .74, .72], [0, 2.3, -.5, .62, .6], [0, 2.75, -.12, .4, .38], [0, 2.9, .12, .08, .08]], { sous: .22, rad: 16 })), F);
  pm(tail, pg('sq_queue2', () => volume([[0, 2.2, -.5, .3, .3], [0, 2.5, -.3, .5, .48], [0, 2.78, -.1, .38, .36], [0, 2.95, .14, .06, .06]], { rad: 12 })), B, 0, .04, .03);
  if (o.bandana) pt(g, 'cyl', o.bandana, .7, .2, .68, 0, 2.8, .1);
  if (o.tab) { pt(g, 'sph', o.tab, .86, .6, .8, 0, 1.3, .02); pt(g, 'cyl', o.tab, .52, .16, .52, 0, 1.98, .1); }
  if (o.hat) { pt(g, 'cone', o.hat, .6, 1.2, .6, 0, 3.5, .1); pt(g, 'cyl', o.hat, .95, .08, .95, 0, 2.95, .1); }
  if (o.crown) { pt(g, 'cyl', matMetal('#ffd24a'), .48, .3, .48, 0, 3.15, .1); for (let i = 0; i < 5; i++) pt(g, 'cone', matMetal('#ffd24a'), .1, .3, .1, Math.cos(i * 1.257) * .42, 3.42, .1 + Math.sin(i * 1.257) * .42); }
  if (o.dagger) pt(g, 'box', matMetal('#dfe7ee'), .1, .1, 1, .85, 1.5, .9);
  if (o.bow) pt(g, 'tor', '#6b4423', .8, .8, .5, .95, 1.6, .5, 0, Math.PI / 2, 0);
  if (o.staff) { pt(g, 'cyl', '#6b4423', .07, 3, .07, .95, 1.6, .4); pt(g, 'ico', glow(o.heal ? '#7dff9a' : '#c77dff', 2.5), .25, .25, .25, .95, 3.2, .4); }
  if (o.monocle) pt(g, 'tor', matMetal('#ffd24a'), .16, .16, .16, .3, 2.6, .72);
  if (o.otter) { tail.scale.set(.42, .8, .42); tail.rotation.x = -1.15; tail.position.y = .7; pt(g, 'box', '#f3d9b1', .9, .03, .03, 0, 2.34, .82); }
  Object.assign(g.userData, { tail, eyes }); return g;
}

/* ───────── QUADRUPÈDE (renard, sanglier, blaireau) ───────── */
const OREILLE_P = [[0, -.22], [.2, -.05], [.06, .4], [0, .46], [-.06, .4], [-.2, -.05]];
function mQuad1(c, o = {}) {
  const g = new THREE.Group(), dk = o.fox ? '#3a2a22' : shade(c, .8), clair = '#f6efe6';
  pm(g, pg('qd_corps', () => volume([[0, 1.3, -1.5, .05, .05], [0, 1.24, -1.2, .56, .54], [0, 1.1, -.45, .8, .74], [0, 1.1, .3, .8, .76], [0, 1.22, .85, .66, .64], [0, 1.4, 1.2, .4, .4]], { sous: .2, rad: 16 })), c);
  pm(g, pg('qd_tete', () => volume([[0, 1.5, .8, .05, .05], [0, 1.55, 1.02, .5, .48], [0, 1.55, 1.3, .62, .57], [0, 1.5, 1.58, .5, .44], [0, 1.44, 1.86, .3, .25], [0, 1.42, 2.0, .2, .17]], { sous: .12 })), c);
  pm(g, pg('qd_museau', () => volume([[0, 1.45, 1.74, .05, .05], [0, 1.43, 1.86, .3, .24], [0, 1.4, 2.1, .2, .16], [0, 1.4, 2.26, .13, .11], [0, 1.4, 2.32, .03, .03]], { rad: 12 })), o.fox ? clair : '#3a2a22');
  pt(g, 'sph', '#15121a', .1, .085, .085, 0, 1.44, 2.3);
  if (o.fox) { pm(g, pg('qd_poitrail', () => volume([[0, 1.3, 1.1, .04, .04], [0, 1.0, 1.0, .4, .3], [0, .72, .55, .5, .28], [0, .62, 0, .4, .2], [0, .62, -.4, .04, .04]], { rad: 12 })), clair); for (const s of [1, -1]) pt(g, 'sph', clair, .22, .2, .3, s * .34, 1.38, 1.62); }
  for (const s of [1, -1]) { pm(g, pg('qd_oreille', () => plaque(OREILLE_P, .09)), c, s * .36, 2.08, 1.2, -.15, 0, s * -.22, 1.1); pm(g, pg('qd_oreille', () => plaque(OREILLE_P, .09)), o.fox ? '#2a1c18' : '#e8b8a0', s * .36, 2.06, 1.25, -.15, 0, s * -.22, .62); }
  const eyes = yeux(g, 1.68, 1.72, .27, .95, false);
  const legs = []; for (const [x, z] of [[.45, .8], [-.45, .8], [.45, -.8], [-.45, -.8]]) { const L = grp(g, x, .95, z); pm(L, pg('qd_patte', () => volume([[0, .12, 0, .05, .05], [0, 0, 0, .25, .27], [0, -.45, .02, .16, .17], [0, -.8, .04, .17, .2], [0, -.93, .08, .05, .05]], { rad: 10 })), dk); legs.push(L); }
  const tail = grp(g, 0, 1.3, -1.3);
  if (o.fox) { pm(tail, pg('qd_queue', () => volume([[0, 0, .1, .08, .08], [0, .08, -.25, .3, .3], [0, .16, -.75, .42, .42], [0, .2, -1.1, .3, .3]], { sous: .15 })), c); pm(tail, pg('qd_queue2', () => volume([[0, .18, -.95, .05, .05], [0, .2, -1.1, .31, .31], [0, .22, -1.4, .2, .2], [0, .24, -1.62, .04, .04]], { rad: 12 })), clair); }
  if (o.boar) { for (const s of [1, -1]) pt(g, 'cone', clair, .1, .45, .1, s * .3, 1.5, 1.9, -.5); for (let i = 0; i < 6; i++) pm(g, pg('go_plume', () => plaque(PLUME_F, .08)), '#2a1a12', 0, 1.82 - Math.abs(i - 2) * .03, .75 - i * .34, -.5, Math.PI / 2, 0, 1, .55, 1); }
  if (o.badger) { pm(g, pg('qd_raie', () => volume([[0, 1.5, 2.0, .03, .03], [0, 1.72, 1.7, .13, .1], [0, 2.02, 1.3, .2, .12], [0, 1.9, .6, .2, .1], [0, 1.82, -.4, .2, .1], [0, 1.66, -1.2, .1, .06]], { rad: 10 })), '#f2f2ee'); pt(g, 'sph', '#f2f2ee', .3, .3, .3, 0, 1.38, 1.86); pm(tail, pg('qd_queueb', () => volume([[0, 0, .1, .05, .05], [0, 0, -.2, .28, .28], [0, 0, -.55, .16, .16]], { rad: 10 })), '#3a3632'); }
  if (o.tab) pt(g, 'cyl', o.tab, .64, .22, .64, 0, 1.42, .82, Math.PI / 2.4);
  Object.assign(g.userData, { legs, tail, eyes }); return g;
}

/* ───────── BULLDOG (les Molosses) ─────────
   Trapu, poitrail large et hanches étroites, face écrasée, bajoues pendantes, mâchoire du bas en avant, pattes arquées. */
function mBulldog1(c, o = {}) {
  const g = new THREE.Group(), D = '#1a1614', Wt = '#e8e2d6', l = o.lean ? .8 : 1, cle = o.lean ? 'm' : 'g', Cs = shade(c, .78);
  pm(g, pg('bd_corps' + cle, () => volume([[0, 1.46, -1.8, .05, .05], [0, 1.42, -1.52, .62 * l, .62], [0, 1.3, -.8, .92 * l, .86], [0, 1.26, .1, 1.3 * l, 1.12], [0, 1.4, .9, 1.42 * l, 1.2], [0, 1.66, 1.5, .86, .82]], { sous: .22, rad: 18 })), c);
  pm(g, pg('bd_poitrail' + cle, () => volume([[0, 1.5, 1.62, .04, .04], [0, 1.02, 1.46, .78 * l, .42], [0, .66, .8, .8 * l, .32], [0, .6, 0, .5 * l, .2], [0, .64, -.5, .04, .04]], { rad: 12 })), Wt);
  pm(g, pg('bd_tete', () => volume([[0, 1.95, .98, .05, .05], [0, 2.06, 1.3, .98, .9], [0, 2.04, 1.75, 1.14, .99], [0, 1.92, 2.14, 1.02, .82], [0, 1.86, 2.38, .7, .55], [0, 1.85, 2.48, .08, .08]], { sous: .15, rad: 18 })), c);
  pm(g, pg('bd_museau', () => volume([[0, 1.72, 2.16, .05, .05], [0, 1.7, 2.38, .74, .42], [0, 1.7, 2.62, .6, .35], [0, 1.72, 2.74, .08, .08]], { rad: 14 })), D);
  pm(g, pg('bd_machoire', () => volume([[0, 1.3, 1.9, .05, .05], [0, 1.24, 2.2, .66, .22], [0, 1.28, 2.6, .56, .2], [0, 1.33, 2.84, .08, .08]], { rad: 12 })), Cs);
  pt(g, 'sph', '#0a0808', .19, .14, .1, 0, 1.92, 2.74);
  pt(g, 'box', D, .74, .05, .1, 0, 2.08, 2.4, .5); pt(g, 'box', D, .6, .05, .1, 0, 2.24, 2.26, .7);            // plis du front
  for (const s of [1, -1]) { pt(g, 'sph', c, .5, .62, .5, s * .58, 1.46, 2.28);                                        // bajoues
    pt(g, 'cone', '#f6f1e4', .11, .34, .11, s * .32, 1.5, 2.7);                                                       // crocs du bas
    pt(g, 'sph', glow('#ff1a0a', 3.2), .13, .1, .08, s * .42, 2.2, 2.42); pt(g, 'box', D, .52, .14, .2, s * .42, 2.38, 2.36, 0, 0, s * -.4);
    pm(g, pg('qd_oreille', () => plaque(OREILLE_P, .09)), Cs, s * .98, 2.5, 1.5, .1, 0, s * -2.0, 1.3); }
  const legs = []; for (const [x, z, av] of [[.92, .9, 1], [-.92, .9, 1], [.62, -1.15, 0], [-.62, -1.15, 0]]) { const L = grp(g, x * l, 1.0, z);
    const J = grp(L, 0, 0, 0); J.rotation.z = Math.sign(x) * (av ? .22 : .1);                                          // pattes arquées
    pm(J, pg('bd_patte', () => volume([[0, .15, 0, .05, .05], [0, 0, 0, .4, .42], [0, -.5, .02, .29, .3], [0, -.8, .04, .32, .36], [0, -.96, .1, .05, .05]], { rad: 12 })), c, 0, 0, 0, 0, 0, 0, av ? 1 : .86);
    pt(J, 'sph', Wt, av ? .36 : .3, .16, av ? .42 : .36, 0, -.88, .12); legs.push(L); }
  const tail = grp(g, 0, 1.6, -1.6); pm(tail, pg('bd_queue', () => volume([[0, 0, .1, .05, .05], [0, .02, -.1, .2, .2], [0, .12, -.4, .12, .12], [0, .2, -.5, .03, .03]], { rad: 8 })), c);
  const col = new THREE.Mesh(GEO.tor, matMetal('#3a3a40')); col.scale.set(1, 1, 2.6); col.position.set(0, 1.62, 1.2); col.rotation.x = .25; g.add(col);
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; pt(g, 'cone', matMetal('#c8ccd4'), .1, .42, .1, Math.cos(a) * 1.08, 1.62 + Math.sin(a) * 1.08, 1.2 + Math.sin(a) * .25, Math.PI / 2, 0, a - 1.571); }
  if (o.horn) pt(g, 'cone', '#d8d2c2', .2, 1.1, .2, .9, 1.9, 2.3, 1.2, 0, -.6);
  if (o.king) { pt(g, 'cyl', matMetal('#ffd24a'), .62, .3, .62, 0, 2.98, 1.7); for (let i = 0; i < 6; i++) pt(g, 'cone', matMetal('#ffd24a'), .11, .42, .11, Math.cos(i * 1.047) * .55, 3.31, 1.7 + Math.sin(i * 1.047) * .55); pt(g, 'box', '#6a0a0a', 2.6, .12, 3, 0, 2.05, -.6, -.12); pt(g, 'sph', matMetal('#55585f'), 1.34, .7, 1.3, 0, 1.75, .2); const gr = new THREE.Mesh(GEO.ico, glow('#ffe9a0', 3)); gr.scale.setScalar(.3); gr.position.set(0, .75, 1.85); g.add(gr); }
  Object.assign(g.userData, { tail, legs }); return g;
}

/* ───────── ANIMATION ─────────
   Même fonction qu'avant (appelée par le jeu pour ennemis, alliés et villageois), en plus fluide :
   départs et arrêts adoucis, balancement de la tête, queue qui remue, clignement des yeux. */
function animChar2(o, dt, atk) {
  const m = o.m, u = m.userData, A = u.an || (u.an = { k: o.moving ? 1 : 0, a: 0, bl: 1 + Math.random() * 4, lg: 0, h: 0, pa: false });
  A.k += ((o.moving ? 1 : 0) - A.k) * Math.min(1, dt * 10); A.a += ((atk ? 1 : 0) - A.a) * Math.min(1, dt * 16);
  if (A.pa && !atk) A.lg = 1; A.pa = !!atk; A.lg = Math.max(0, (A.lg || 0) - dt * 3.2);                 // l'élan se termine : le coup part
  A.h = (A.h || 0) + (((o.hit > 0) ? 1 : 0) - (A.h || 0)) * Math.min(1, dt * 22);                        // coup reçu : recul
  const t = o.t || 0, w = Math.sin(t * 11) * A.k, coup = Math.sin(A.lg * 3.1416);
  m.position.y = Math.abs(w) * .3; m.rotation.z = w * .1;
  m.rotation.x = -.22 * A.a + .32 * coup - .38 * A.h; m.position.z = -.25 * A.a + .8 * coup - .3 * A.h;   // se ramasse, bondit, encaisse
  if (u.tail) { u.tail.rotation.x = Math.sin(t * 3) * .15 + A.k * .2 + A.a * .5; u.tail.rotation.y = Math.sin(t * 5.5) * (.1 + A.k * .12); }
  if (u.neck) u.neck.rotation.x = lerp(Math.sin(t * 2) * .05 + Math.sin(t * 22) * .05 * A.k, -.35, A.a) + .9 * coup;
  if (u.legs) for (let i = 0; i < 4; i++) if (u.legs[i]) u.legs[i].rotation.x = Math.sin(t * 11 + (i % 3 ? 0 : 3.14)) * .6 * A.k + (i < 2 ? -.5 : .3) * coup;
  if (u.legL) { u.legL.rotation.x = w * .75; u.legR.rotation.x = -w * .75; }
  if (u.wl) { const f = lerp(lerp(.03 + Math.sin(t * 2.2) * .03, .1 + Math.abs(w) * .12, A.k), .7, Math.max(A.a, coup)) + A.h * .5; u.wl.rotation.z = -f; u.wr.rotation.z = f; }
  cligne(u, A, dt);
}
function cligne(u, A, dt) { if (!u.eyes) return; A.bl -= dt; u.eyes.scale.y = A.bl < .11 ? .12 : 1; if (A.bl < 0) A.bl = 1.8 + Math.random() * 4.5; }
/* yeux de Plume et des villageois immobiles : le jeu ne passe pas par animChar pour eux */
function persoTick(dt) {
  if (typeof P !== 'undefined' && P.m && state === 'play') { const m = P.m, u = m.userData, A = u.an || (u.an = { bl: 2, h: 0 }), sc = P.sc || 1; cligne(u, A, dt);
    // le jeu pose Plume à chaque image ; on ajoute par-dessus les nuances de chaque état
    A.h = (A.h || 0) + ((P.hurtT > .2 && !P.dead ? 1 : 0) - (A.h || 0)) * Math.min(1, dt * 20);
    m.scale.x = m.scale.z = sc * (1 + A.h * .14); m.position.z = 0;
    if (!P.dead && P.roll <= 0) {
      if (P.atkT > 0) { const k = Math.sin((1 - P.atkT / .2) * 3.1416); m.position.z = k * .55; m.rotation.x += k * .12; u.wl.rotation.z -= k * .25; }           // fente
      else if (P.swim) { const s = Math.sin(time * 9); u.legL.rotation.x = s * .9; u.legR.rotation.x = -s * .9; m.position.y += Math.sin(time * 3.2) * .09; m.rotation.x += Math.sin(time * 3.2 + 1) * .04; u.wl.rotation.z = -.22; u.wr.rotation.z = .22; u.neck.rotation.x = .12 + Math.sin(time * 3.2) * .05; }   // nage : pattes qui pagaient
      else if (P.alt > .5) { u.legL.rotation.x = u.legR.rotation.x = 1.05; m.rotation.x += .16; u.neck.rotation.x = .3; }                                      // vol : pattes repliées, cou tendu
      else if (P.walk) { m.rotation.x += .07; u.neck.rotation.x += Math.sin(P.walk * 2) * .05; }                                                                // course : penchée en avant
      m.rotation.x -= A.h * .3;
    } }
  for (const d of DYING) { const k = Math.min(1, d.t / .55); d.m.position.y = Math.sin(k * 3.1416) * 1.3 - k * k * .6; d.m.rotation.x = -k * 1.3; }         // défaite : petit saut, puis à la renverse
  if (area === 'world') for (const n of NPCS) { if (Math.abs(n.x - P.x) > 70 || Math.abs(n.z - P.z) > 70) continue; const u = n.m.userData; cligne(u, u.an || (u.an = { k: 0, a: 0, bl: 1 + Math.random() * 4 }), dt); }
}

/* branchement : le jeu appelle animChar ; on y met la version fluide, et on ajoute les clignements à chaque image */
animChar = animChar2;
{ const u0 = update; update = function (dt) { u0(dt); persoTick(dt); }; }
