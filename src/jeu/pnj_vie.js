'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   pnj_vie.js — les villageois se promènent près de leur place et rentrent parfois chez eux.
   Chargé après sys2.js, dans le même espace.

   Règles pour ne jamais gêner une quête :
   - un PNJ reste toujours à quelques pas de sa place d'origine (PORTEE) ;
   - il s'arrête dès que Plume approche, et pendant les dialogues ;
   - un PNJ qui a une quête à donner ou à valider (étoile au-dessus de la tête), ou qui tient un service
     (auberge, forge, marchand, recrutement), ne rentre jamais dans une maison ;
   - un PNJ rentré chez lui ressort tout seul dès que Plume s'approche de sa porte, ou dès qu'il a une quête ;
   - sa position (n.x, n.z) suit ses déplacements : flèches de quête, minicarte et « Parler à » restent justes.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
const PNJV = { PORTEE: 4.5, VITESSE: 2.1, RAYON_ACTIF: 95, liste: [], pret: false };
function pnjVieInit() {
  PNJV.pret = true;
  for (const n of NPCS) {
    const d = NPCD[n.id]; n.hx = n.x; n.hz = n.z; n.rot0 = n.g.rotation.y;
    n.col = COL.find(c => c.r === 1.1 && c.x === n.x && c.z === n.z) || null;
    if (!d || d[3] < 0) continue;                                   // seuls les habitants des villages bougent
    const V = VIL[d[3]]; let porte = null, bd = 30;
    for (const c of COL) {                                          // la maison la plus proche, porte tournée vers la place
      if (c.r < 2.5 || c === n.col || Math.hypot(c.x - V.x, c.z - V.z) > 34) continue;
      const dd = Math.hypot(c.x - n.hx, c.z - n.hz); if (dd >= bd) continue;
      const l = Math.hypot(V.x - c.x, V.z - c.z) || 1, px = c.x + (V.x - c.x) / l * (c.r + 1.3), pz = c.z + (V.z - c.z) / l * (c.r + 1.3);
      if (!walkable(px, pz, .5)) continue; bd = dd; porte = { x: px, z: pz, cx: c.x, cz: c.z };
    }
    n.vie = { etat: 'pause', t: 2 + Math.random() * 8, tx: n.x, tz: n.z, porte, dedans: 0, pas: Math.random() * 9, k: 1, casanier: .25 + Math.random() * .5 };
    PNJV.liste.push(n);
  }
}
/* le trajet en ligne droite est-il libre ? (on ignore l'obstacle du PNJ lui-même) */
function pnjLibre(n, x0, z0, x1, z1) {
  const cx0 = n.col ? n.col.x : 0; if (n.col) n.col.x = 1e7;                   // l'obstacle est mis de côté le temps du calcul
  const L = Math.hypot(x1 - x0, z1 - z0), N = Math.max(1, Math.ceil(L / .9)); let ok = true;
  for (let i = 1; i <= N && ok; i++) { const t = i / N; if (!walkable(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, .7)) ok = false; }
  if (n.col) n.col.x = cx0; return ok;
}
function pnjPlace(n, x, z) { n.x = x; n.z = z; n.g.position.set(x, height(x, z), z); if (n.col && !n.vie.absent) { n.col.x = x; n.col.z = z; } }
function pnjObstacle(n, present) { n.vie.absent = !present; if (n.col) { n.col.x = present ? n.x : 1e7; n.col.z = n.z; } }   // un PNJ rentré chez lui ne bloque plus le passage
function pnjSort(n) { const v = n.vie; v.etat = 'sort'; n.g.visible = !hiddenNPC(n.id); pnjObstacle(n, true); }
/* remet tout le monde à sa place d'origine (utilisé par les tests et à l'entrée d'un donjon) */
function pnjMaison() { for (const n of PNJV.liste) { const v = n.vie; v.etat = 'pause'; v.t = 3 + Math.random() * 6; v.k = 1; n.g.scale.setScalar(1); n.g.visible = !hiddenNPC(n.id); pnjObstacle(n, true); pnjPlace(n, n.hx, n.hz); n.g.rotation.y = n.rot0; n.m.position.y = 0; n.m.rotation.z = 0; } }
function pnjTourne(n, a, dt) { let d = a - n.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); n.g.rotation.y += d * Math.min(1, dt * 7); }
function pnjTick(dt) {
  if (!PNJV.pret || area !== 'world' || state !== 'play') return;
  const nuit = dayF < .3, parle = !!DLG || busy;
  for (const n of PNJV.liste) {
    const v = n.vie, dP = Math.hypot(P.x - n.x, P.z - n.z);
    if (hiddenNPC(n.id)) continue;
    if (Math.hypot(P.x - n.hx, P.z - n.hz) > PNJV.RAYON_ACTIF) { if (v.etat !== 'pause' || n.x !== n.hx || n.z !== n.hz) { v.etat = 'pause'; v.k = 1; n.g.scale.setScalar(1); n.g.visible = true; pnjObstacle(n, true); pnjPlace(n, n.hx, n.hz); n.g.rotation.y = n.rot0; n.m.position.y = 0; n.m.rotation.z = 0; } continue; }
    const occupe = !!n.markT || !!n.role;                        // quête ou service : reste dehors
    let bouge = false;
    if (v.etat === 'dedans') {
      v.dedans -= dt;
      if (n.markT || dP < 6.5 || (v.dedans <= 0 && !nuit)) pnjSort(n);
    } else if (v.etat === 'sort') {                               // réapparaît sur le pas de la porte
      v.k = Math.min(1, v.k + dt * 3); n.g.scale.setScalar(v.k); if (v.k >= 1) { v.etat = v.arrive ? 'pause' : 'marche'; v.arrive = false; v.t = 3; v.tx = n.hx; v.tz = n.hz; }          // puis retourne à sa place
      pnjTourne(n, Math.atan2(P.x - n.x, P.z - n.z), dt);
    } else if (v.etat === 'entre') {                              // disparaît dans la maison
      v.k = Math.max(0, v.k - dt * 3); n.g.scale.setScalar(Math.max(.001, v.k));
      if (v.k <= 0 && v.retour) { v.retour = false; v.bloque = 0; pnjPlace(n, n.hx, n.hz); n.g.rotation.y = n.rot0; v.etat = 'sort'; v.arrive = true; }
      else if (v.k <= 0) { v.etat = 'dedans'; v.dedans = 12 + Math.random() * 25; n.g.visible = false; pnjObstacle(n, false); }
    } else if (parle || dP < 6) {                                 // Plume est là : on s'arrête et on la regarde
      if (dP < 9) pnjTourne(n, Math.atan2(P.x - n.x, P.z - n.z), dt);
      if (v.etat === 'porte' && occupe) v.etat = 'pause';
    } else if (v.etat === 'pause') {
      v.t -= dt;
      if (v.t <= 0 && Math.hypot(n.x - n.hx, n.z - n.hz) > PNJV.PORTEE + .3) {
        if (pnjLibre(n, n.x, n.z, n.hx, n.hz) && (v.bloque || 0) < 4) { v.etat = 'marche'; v.tx = n.hx; v.tz = n.hz; }
        else if ((v.bloque = (v.bloque || 0) + 1) >= 4) { v.etat = 'entre'; v.retour = true; } else v.t = 1.5;
      } else if (v.t <= 0) {
        if (v.porte && !occupe && Math.random() < (nuit ? .9 : v.casanier * .45) && pnjLibre(n, n.x, n.z, v.porte.x, v.porte.z)) { v.etat = 'porte'; v.tx = v.porte.x; v.tz = v.porte.z; }
        else { const a = Math.random() * 6.283, d = 1.5 + Math.random() * (PNJV.PORTEE - 1.5), tx = n.hx + Math.cos(a) * d, tz = n.hz + Math.sin(a) * d;
          if (pnjLibre(n, n.x, n.z, tx, tz)) { v.etat = 'marche'; v.tx = tx; v.tz = tz; } else v.t = 1 + Math.random() * 2; }
      }
    } else {                                                        // 'marche' ou 'porte'
      if (v.etat === 'porte' && occupe) { v.etat = 'pause'; v.t = 1; }
      else {
        const dx = v.tx - n.x, dz = v.tz - n.z, d = Math.hypot(dx, dz), pas = PNJV.VITESSE * dt;
        if (d <= pas) { pnjPlace(n, v.tx, v.tz); if (v.etat === 'porte') { v.etat = 'entre'; } else { v.etat = 'pause'; v.t = 3 + Math.random() * 8; } }
        else { const nx = n.x + dx / d * pas, nz = n.z + dz / d * pas;
          if (pnjLibre(n, n.x, n.z, nx, nz)) { pnjPlace(n, nx, nz); pnjTourne(n, Math.atan2(dx, dz), dt); bouge = true; v.bloque = 0; }
          else { v.etat = 'pause'; v.t = 1 + Math.random() * 2; v.bloque = (v.bloque || 0) + 1; } }          // passage pris : on attend
      }
    }
    // démarche : même animation que les autres personnages
    if (bouge) { v.pas += dt; animChar({ m: n.m, moving: true, t: v.pas }, dt, false); }
    else if (n.m.position.y || n.m.rotation.z) { n.m.position.y = 0; n.m.rotation.z = 0; const u = n.m.userData; if (u.legL) { u.legL.rotation.x = 0; u.legR.rotation.x = 0; } if (u.legs) for (const l of u.legs) if (l) l.rotation.x = 0; }
  }
}
{ const u0 = update; update = function (dt) { u0(dt); pnjTick(dt); };
  const e0 = enterDungeon; enterDungeon = function (id) { pnjMaison(); return e0(id); }; }
