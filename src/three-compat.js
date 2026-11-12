/* Pont entre le code du jeu (écrit pour Three.js r128, variable globale THREE) et Three.js récent (modules).
   Étape 1 « fondations » : on garde exactement l'ancien rendu. Ces réglages d'héritage seront retirés
   au fur et à mesure que l'éclairage et les matières seront refaits (étape 2 et suivantes). */
import * as T from 'three';

// 1. Couleurs : le jeu convertit lui-même ses couleurs (fonction lin()), comme avant r152.
T.ColorManagement.enabled = false;

// 2. Lumières : avant r155 l'intensité n'était pas divisée par π, et les lampes s'atténuaient linéairement.
const remplace = (chunk, re, par) => { const s = T.ShaderChunk[chunk]; if (!re.test(s)) throw new Error('three-compat : motif introuvable dans ' + chunk); T.ShaderChunk[chunk] = s.replace(re, par); };
const ouBRDF = ['common', 'bsdfs'].find(c => /vec3 BRDF_Lambert\(/.test(T.ShaderChunk[c] || ''));
remplace(ouBRDF, /return RECIPROCAL_PI \* diffuseColor;/, 'return diffuseColor;');
remplace('lights_pars_begin', /float getDistanceAttenuation\([^)]*\)\s*\{[\s\S]*?return distanceFalloff;\s*\}/,
  'float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n\tif ( cutoffDistance > 0.0 && decayExponent > 0.0 ) return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );\n\treturn 1.0;\n}');

// 2 bis. Matière « standard » (le sol) : reflet direct non divisé par π et pas de partage d'énergie reflet/couleur, comme en r128.
remplace('lights_physical_pars_fragment', /reflectedLight\.directSpecular \+= irradiance \* specularBRDF \* material\.multiScatteringCompensation;/, 'reflectedLight.directSpecular += irradiance * PI * specularBRDF;');
remplace('lights_physical_pars_fragment', /reflectedLight\.directDiffuse \+= irradiance \* diffuseBRDF \* \( 1\.0 - F \);/, 'reflectedLight.directDiffuse += irradiance * diffuseBRDF;');
remplace('lights_physical_pars_fragment', /vec3 diffuse = irradiance \* BRDF_Lambert\( material\.diffuseContribution \) \* \( 1\.0 - singleScattering - multiScattering \);/, 'vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );');

// 3. Post-traitement : dans le jeu d'origine il ne s'activait jamais (le code cherchait THREE.Pass.FullScreenQuad,
//    que post.js ne fournissait pas sous ce nom). On garde donc exactement ce que les joueurs voyaient : pas de post-traitement.
//    Halo, occlusion ambiante et étalonnage seront refaits proprement à l'étape 2.

export const THREE = Object.assign({}, T);
window.THREE = THREE;
