/* Pont entre le code du jeu (écrit pour Three.js r128, variable globale THREE) et Three.js récent (modules).
   Étape 1 « fondations » : on garde exactement l'ancien rendu. Ces réglages d'héritage seront retirés
   au fur et à mesure que l'éclairage et les matières seront refaits (étape 2 et suivantes). */
import * as T from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

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

// 3. Courbe de rendu des hautes lumières (« tone mapping ») : fidèle dans les tons moyens, douce dans les clairs.
//    La même courbe est utilisée par le post-traitement (gfx2.js) et, en qualité basse, directement par les matières.
remplace('tonemapping_pars_fragment', /vec3 CustomToneMapping\( vec3 color \) \{ return color; \}/,
  'vec3 CustomToneMapping( vec3 color ) {\n\tcolor = max( color * toneMappingExposure, 0.0 );\n\tvec3 t = max( color - 0.55, 0.0 ) / 0.45;\n\treturn mix( color, 0.55 + 0.45 * ( 1.0 - exp( - t ) ), step( 0.55, color ) );\n}');

export const THREE = Object.assign({}, T, { FullScreenQuad, UnrealBloomPass });
window.THREE = THREE;
