# Crédits et licences

Chaque ressource utilisée par le jeu est notée ici avec sa source et sa licence.

## Logiciels

| Ressource | Usage | Source | Licence |
|---|---|---|---|
| Three.js 0.187 | Moteur 3D | https://threejs.org | MIT |
| Vite 8 | Outil de construction (non livré avec le jeu) | https://vite.dev | MIT |
| Playwright | Tests automatiques (non livré avec le jeu) | https://playwright.dev | Apache 2.0 |

## Polices

| Police | Usage | Source | Licence |
|---|---|---|---|
| Fredoka | Titres, boutons, noms | https://fonts.google.com/specimen/Fredoka (paquet `@fontsource/fredoka`) | SIL Open Font License 1.1 |
| Nunito | Textes, dialogues, menus | https://fonts.google.com/specimen/Nunito (paquet `@fontsource/nunito`) | SIL Open Font License 1.1 |

## Textures

Toutes viennent de Poly Haven (https://polyhaven.com), licence CC0 (domaine public, usage commercial libre, sans attribution obligatoire). Résolution d'origine 1K, converties en WebP dans `src/assets/tex/` (`_c` = couleur, `_n` = relief).

| Fichier | Texture d'origine | Usage |
|---|---|---|
| `herbe_c.webp`, `herbe_n.webp` | [leafy_grass](https://polyhaven.com/a/leafy_grass) | Sol : herbe |
| `sable_c.webp`, `sable_n.webp` | [coast_sand_01](https://polyhaven.com/a/coast_sand_01) | Sol : sable des rives et chemins |
| `terre_c.webp`, `terre_n.webp` | [stony_dirt_path](https://polyhaven.com/a/stony_dirt_path) | Sol : chemins |
| `roche_c.webp`, `roche_n.webp` | [aerial_rocks_02](https://polyhaven.com/a/aerial_rocks_02) | Sol : pentes rocheuses, rochers |
| `neige_c.webp`, `neige_n.webp` | [snow_02](https://polyhaven.com/a/snow_02) | Sol : Monts Givrés |
| `sousbois_c.webp`, `sousbois_n.webp` | [forest_floor](https://polyhaven.com/a/forest_floor) | Sol : Bois Roux |
| `tuiles_c.webp`, `tuiles_n.webp` | [clay_roof_tiles_02](https://polyhaven.com/a/clay_roof_tiles_02) | Toits |
| `crepi_c.webp`, `crepi_n.webp` | [painted_plaster_wall](https://polyhaven.com/a/painted_plaster_wall) | Murs |
| `bois_c.webp`, `bois_n.webp` | [wood_planks](https://polyhaven.com/a/wood_planks) | Colombages, pontons, troncs |
| `paves_c.webp`, `paves_n.webp` | [cobblestone_floor_04](https://polyhaven.com/a/cobblestone_floor_04) | Sol dallé des donjons |

## Modèles 3D, sons

Aucune ressource externe : les formes (maisons, arbres) sont fabriquées par le code du jeu, et les personnages (oies, écureuils, loutres, renards, sangliers, blaireaux, bulldogs) sont modelés par nous dans `src/jeu/perso.js`, les vaguelettes de l'eau et le ciel sont calculés.
