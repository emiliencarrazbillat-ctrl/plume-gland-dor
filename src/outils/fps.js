/* Compteur de fluidité, affiché seulement si l'adresse se termine par ?fps
   Montre les images par seconde (moyenne et pire seconde), le nombre de triangles et d'appels de dessin. */
if (new URLSearchParams(location.search).has('fps')) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:50%;bottom:.4em;transform:translateX(-50%);z-index:99;font:bold 13px/1.3 monospace;color:#fff;background:rgba(0,0,0,.65);padding:.3em .7em;border-radius:.5em;pointer-events:none;white-space:nowrap';
  document.body.appendChild(el);
  let n = 0, t0 = performance.now(), last = t0, pire = 0;
  const tick = t => {
    requestAnimationFrame(tick); n++; pire = Math.max(pire, t - last); last = t;
    if (t - t0 >= 1000) {
      const d = window.__dbg, i = d && d.renderer.info.render;
      el.textContent = `${Math.round(n * 1000 / (t - t0))} images/s · image la plus lente ${pire.toFixed(0)} ms` + (i ? ` · ${(i.triangles / 1000).toFixed(0)}k triangles · ${i.calls} appels · qualité ${['basse', 'moyenne', 'élevée'][d.q]}` : '');
      n = 0; t0 = t; pire = 0;
    }
  };
  requestAnimationFrame(tick);
}
