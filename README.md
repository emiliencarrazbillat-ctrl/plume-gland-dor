# Plume & le Gland d'Or

Action-RPG en monde ouvert jouable dans le navigateur.

La mission de refonte visuelle est décrite dans `PROMPT_CLAUDE_CODE.md`. La branche `main` garde le jeu d'origine ; la refonte se fait sur `refonte-visuelle`.

## Lancer le jeu

```bash
npm install
```

```bash
npm run dev
```

Puis ouvrir l'adresse affichée (http://localhost:5173). Ajouter `?fps` à l'adresse pour afficher le compteur d'images par seconde.

Pour fabriquer la version à mettre en ligne (dossier `dist/`) :

```bash
npm run build
```

## Organisation

| Dossier | Rôle |
|---|---|
| `index.html` | Page, styles, HUD, menus, écran titre |
| `src/jeu/` | Le jeu : données (`data*.js`), rendu (`gfx.js`), moteur (`game.js`), systèmes (`sys2.js`), démarrage (`boot.js`). Ces fichiers partagent un seul espace de noms et sont assemblés dans cet ordre par `vite.config.js`. |
| `src/jeu/gfx2.js` | Le nouveau rendu : eau à reflets, sol texturé, matières, ciel, post-traitement |
| `src/jeu/perso.js` | Les personnages : formes des quatre gabarits (oie, écureuil, quadrupède, bulldog) et animation |
| `src/jeu/maisons.js` | Les maisons des autres villages : cabane dans l'arbre, pilotis, igloo, tente, forge, tanière |
| `src/jeu/pnj_vie.js` | Les villageois se promènent et rentrent chez eux (sans jamais bloquer une quête) |
| `src/three-compat.js` | Pont vers Three.js récent (garde le rendu d'origine tant que l'éclairage n'est pas refait) |
| `src/outils/` | Outils de mise au point (compteur de fluidité) |
| `tests/` | Filet de sécurité automatique et captures de comparaison |

## Vérifier que rien n'est cassé

```bash
npm test
```

Dix-sept tests (Playwright) : chargement, 285 quêtes valides, règles identiques au jeu d'origine (relief, zones praticables, positions, textes, équilibrage, caméra), nouvelle partie, déplacement, dialogue et quête, attaque, sort, nage, vol, donjon, construction, sauvegarde et emplacements, anciennes sauvegardes, manette, tactile et menus, villageois vivants.

```bash
npm run captures
```

Prend des captures toujours aux mêmes endroits et aux mêmes heures (dossier `captures/`).

Ressources et licences : voir `CREDITS.md`.
