'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   effets.js — effets de combat et de sorts (refonte visuelle). Chargé après perso.js.
   Tout est ajouté PAR-DESSUS les effets du jeu : on appelle d'abord la fonction d'origine (dégâts,
   portées, coûts et temps de recharge inchangés), puis on ajoute lumière, halos, flammes, cristaux…
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
const EFX = []; let FXL = null, HALO_T = null;
function efxInit() {
  FXL = new THREE.PointLight(0xffffff, 0, 46, 1.3); FXL.userData = { i: 0, t: 1, d: 1 }; scene.add(FXL);          // éclair de lumière des sorts
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); HALO_T = new THREE.CanvasTexture(c);
  if (P.swing) { const m = P.swing.material; m.blending = THREE.AdditiveBlending; m.color.multiplyScalar(1.9); }   // traînée d'épée plus lumineuse
}
function efx(m, d, f, delai = 0) { m.visible = delai <= 0; scene.add(m); EFX.push({ m, t: -delai, d, f }); return m; }
function eclairFx(x, y, z, c, i, d = .35) { if (!FXL) return; FXL.position.set(x, y + 3.5, z); FXL.color.copy(lin(c)); FXL.userData = { i, t: 0, d }; }
function haloFx(x, y, z, c, s, d = .3, delai = 0, vy = 0) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO_T, color: lin(c).multiplyScalar(2.2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.position.set(x, y, z); m.renderOrder = 8; efx(m, d, (m, k, dt) => { const q = s * (.35 + .65 * (1 - (1 - k) * (1 - k))); m.scale.set(q, q, 1); m.material.opacity = 1 - k * k; m.position.y += vy * dt; }, delai);
}
function flammeFx(x, y, z, c, h, delai) {
  const m = new THREE.Mesh(GEO.cone, new THREE.MeshBasicMaterial({ color: lin(c).multiplyScalar(3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.position.set(x, y, z); efx(m, .55, (m, k) => { const up = Math.min(1, k * 4), w = .55 * (1 - k * .6) * (1 + Math.sin(k * 40) * .15); m.scale.set(w, h * up * (1 - k * .3), w); m.position.y = y + h * up * .5; m.material.opacity = k < .5 ? 1 : 2 - k * 2; }, delai);
}
function cristalFx(x, y, z, h, delai) {
  const m = new THREE.Mesh(GEO.pyr, new THREE.MeshBasicMaterial({ color: lin('#bfeaff').multiplyScalar(1.7), transparent: true, opacity: .9, toneMapped: false }));
  m.position.set(x, y, z); m.rotation.set(rnd(-.35, .35), rnd(0, 6), rnd(-.35, .35)); efx(m, 1.5, (m, k) => { const up = k < .1 ? k / .1 * 1.2 : k < .16 ? 1.2 - (k - .1) / .06 * .2 : 1; m.scale.set(.45, h * up, .45); m.position.y = y + h * up * .45; m.material.opacity = k < .7 ? .9 : .9 * (1 - (k - .7) / .3); }, delai);
}
function brulureFx(x, y, z, r, c = '#1a0d06') {
  const m = new THREE.Mesh(LPG, new THREE.MeshBasicMaterial({ color: lin(c), transparent: true, opacity: .4, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y + .22, z); m.scale.setScalar(r * .8); m.renderOrder = 1;
  efx(m, 3, (m, k) => { m.material.opacity = .42 * (1 - k * k); });
}
function ondeFx(x, y, z, r, c, delai) { efx(new THREE.Group(), .01, () => { }, 0); EFX[EFX.length - 1].f = () => { }; EFX[EFX.length - 1].d = Math.max(.01, delai); EFX[EFX.length - 1].t = 0; EFX[EFX.length - 1].fin = () => ringFx(x, y, z, r, c); }
function efxTick(dt) {
  if (FXL) { const u = FXL.userData; if (u.t < u.d) { u.t += dt; FXL.intensity = u.i * Math.max(0, 1 - u.t / u.d) ** 2; } else FXL.intensity = 0; }
  for (const e of EFX) { e.t += dt; if (e.t < 0) continue; e.m.visible = true; const k = Math.min(1, e.t / e.d); e.f(e.m, k, dt); if (k >= 1) { scene.remove(e.m); if (e.m.material) e.m.material.dispose(); if (e.fin) e.fin(); e.done = 1; } }
  for (let i = EFX.length - 1; i >= 0; i--) if (EFX[i].done) EFX.splice(i, 1);
  if (stormT > 0 && area === 'world' && Math.random() < dt * 6) { const a = Math.random() * 6.283, d = 4 + Math.random() * 12; haloFx(P.x + Math.cos(a) * d, ground(P.x, P.z) + 15 + Math.random() * 3, P.z + Math.sin(a) * d, '#39405a', 9, 1.2); }   // ciel d'orage au-dessus de Plume
}
{ // les éclats du jeu gagnent un halo, et les grosses explosions un souffle et une trace au sol
  const b0 = burst; burst = function (x, y, z, c, n = 8, k = 2.4) { b0(x, y, z, c, n, k); if (!HALO_T) return; if (n >= 8) haloFx(x, y, z, c, 2 + n * .3, .32); if (n >= 16) eclairFx(x, y, z, c, 1.2 + n * .05, .4); if (n >= 30) { ringFx(x, y - .7, z, 9, c); ondeFx(x, y - .7, z, 12, '#ffe08a', .12); brulureFx(x, y - 1, z, 8); haloFx(x, y + 1, z, '#fff2c0', 16, .25); } };
  // sorts : l'effet d'origine d'abord, le spectacle ensuite
  const c0 = cast; cast = function (i) {
    const mp = S ? S.mp : 0; c0(i); if (!S || !HALO_T || S.mp >= mp) return; const x = P.x, z = P.z, y = ground(x, z);
    if (i === 0) { ondeFx(x, y + .3, z, 9.5, '#ff7b2b', .08); brulureFx(x, y, z, 9.5); for (let k = 0; k < 22; k++) { const a = k / 22 * 6.283 + rnd(-.1, .1), d = 2 + (k % 4) * 2.2; flammeFx(x + Math.cos(a) * d, ground(x + Math.cos(a) * d, z + Math.sin(a) * d), z + Math.sin(a) * d, k % 3 ? '#ff7b2b' : '#ffd24a', rnd(2.2, 4.2), d * .028); } haloFx(x, y + 1.5, z, '#ff9a3a', 20, .4); }
    else if (i === 1) { ringFx(x, y + .3, z, 4, '#7dff9a'); for (let k = 0; k < 16; k++) { const a = k * .8; haloFx(x + Math.cos(a) * 1.6, y + .5 + (k % 4) * .5, z + Math.sin(a) * 1.6, k % 2 ? '#7dff9a' : '#e8ffd0', rnd(.8, 1.6), .9, k * .04, 3.2); } eclairFx(x, y, z, '#7dff9a', 1.6, .6); }
    else if (i === 2) { eclairFx(x, y, z, '#fff68a', 3.2, .25); haloFx(x, y + 3, z, '#fff68a', 9, .2); ringFx(x, y + .3, z, 3, '#fff68a'); }
    else if (i === 3) { ondeFx(x, y + .3, z, 11.5, '#9fe0ff', .08); for (let k = 0; k < 26; k++) { const a = k / 26 * 6.283 + rnd(-.12, .12), d = 2.5 + (k % 5) * 2.1; cristalFx(x + Math.cos(a) * d, ground(x + Math.cos(a) * d, z + Math.sin(a) * d), z + Math.sin(a) * d, rnd(1.4, 3.2), d * .03); } haloFx(x, y + 1.5, z, '#bfeaff', 22, .45); eclairFx(x, y, z, '#9fe0ff', 2.4, .5); }
    else if (i === 6) { eclairFx(x, y, z, '#cfe0ff', 2.6, .6); for (let k = 0; k < 10; k++) haloFx(x + rnd(-12, 12), y + 15 + rnd(0, 3), z + rnd(-12, 12), '#39405a', 10, 1.4, k * .05); ringFx(x, y + .3, z, 14, '#cfe0ff'); }
    else if (i !== 5) { for (let k = 0; k < 3; k++) ondeFx(x, y + .3, z, 7 + k * 5, '#ffd24a', k * .14); haloFx(x, y + 3, z, '#ffd24a', 14, .5); eclairFx(x, y, z, '#ffd24a', 2.2, .6); }
  };
  const u0 = update; update = function (dt) { u0(dt); efxTick(dt); };
}
