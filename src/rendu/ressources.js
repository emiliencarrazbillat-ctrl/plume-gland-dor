/* Adresses des ressources (textures) utilisées par le rendu. Vite les copie dans dist/assets avec un nom unique. */
const fichiers = import.meta.glob('../assets/tex/*.webp', { eager: true, query: '?url', import: 'default' });
const tex = {};
for (const [chemin, url] of Object.entries(fichiers)) tex[chemin.split('/').pop().replace('.webp', '')] = url;
window.RENDU = { tex };
