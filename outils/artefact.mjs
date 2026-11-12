/* Fabrique la page « artefact » (un seul fichier HTML sans <html>/<head>/<body>) à partir de dist/.
   Usage : node outils/artefact.mjs <fichier de sortie>
   Le script du jeu est intégré dans la page ; les autres ressources (textures, modèles) restent dans dist/assets
   et sont publiées à côté de la page. Affiche la liste de ces fichiers au format JSON. */
import fs from 'node:fs';
import path from 'node:path';
const dist = path.resolve(import.meta.dirname, '../dist'), out = process.argv[2];
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const title = html.match(/<title>[\s\S]*?<\/title>/)[0], style = html.match(/<style>[\s\S]*?<\/style>/)[0];
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
const src = html.match(/<script type="module"[^>]*src="\.\/(assets\/[^"]+)"/)[1];
let js = fs.readFileSync(path.join(dist, src), 'utf8');
if (js.includes('</script')) throw new Error('le script contient </script');
js = js.replace(/new URL\((["'`])([^"'`]+)\1,\s*import\.meta\.url\)/g, (m, q, p) => `({href:${q}assets/${p.replace(/^\.\//, '')}${q}})`);
fs.writeFileSync(out, `${title}\n${style}\n${body}\n<script type="module">\n${js}\n</script>\n`);
const files = {}; const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else { const rel = path.relative(dist, p); if (rel !== 'index.html' && rel !== src) files[rel] = p; } } }; walk(dist);
console.log(JSON.stringify(files));
