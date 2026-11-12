# Mission : refonte visuelle professionnelle de « Plume & le Gland d'Or »

Tu reprends un jeu vidéo existant, jouable et complet, dont je suis content côté jeu. Ta mission est de lui donner un rendu 3D de niveau professionnel, sans rien casser de ce qui fonctionne. Lis tout ce document avant de toucher au code.

Je suis le créateur du jeu, je ne suis pas développeur. Parle-moi en français, simplement, et montre-moi des images plutôt que du code.

## 1. Le jeu aujourd'hui

« Plume & le Gland d'Or » est un action-RPG en monde ouvert, vu de dessus, dans l'esprit de Cat Quest. On joue Plume, une oie, dans un royaume de clans d'animaux (oies, écureuils, renards, loutres, blaireaux, corbeaux) menacé par les Molosses, des bulldogs qui vivent dans le brouillard.

Le dossier `plume-source/` contient tout le jeu. Il tourne dans un navigateur, sans étape de build : ouvre `index.html`.

| Fichier | Rôle |
|---|---|
| `index.html` | Page, styles, HUD, menus, écran titre |
| `three.min.js`, `post.js` | Three.js r128 et post-traitement (bloom, étalonnage) |
| `data_old.js`, `data.js`, `data2.js`, `data3.js` | Données : objets, ennemis, PNJ, biomes, villages, clans, forts, donjons, énigmes, quêtes |
| `gfx.js` | Tout le rendu : terrain, eau, végétation, maisons, modèles des personnages, jour/nuit, météo |
| `game.js` | Moteur : état, sauvegarde, combat, quêtes, guerre, donjons, dialogues, entrées, boucle |
| `sys2.js` | Systèmes ajoutés : quêtes générées, village, vol et nage, mini-jeux, raids, menus, minicarte, manette, emplacements de sauvegarde |
| `boot.js` | Démarrage |

Deux particularités du code à connaître avant de modifier quoi que ce soit :

- Les scripts partagent un seul espace global et se chargent dans cet ordre précis : `three.min.js, post.js, data_old.js, data.js, data2.js, data3.js, gfx.js, game.js, sys2.js, boot.js`.
- `sys2.js` remplace ou enveloppe des fonctions de `game.js` en les réassignant (`update`, `hud`, `attack`, `renderMenu`, `hurtEnemy`, etc.). Une fonction que tu lis dans `game.js` n'est donc pas forcément celle qui s'exécute.

Contenu du jeu, pour que tu mesures ce qu'il faut préserver :

- 285 quêtes (histoire principale avec trahisons, quêtes de village, quêtes cachées, quêtes générées).
- 11 biomes : plaine, forêt, collines, marais, neige, désert, automne, côte des orages (pluie), volcan (lave), landes du Molosse (brouillard), plus des îles et des plateaux accessibles seulement en volant.
- 11 villages aux noms comiques (Cancan-les-Bains, Saint-Gland-des-Prés, Pain-Perdu, La Grande-Gadoue, Refuge du Glagla, Goupil-la-Combine, Port-Parapluie, Tape-Dur-le-Terrier, Dernier-Marshmallow…).
- Combat à l'épée, roulade, 7 sorts, armée de recrues, 15 forts à capturer, guerre de clans, 25 donjons, 10 énigmes à runes, secrets et œufs de Pâques.
- Village à développer (10 bâtiments), raids ennemis à repousser, mini-jeux (pêche, course, poursuite, défense, mémoire).
- Capacités débloquées : nager, puis voler.
- Plume évolue visuellement en trois formes selon son niveau : Oison (1 à 7), Oie aventurière (8 à 19), Grande Oie royale (20 et plus).
- Cycle jour/nuit, météo par biome.
- Clavier, souris, tactile et manette (touches de manette modifiables dans le menu).
- Trois emplacements de sauvegarde dans le `localStorage` : clés `plume_gland_s1` à `plume_gland_s3`, `plume_slot`, `plume_pad`.

## 2. Ce que je veux

