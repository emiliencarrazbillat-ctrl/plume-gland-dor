import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/* Le jeu est écrit en fichiers qui partagent un seul espace de noms et se chargent dans un ordre précis
   (sys2.js redéfinit des fonctions de game.js). Ce greffon les assemble dans cet ordre en un seul module,
   sans toucher à leur contenu : le comportement reste celui des anciennes balises <script>. */
const ORDRE = ['data_old.js', 'data.js', 'data2.js', 'data3.js', 'gfx.js', 'game.js', 'sys2.js', 'boot.js'];
const DOSSIER = path.resolve(import.meta.dirname, 'src/jeu');
function jeu() {
  const ID = '\0virtual:jeu';
  return {
    name: 'plume-jeu',
    resolveId(id) { if (id === 'virtual:jeu') return ID; },
    load(id) {
      if (id !== ID) return;
      let code = '(function(){\n';
      for (const f of ORDRE) { const p = path.join(DOSSIER, f); this.addWatchFile(p); code += `/* ═══ ${f} ═══ */\n` + fs.readFileSync(p, 'utf8') + '\n'; }
      return code + '})();\n';
    },
    handleHotUpdate({ file, server }) { if (file.startsWith(DOSSIER)) { const m = server.moduleGraph.getModuleById(ID); if (m) server.moduleGraph.invalidateModule(m); server.ws.send({ type: 'full-reload' }); return []; } },
  };
}

export default defineConfig({
  base: './',
  plugins: [jeu()],
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
});