Un rendu qui donne l'impression d'un vrai jeu commercial, pas d'une démo technique. Aujourd'hui tout est fabriqué en code à partir de sphères, de cubes et de cônes, avec des couleurs à plat. C'est lisible mais ça fait amateur. Je veux franchir un vrai palier.

La direction artistique : un monde stylisé, coloré, lumineux et chaleureux, à la manière de Cat Quest, mais en vraie 3D riche.

- **Décors détaillés et texturés** : vraies matières (bois, pierre, tuiles, herbe, sable, neige, roche), avec du relief et de la nuance.
- **Personnages cartoon avec contour sombre**, seulement eux, pour qu'ils se détachent du décor. Silhouettes très reconnaissables : on doit distinguer une oie d'un écureuil d'un bulldog au premier coup d'œil, et les trois évolutions de Plume entre elles.
- **Eau** : c'est ma priorité numéro un. Turquoise et nette, transparente près du bord avec le fond visible, bleu profond au large, **vrais reflets** du ciel, des arbres et des maisons, écume sur le rivage, vaguelettes, scintillements au soleil, ondes autour des personnages qui nagent.
- **Lumière** : soleil chaud, ombres douces portées par tout (arbres, maisons, personnages), occlusion ambiante, léger bloom, brume de distance, ombres de nuages qui glissent sur le sol, beaux levers et couchers de soleil, nuits bleutées avec fenêtres et lanternes qui éclairent vraiment.
- **Personnages vivants** : vrais modèles 3D animés (repos, respiration, marche, course, attaque, coup reçu, mort, nage, vol), transitions fluides.
- **Villages qui donnent envie de s'y promener** : maisons variées, toits colorés, cheminées qui fument, volets, enseignes, jardins, puits, étals, clôtures, linge, caisses, chemins pavés, ponts, quais, barques.
- **Nature dense** : herbe qui ondule au vent, fleurs, buissons, arbres variés par biome, rochers, falaises, vraies montagnes en arrière-plan.
- **Chaque biome a une identité forte** : palette, végétation, lumière, météo, particules (pétales, feuilles, neige, braises, pluie, lucioles).
- **Combat percutant** : éclats d'impact, traînées d'épée, gros chiffres de dégâts animés, flash blanc sur l'ennemi touché, secousses de caméra, sorts spectaculaires.
- **Interface soignée** : HUD, menus, carte, dialogues et écran titre dans un même style cohérent, lisible sur téléphone.

## 3. Ce qui ne doit pas changer

Le jeu est validé. Tu refais l'image, pas le jeu.

- Mécaniques, combat, dégâts, portées, temps de recharge, progression, équilibrage.
- Quêtes, dialogues, textes, noms, histoire.
- Carte du monde : position des villages, PNJ, forts, donjons, secrets, zones de déclenchement.
- Collisions et zones où l'on peut marcher, nager, voler. Elles dépendent de la fonction `height()` et de `walkable()` : si tu changes la forme du terrain visible, la forme utilisée par le jeu doit rester la même, ou tu me demandes d'abord.
- Angle et distance de la caméra.
- Disposition et logique du HUD et des menus (tu peux tout redessiner, pas réorganiser).
- Commandes clavier, tactile et manette.
- Compatibilité des sauvegardes existantes.

Si une amélioration visuelle t'oblige à toucher à l'un de ces points, arrête-toi et demande-moi avant.

## 4. Ce que tu as le droit de changer

Tu as carte blanche sur la technique, tant que le jeu reste jouable dans un navigateur par un simple lien, sur ordinateur et sur téléphone.

- Passer à une version récente de Three.js, en modules, avec un outil de build (Vite par exemple). Le code actuel repose sur r128 et des scripts globaux : une réorganisation propre en modules est la bienvenue si elle ne change pas le comportement.
- Remplacer les modèles fabriqués en code par de **vrais modèles 3D** (glTF) avec squelette et animations, et les couleurs à plat par de **vraies textures**.
- Utiliser des ressources libres de droits pour un usage commercial, de préférence en licence CC0 (par exemple Quaternius, Kenney, Poly Haven, ambientCG). Note chaque ressource, sa source et sa licence dans un fichier `CREDITS.md`. N'utilise rien dont la licence est douteuse, et rien qui copie un jeu existant : Cat Quest est une inspiration, pas un modèle à reproduire.
- Si aucun modèle libre ne convient pour un animal (une oie avec une épée, par exemple), fabrique-le proprement toi-même plutôt que d'en détourner un qui ne ressemble à rien. Dis-moi lesquels sont dans ce cas.
- Ajouter éclairage physique, carte d'environnement, ombres en cascade, réflexions, occlusion ambiante, anticrénelage, étalonnage des couleurs.

## 5. Contraintes techniques

- **Fluidité** : 60 images par seconde sur un ordinateur portable ordinaire, 30 au minimum sur un téléphone récent. Utilise l'instanciation, les niveaux de détail, le masquage hors champ, des textures compressées.
- **Réglage de qualité** : trois niveaux dans les options (bas, moyen, élevé), plus la baisse automatique qui existe déjà quand le jeu rame. Le niveau bas doit rester beau, sans reflets temps réel ni ombres coûteuses.
- **Poids** : le jeu doit se charger vite. Vise moins de 30 Mo au total, avec un écran de chargement qui montre la progression.
- **Mobile** : commandes tactiles existantes conservées, interface lisible en format vertical et horizontal.

## 6. Méthode de travail

Avance par étapes, et montre-moi une version jouable avec des captures à la fin de chacune. N'enchaîne pas sur l'étape suivante sans mon accord.

0. **État des lieux** : lance le jeu, joue-y, lis le code, puis écris-moi un plan court avec les choix techniques, les ressources que tu comptes utiliser et les risques. Attends ma validation.
1. **Fondations** : mise à niveau technique, sans changement visible. Vérifie que tout marche comme avant.
2. **Tranche de référence** : le village de départ (Cancan-les-Bains) et ses alentours, avec le lac, portés au niveau de qualité final : lumière, eau avec reflets, terrain, végétation, maisons, Plume animée, un ennemi, un PNJ. C'est l'étape la plus importante : on fixe ici le style ensemble avant de l'étendre.
3. **Personnages** : tous les animaux, les trois évolutions de Plume, les alliés, les boss.
4. **Monde** : tous les biomes, villages, forts, donjons, îles.
5. **Effets** : combat, sorts, météo, particules.
6. **Interface** : HUD, menus, carte, dialogues, écran titre.
7. **Optimisation et finitions** : performances, niveaux de qualité, mobile, chargement.

## 7. Vérification

Ne me dis pas qu'une chose marche si tu ne l'as pas vue marcher.

- Avant de commencer, écris des tests automatiques (Playwright) qui servent de filet : le jeu se charge sans erreur, nouvelle partie, déplacement, attaque, sort, dialogue, quête acceptée et terminée, nage, vol, entrée et sortie de donjon, construction d'un bâtiment, sauvegarde et rechargement, changement d'emplacement, manette simulée. Relance-les après chaque étape.
- Vérifie que les 285 quêtes ont toujours un donneur, une cible et un prérequis valides.
- Prends des captures d'écran à chaque étape, aux mêmes endroits, de jour et de nuit, et regarde-les toi-même d'un œil critique : compare-les à ce que ferait un studio, pas à la version précédente. Si une image ne fait pas « jeu professionnel », recommence avant de me la montrer.
- Mesure les images par seconde et le poids du jeu à chaque étape.

## 8. Ce que tu me livres à chaque étape

- Le jeu jouable et la façon de le lancer.
- Des captures avant/après.
- En quelques lignes : ce qui a changé, ce qui reste à faire, ce qui est provisoire, et les points où tu as besoin de ma décision.
- Dis-moi franchement ce qui n'atteint pas encore le niveau voulu et pourquoi, plutôt que d'enjoliver.
