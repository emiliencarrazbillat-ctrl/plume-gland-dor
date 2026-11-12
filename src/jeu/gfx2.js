'use strict';
/* ═══════════════════════════════════════════════════════════════════════════════════════════
   gfx2.js — le nouveau rendu (refonte visuelle). Chargé juste après gfx.js, dans le même espace.
   Tout ce qui est ici est purement visuel : aucune règle du jeu, aucune collision, aucune caméra.
   Contenu : textures, post-traitement (halo, occlusion ambiante, étalonnage), ciel, eau à reflets,
   matière du sol, matières des constructions, végétation.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */

/* ───────── TEXTURES ───────── */
const UTEX = { value: 0 }, TEXC = {}; let texAttendues = 0, texPretes = 0;
function TEX(nom, couleur) {
  if (TEXC[nom]) return TEXC[nom];
  texAttendues++;
  const t = new THREE.TextureLoader().load(window.RENDU.tex[nom], () => { if (++texPretes >= texAttendues) UTEX.value = 1; });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = couleur ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4;
  return TEXC[nom] = t;
}
/* couleur moyenne (linéaire) de chaque texture : on ne garde d'elles que le grain, la teinte vient du jeu */
const MOY = { herbe: 'vec3(.313,.231,.102)', sable: 'vec3(.224,.171,.107)', terre: 'vec3(.068,.039,.019)', roche: 'vec3(.167,.118,.048)', neige: 'vec3(.380,.378,.389)',
  tuiles: 'vec3(.305,.085,.026)', crepi: 'vec3(.408,.366,.350)', bois: 'vec3(.191,.100,.041)', paves: 'vec3(.276,.226,.146)' };

/* carte de vaguelettes, fabriquée au chargement (répétable sans raccord) */
function texVagues() {
  const N = 256, h = new Float32Array(N * N), r = rng(77), W8 = [];
  for (let i = 0; i < 26; i++) { const fx = Math.round((r() - .5) * 2 * (2 + i * .55)), fy = Math.round((r() - .5) * 2 * (2 + i * .55)); if (!fx && !fy) continue; W8.push([fx, fy, r() * 6.283, 1 / Math.pow(Math.hypot(fx, fy), 1.15)]); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let v = 0; for (const w of W8) v += Math.sin((x * w[0] + y * w[1]) / N * 6.283 + w[2]) * w[3]; h[y * N + x] = v; }
  const d = new Uint8Array(N * N * 4), at = (x, y) => h[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = (at(x + 1, y) - at(x - 1, y)) * 2.2, dy = (at(x, y + 1) - at(x, y - 1)) * 2.2, l = Math.hypot(dx, dy, 1), k = (y * N + x) * 4; d[k] = (-dx / l * .5 + .5) * 255; d[k + 1] = (-dy / l * .5 + .5) * 255; d[k + 2] = (1 / l * .5 + .5) * 255; d[k + 3] = clamp(at(x, y) * .25 + .5, 0, 1) * 255; }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}

/* ───────── POST-TRAITEMENT ───────── */
const TM_GLSL = 'vec3 plumeTM(vec3 c){c=max(c,0.);vec3 t=max(c-.55,0.)/.45;return mix(c,.55+.45*(1.-exp(-t)),step(.55,c));}';
const Final2 = {
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader: `uniform sampler2D tD,tZ;uniform vec2 uRes;uniform float uHurt,uNear,uFar,uAO,uExp;varying vec2 vUv;
 ${TM_GLSL}
 float lz(vec2 uv){float n=texture2D(tZ,uv).x*2.-1.;return 2.*uNear*uFar/(uFar+uNear-n*(uFar-uNear));}
 float hh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){vec3 c=min(texture2D(tD,vUv).rgb,vec3(8.));float d=lz(vUv);
  // occlusion ambiante : assombrit les creux et le pied des objets
  float ao=0.;if(uAO>0.&&d<uFar*.6){float rot=hh(gl_FragCoord.xy)*6.283;vec2 rad=vec2(uRes.y/uRes.x,1.)*(1.25/(d*.728));
   for(int i=0;i<8;i++){float a=rot+float(i)*.7854;float k=.45+.55*fract(float(i)*.618+hh(gl_FragCoord.yx));float ds=lz(vUv+vec2(cos(a),sin(a))*rad*k);float df=d-ds;ao+=smoothstep(.12,.7,df)*(1.-smoothstep(1.6,3.4,df));}
   ao/=8.;}
  c*=1.-uAO*ao;
  c=plumeTM(c*uExp);
  float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.1);
  c=mix(c,c*c*(3.-2.*c),.22);                                   // un peu de contraste
  vec2 q=vUv-.5;float v=smoothstep(.95,.35,length(q));c*=mix(.86,1.,v);c=mix(c,vec3(.85,.04,.04),uHurt*(1.-v)*.85);
  c=pow(clamp(c,0.,1.),vec3(1./2.2));gl_FragColor=vec4(c,1.);}`
};
const MIR = { rt: null, cam: new THREE.PerspectiveCamera(), tm: new THREE.Matrix4(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), .08), on: { value: 0 }, tex: { value: null }, vu: false };
function applyQuality2() {
  const pr = Math.min(window.devicePixelRatio || 1, [1, 1.25, 1.5][quality]); renderer.setPixelRatio(pr); const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  sun.shadow.mapSize.set(quality ? 2048 : 1024, quality ? 2048 : 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  sun.shadow.radius = quality ? 2.2 : 1.2;
  if (rtS) { rtS.dispose(); rtS = null; } if (MIR.rt) { MIR.rt.dispose(); MIR.rt = null; } MIR.on.value = 0; MIR.vu = false;
  composer = null; gradePass = null; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.CustomToneMapping; renderer.toneMappingExposure = 1.06;
  if (quality > 0 && THREE.FullScreenQuad && THREE.UnrealBloomPass) {
    try {
      hdr = !!renderer.extensions.get('EXT_color_buffer_float'); const Wd = Math.round(w * pr), Hd = Math.round(h * pr), type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
      rtS = new THREE.WebGLRenderTarget(Wd, Hd, { format: THREE.RGBAFormat, type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, samples: quality === 2 ? 4 : 0 });
      rtS.depthTexture = new THREE.DepthTexture(Wd, Hd); rtS.depthTexture.type = THREE.UnsignedIntType;
      bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(Wd >> 1, Hd >> 1), hdr ? .3 : .14, .55, hdr ? 1.3 : .96);
      finalMat = new THREE.ShaderMaterial({ uniforms: { tD: { value: rtS.texture }, tZ: { value: rtS.depthTexture }, uRes: { value: new THREE.Vector2(Wd, Hd) }, uHurt: { value: 0 }, uNear: { value: cam.near }, uFar: { value: cam.far }, uAO: { value: .5 }, uExp: { value: 1.06 } }, vertexShader: Final2.vertexShader, fragmentShader: Final2.fragmentShader, depthTest: false, depthWrite: false });
      fsq = new THREE.FullScreenQuad(finalMat); gradePass = finalMat; composer = true; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      const k = quality === 2 ? .5 : .34; MIR.rt = new THREE.WebGLRenderTarget(Math.round(Wd * k), Math.round(Hd * k), { format: THREE.RGBAFormat, type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); MIR.tex.value = MIR.rt.texture;
    } catch (e) { if (rtS) rtS.dispose(); rtS = null; composer = null; gradePass = null; MIR.rt = null; renderer.outputColorSpace = THREE.SRGBColorSpace; }
  }
  if (typeof GRASS !== 'undefined' && GRASS) GRASS.geometry.instanceCount = [0, 5000, 12000][quality];
}
/* y a-t-il de l'eau à l'écran ? (inutile de calculer le reflet sinon) */
function eauEnVue() { const x = UP.value.x, z = UP.value.z; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 1; j++) if (height(x + i * 22, z + j * 24 - 10) < .25) return true; return false; }
const _mp = new THREE.Vector3(), _ml = new THREE.Vector3(), _mu = new THREE.Vector3(), _mr4 = new THREE.Matrix4(), SANSREFLET = [];
function miroir() {
  cam.updateMatrixWorld(); _mp.setFromMatrixPosition(cam.matrixWorld); _mr4.extractRotation(cam.matrixWorld);
  _ml.set(0, 0, -1).applyMatrix4(_mr4).add(_mp); _mu.set(0, 1, 0).applyMatrix4(_mr4);
  const c = MIR.cam; c.position.set(_mp.x, -_mp.y, _mp.z); c.up.set(_mu.x, -_mu.y, _mu.z); c.lookAt(_ml.x, -_ml.y, _ml.z);
  c.fov = cam.fov; c.aspect = cam.aspect; c.near = cam.near; c.far = cam.far; c.updateProjectionMatrix(); c.updateMatrixWorld(); c.matrixWorldInverse.copy(c.matrixWorld).invert();
  MIR.tm.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
  const vis = SANSREFLET.map(o => o.visible); SANSREFLET.forEach(o => { o.visible = false; });
  const au = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; renderer.clippingPlanes = [MIR.plane];
  renderer.setRenderTarget(MIR.rt); renderer.render(scene, c);
  renderer.clippingPlanes = []; renderer.shadowMap.autoUpdate = au; SANSREFLET.forEach((o, i) => { o.visible = vis[i]; }); MIR.on.value = 1;
}
function frame2() {
  if (rtS) {
    renderer.setRenderTarget(rtS); renderer.render(scene, cam); bloomPass.render(renderer, null, rtS, 0, false);
    MIR.vu = area === 'world' && !!MIR.rt && eauEnVue(); if (MIR.vu) miroir(); else MIR.on.value = 0;
    renderer.setRenderTarget(null); fsq.render(renderer);
  } else { MIR.on.value = 0; renderer.setRenderTarget(null); renderer.render(scene, cam); }
}

/* ───────── CIEL ───────── */
const USUND = { value: new THREE.Vector3(.4, .8, .4) }, USUNC = { value: new THREE.Vector3(1, .95, .85) }, UHOR = { value: new THREE.Vector3(.6, .8, 1) }, UZEN = { value: new THREE.Vector3(.2, .45, .9) }, UNUIT = { value: 0 };
let CIEL = null;
function buildCiel() {
  CIEL = new THREE.Mesh(new THREE.SphereGeometry(540, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSunD: USUND, uSunC: USUNC, uHor: UHOR, uZen: UZEN, uNuit: UNUIT },
    vertexShader: 'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform vec3 uSunD,uSunC,uHor,uZen;uniform float uNuit;varying vec3 vD;
     float hs(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
     void main(){vec3 d=normalize(vD);float h=max(d.y,0.);vec3 c=mix(uHor,uZen,pow(h,.5));
      float s=max(dot(d,uSunD),0.);c+=uSunC*(pow(s,10.)*.18+pow(s,90.)*.5+smoothstep(.9992,.9996,s)*6.)*(1.-uNuit*.6);
      vec3 g=floor(d*90.);float st=step(.9965,hs(g))*smoothstep(.05,.3,d.y);c+=vec3(.9,.95,1.)*st*uNuit*(.6+.6*hs(g+3.));
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
     }` }));
  CIEL.frustumCulled = false; CIEL.renderOrder = -10; scene.add(CIEL);
}

/* ───────── EAU ───────── */
const URIP = { value: new THREE.Vector4(0, 0, 0, 0) };
function eauMaterial() {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    uniforms: { uT: UT, uH: { value: HT }, uW: { value: WT }, uCl: { value: CT }, uFog: { value: scene.fog.color }, uLight: ULIGHT, uSun: USUN, uFn: UFN, uFf: UFF, uN: { value: texVagues() }, uRef: MIR.tex, uTM: { value: MIR.tm }, uRefOn: MIR.on, uSunD: USUND, uSunC: USUNC, uHor: UHOR, uZen: UZEN, uRip: URIP },
    vertexShader: 'varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader: `uniform float uT,uSun,uFn,uFf,uRefOn;uniform sampler2D uH,uW,uCl,uN,uRef;uniform mat4 uTM;uniform vec3 uFog,uLight,uSunD,uSunC,uHor,uZen;uniform vec4 uRip;varying vec3 vW;varying float vD;
 float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 p=vW.xz,uv=p/${WS}.+.5;float h=-2.6,fw=0.;if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.){h=texture2D(uW,uv).r*4.-2.6;fw=smoothstep(.35,.7,texture2D(uH,uv).b);}float dp=-h;
  // vaguelettes : trois couches qui glissent dans des directions différentes
  vec4 a1=texture2D(uN,p*.035+vec2(uT*.011,uT*.007)),a2=texture2D(uN,p*.083+vec2(-uT*.017,uT*.013)),a3=texture2D(uN,p*.21+vec2(uT*.03,-uT*.026));
  vec2 nx=(a1.xy-.5)*1.1+(a2.xy-.5)*.8+(a3.xy-.5)*.5;float calme=smoothstep(.0,.9,dp)*.75+.25;
  // ondes autour de Plume quand elle nage
  vec2 rd=p-uRip.xy;float rl=length(rd);float ring=sin(rl*3.2-uT*5.5)*exp(-rl*.3)*smoothstep(.5,1.6,rl)*uRip.w;nx+=rd/(rl+.01)*ring*.9;
  vec3 N=normalize(vec3(nx.x*calme,1.,nx.y*calme));vec3 V=normalize(cameraPosition-vW);
  // couleur de l'eau selon la profondeur : turquoise transparent au bord, bleu profond au large
  vec3 c=mix(vec3(.13,.80,.70),vec3(.03,.55,.68),smoothstep(.1,.95,dp));c=mix(c,vec3(.012,.26,.52),smoothstep(1.,2.4,dp));
  // jeux de lumière sur le fond, là où l'eau est peu profonde
  float ca=texture2D(uN,p*.16+nx*.04+vec2(uT*.02,0.)).a+texture2D(uN,p*.16*1.7-nx*.05-vec2(0.,uT*.024)).a;float caus=smoothstep(.98,1.22,ca)*(1.-smoothstep(.25,1.5,dp))*smoothstep(.02,.2,dp);
  c+=vec3(.55,.75,.6)*caus*.35*uSun;
  // reflets : la scène vue dans le miroir de l'eau, déformée par les vaguelettes
  vec4 rc=uTM*vec4(vW,1.);vec2 ruv=rc.xy/rc.w+N.xz*.03;vec3 ciel=mix(uHor,uZen,.45);
  vec3 refl=mix(ciel,texture2D(uRef,clamp(ruv,.002,.998)).rgb,uRefOn)*vec3(.82,.95,1.);
  float cosv=max(dot(V,N),0.);float fr=mix(.36,.95,pow(1.-cosv,3.))*smoothstep(.0,.3,dp);
  c=mix(c*uLight,refl,fr);
  // éclats du soleil
  vec3 Hh=normalize(V+uSunD);vec3 N2=normalize(vec3(nx.x*1.6,1.,nx.y*1.6));float sp=pow(max(dot(N2,Hh),0.),220.)*uSun;
  vec2 gc=floor(p*.6);float gh=hs(gc);vec2 gf=fract(p*.6)-.5-(vec2(hs(gc+3.),hs(gc+7.))-.5)*.6;float gl=step(.9,gh)*smoothstep(.5,.95,sin(uT*2.4+gh*60.))*(1.-smoothstep(.015,.06,abs(gf.x)+abs(gf.y)))*uSun*smoothstep(.3,1.,dp);
  c+=uSunC*(sp*2.5+gl*1.6);
  // écume sur le rivage : une frange et deux vagues qui vont et viennent, découpées par un bruit
  float br=a3.a*.6+a2.a*.4;float sh=dp+sin(uT*1.1+vW.x*.4+vW.z*.3)*.022+(br-.5)*.06;
  float pente=smoothstep(.0008,.004,fwidth(dp));float fo=(1.-smoothstep(.02,.07,sh))*smoothstep(.25,.6,br+.12)*pente;float b1=(1.-smoothstep(.02,.05,abs(sh-.2-sin(uT*.8)*.04)))*.9;float b2=(1.-smoothstep(.02,.06,abs(sh-.48-sin(uT*.6+1.)*.06)))*.5*smoothstep(.35,.6,br);
  float fm=max(fo,max(b1,b2)*pente*smoothstep(.3,.55,br+.1));fm=max(fm,smoothstep(.75,1.,abs(ring))*.5*uRip.w);
  c=mix(c,vec3(.97,1.,1.)*uLight,fm*(1.-fw)*.9);
  c*=mix(.82,1.,texture2D(uCl,vW.xz*.0035+uT*.004).r);
  float al=mix(mix(.34,.96,smoothstep(.0,1.1,dp)),1.,max(fm,fw));
  // lave (volcan) : inchangée
  float n=sin(vW.x*.33+uT*1.3)+sin(vW.z*.41-uT*1.1)+sin((vW.x+vW.z)*.21+uT*.7);c=mix(c,vec3(.16,.02,.005),fw);vec3 lv=mix(vec3(1.,.16,.01),vec3(1.,.62,.1),clamp(n/3.+fo*1.2+b1,0.,1.))*(.9+fo*2.6+b1);
  float f=smoothstep(uFn,uFf,vD);gl_FragColor=vec4(mix(c,uFog,f),al);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb+=lv*fw*(1.-f*.6);}` });
}

/* ───────── SOL ───────── */
function solMaterial() {
  const tm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0 });
  tm.onBeforeCompile = s => {
    Object.assign(s.uniforms, { uCl: { value: CT }, uRd: { value: RDT }, uT: UT, uTexOn: UTEX, tG: { value: TEX('herbe_c', 1) }, tGn: { value: TEX('herbe_n') }, tS: { value: TEX('sable_c', 1) }, tSn: { value: TEX('sable_n') }, tD: { value: TEX('terre_c', 1) }, tDn: { value: TEX('terre_n') }, tR: { value: TEX('roche_c', 1) }, tRn: { value: TEX('roche_n') } });
    s.vertexShader = 'varying vec2 vWp;varying float vWy;varying vec3 vNw;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp=transformed.xz;vWy=transformed.y;vNw=normal;');
    s.fragmentShader = 'uniform sampler2D uCl,uRd,tG,tGn,tS,tSn,tD,tDn,tR,tRn;uniform float uT,uTexOn;varying vec2 vWp;varying float vWy;varying vec3 vNw;\n' + s.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
  float p1=texture2D(uCl,vWp*.011).r,p2=texture2D(uCl,vWp*.029+.31).r,p3=texture2D(uCl,vWp*.0045+.6).r;vec3 bs=diffuseColor.rgb;
  bs*=mix(.86,1.,smoothstep(.45,.6,p1));bs=mix(bs,bs*1.12+.01,smoothstep(.66,.76,p2));bs*=mix(.9,1.06,smoothstep(.35,.65,p3));
  float rdd=texture2D(uRd,vWp/${WS}.+.5).r*8.;
  float mR=1.-smoothstep(2.1,2.7,rdd+(p2-.5)*.5);                       // chemin de terre
  float mS=1.-smoothstep(.8,1.3,vWy);                                    // sable des rives
  float mK=smoothstep(.10,.24,1.-vNw.y)*smoothstep(.9,1.6,vWy);          // roche des pentes
  vec2 ua=vWp*.13,ub=vWp*.031+.37;
  vec3 dG=mix(texture2D(tG,ua).rgb,texture2D(tG,ub).rgb,.5)/${MOY.herbe};
  vec3 dS=mix(texture2D(tS,ua*.8).rgb,texture2D(tS,ub).rgb,.4)/${MOY.sable};
  vec3 dD=texture2D(tD,ua*1.2).rgb/${MOY.terre};
  vec3 dK=mix(texture2D(tR,ua*.55).rgb,texture2D(tR,ub*1.3).rgb,.4)/${MOY.roche};
  vec3 det=mix(dG,dS,mS);det=mix(det,dK,mK);det=mix(det,mix(dS,dD,.3),mR);
  det=mix(vec3(dot(det,vec3(.3333))),det,.55);det=mix(vec3(1.),clamp(det,.4,1.8),uTexOn);
  vec3 pth=vec3(.70,.52,.27)*(.92+.1*p2);bs=mix(bs,pth,mR);bs=mix(bs,bs*.62,(1.-smoothstep(.0,.5,abs(rdd-2.8)))*.6);
  bs*=mix(.74,1.,smoothstep(.02,.42,vWy)+step(vWy,-.2));              // sable mouillé au bord de l'eau
  diffuseColor.rgb=bs*det*vec3(.80,.84,.74)*mix(.8,1.,texture2D(uCl,vWp*.0035+uT*.004).r);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  {vec3 nG=texture2D(tGn,ua).xyz*2.-1.,nS=texture2D(tSn,ua*.8).xyz*2.-1.,nD=texture2D(tDn,ua*1.2).xyz*2.-1.,nK=texture2D(tRn,ua*.55).xyz*2.-1.;
   vec3 nm=mix(nG,nS,mS);nm=mix(nm,nK*1.5,mK);nm=mix(nm,mix(nS,nD,.3),mR);
   vec3 nW=normalize(vNw+vec3(nm.x,0.,-nm.y)*.6*uTexOn);normal=normalize((viewMatrix*vec4(nW,0.)).xyz);}`);
  };
  return tm;
}

/* ───────── MATIÈRES DES CONSTRUCTIONS ET DU DÉCOR ─────────
   Les couleurs viennent toujours du jeu (une par pièce). Le shader devine la matière d'après la forme et la teinte :
   pan incliné = toit de tuiles, brun sombre = bois, le reste = crépi/pierre ; puis il ajoute le grain et le relief. */
function decorMaterial(genre) {   // genre : 'bati' | 'feuillage' | 'tronc' | 'roche' | 'simple'
  const m = new THREE.MeshStandardMaterial({ vertexColors: genre === 'bati', roughness: genre === 'feuillage' ? .9 : .82, metalness: 0, flatShading: genre === 'roche' });
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, { uT: UT, uTexOn: UTEX, tA: { value: TEX(genre === 'roche' ? 'roche_c' : genre === 'feuillage' ? 'herbe_c' : 'crepi_c', 1) }, tAn: { value: TEX(genre === 'roche' ? 'roche_n' : genre === 'feuillage' ? 'herbe_n' : 'crepi_n') }, tB: { value: TEX('bois_c', 1) }, tBn: { value: TEX('bois_n') }, tC: { value: TEX('tuiles_c', 1) }, tCn: { value: TEX('tuiles_n') } });
    const vent = genre === 'feuillage' ? 'float sw=sin(uT*1.6+instanceMatrix[3].x*.31+instanceMatrix[3].z*.23);transformed.x+=sw*.07*(position.y+.7);transformed.z+=sw*.045*(position.y+.7);' : '';
    s.vertexShader = 'uniform float uT;varying vec3 vPw,vNw;varying float vLy;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  vLy=position.y;
  #ifdef USE_INSTANCING
   ${vent}
   vPw=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;vNw=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
  #else
   vPw=(modelMatrix*vec4(transformed,1.)).xyz;vNw=normalize(mat3(modelMatrix)*normal);
  #endif`);
    const moyA = genre === 'roche' ? MOY.roche : genre === 'feuillage' ? MOY.herbe : MOY.crepi;
    s.fragmentShader = 'uniform sampler2D tA,tAn,tB,tBn,tC,tCn;uniform float uTexOn;varying vec3 vPw,vNw;varying float vLy;\n' + s.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  vec3 bc=diffuseColor.rgb;vec3 nq=normalize(vNw),an=abs(nq);float lum=dot(bc,vec3(.3,.5,.2));
  float toit=${genre === 'bati' ? 'smoothstep(.3,.45,an.y)*(1.-smoothstep(.93,.97,an.y))' : '0.'};
  float boisM=${genre === 'tronc' ? '1.' : genre === 'bati' ? 'step(bc.g*1.1,bc.r)*step(bc.b*1.2,bc.g)*(1.-smoothstep(.2,.34,lum))*(1.-toit)' : '0.'};
  vec3 ah=an.x>an.z?vec3(0.,0.,1.):vec3(1.,0.,0.);vec3 av=vec3(0.,1.,0.);
  if(an.y>.93){ah=vec3(1.,0.,0.);av=vec3(0.,0.,-1.);}
  vec3 rdir=normalize(cross(nq,vec3(0.,1.,0.))+vec3(1e-4,0.,0.));vec3 sdir=normalize(cross(rdir,nq));
  ah=mix(ah,rdir,toit);av=mix(av,sdir,toit);
  vec2 uvq=vec2(dot(vPw,ah),dot(vPw,av));
  vec3 dA=texture2D(tA,uvq*${genre === 'feuillage' ? '.9' : genre === 'roche' ? '.22' : '.3'}).rgb/${moyA};vec3 dB=texture2D(tB,uvq.yx*.42).rgb/${MOY.bois};vec3 dC=texture2D(tC,uvq*.34).rgb/${MOY.tuiles};
  vec3 det=mix(dA,dB,boisM);det=mix(det,dC,toit);det=mix(vec3(dot(det,vec3(.3333))),det,.45);
  det=mix(vec3(1.),clamp(det,.45,1.7),uTexOn*${genre === 'feuillage' ? '.75' : '.9'});
  ${genre === 'feuillage' ? 'bc*=mix(.58,1.02,smoothstep(-.7,.75,nq.y))*vec3(.86,.9,.8);' : ''}
  diffuseColor.rgb=bc*det;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  {vec3 nA=texture2D(tAn,uvq*${genre === 'feuillage' ? '.9' : genre === 'roche' ? '.22' : '.3'}).xyz*2.-1.,nB=texture2D(tBn,uvq.yx*.42).xyz*2.-1.,nC=texture2D(tCn,uvq*.34).xyz*2.-1.;
   vec3 nm=mix(nA*${genre === 'feuillage' ? '.9' : '.6'},vec3(nB.y,nB.x,nB.z)*.8,boisM);nm=mix(nm,nC*1.3,toit);
   vec3 nW=normalize(nq+(ah*nm.x+av*nm.y)*.7*uTexOn);normal=normalize((viewMatrix*vec4(nW,0.)).xyz);}`);
  };
  return m;
}

/* ───────── VÉGÉTATION ─────────
   Mêmes emplacements et mêmes couleurs qu'avant (listes fabriquées par buildDecor), formes plus fournies,
   et découpage en cases pour ne dessiner que ce qui est à l'écran. */
function bosse(geo, amp, graine) {   // bosselle une forme pour lui donner du volume
  const p = geo.attributes.position, r = rng(graine), ph = [r() * 6, r() * 6, r() * 6, r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = Math.hypot(x, y, z) || 1;
    const k = 1 + amp * (.55 * Math.sin(x * 3.1 + ph[0]) * Math.sin(y * 2.7 + ph[1]) + .45 * Math.sin(z * 3.7 + ph[2]) * Math.sin(x * 2.2 + ph[3]) + .35 * Math.sin(y * 6.3 + ph[4]) * Math.sin(z * 5.9 + ph[5]) + .2 * Math.sin((x + y + z) * 11.));
    p.setXYZ(i, x * k, y * k, z * k); }
  geo.computeVertexNormals(); return geo;
}
function soude(geo) {   // fusionne les sommets identiques pour un ombrage lisse
  const p = geo.attributes.position, map = new Map(), idx = [], pos = [];
  for (let i = 0; i < p.count; i++) { const k = Math.round(p.getX(i) * 1e4) + '_' + Math.round(p.getY(i) * 1e4) + '_' + Math.round(p.getZ(i) * 1e4); let j = map.get(k); if (j === undefined) { j = pos.length / 3; map.set(k, j); pos.push(p.getX(i), p.getY(i), p.getZ(i)); } idx.push(j); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function buildDecorMeshes(L) {
  const boule = bosse(soude(new THREE.IcosahedronGeometry(1, 2)), .2, 5);
  { const n = boule.attributes.normal, p = boule.attributes.position; for (let i = 0; i < n.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = Math.hypot(x, y, z); n.setXYZ(i, lerp(n.getX(i), x / l, .5), lerp(n.getY(i), y / l, .5) + .2, lerp(n.getZ(i), z / l, .5)); } }
  const cone = new THREE.ConeGeometry(1, 1, 12, 4); { const p = cone.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + .16 * Math.sin(a * 6 + y * 9) * (y < .45 ? 1 : 0) + (y < -.2 ? .1 : 0), dy = -.07 * Math.sin(a * 6 + 1) * (y < .45 ? 1 : 0); p.setXYZ(i, p.getX(i) * k, y + dy, p.getZ(i) * k); } cone.computeVertexNormals(); }
  const tronc = new THREE.CylinderGeometry(.72, 1.08, 1, 8, 2); { const p = tronc.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + .08 * Math.sin(a * 3 + p.getY(i) * 4); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } tronc.computeVertexNormals(); }
  const roc = bosse(new THREE.IcosahedronGeometry(1, 1), .22, 9);
  const types = { trunk: [tronc, decorMaterial('tronc'), true], cone: [cone, decorMaterial('feuillage'), true], ball: [boule, decorMaterial('feuillage'), true], rock: [roc, decorMaterial('roche'), true],
    tuft: [new THREE.ConeGeometry(1, 1, 4), new THREE.MeshToonMaterial({ gradientMap: GRAD }), false], flower: [new THREE.SphereGeometry(1, 6, 4), new THREE.MeshToonMaterial({ gradientMap: GRAD }), false] };
  if (L.glow.length) { L.glow.forEach(o => o.c.multiplyScalar(2.6)); types.glow = [new THREE.ConeGeometry(1, 1, 5), new THREE.MeshBasicMaterial({ toneMapped: false }), false]; }
  const CASE = 96, v = new THREE.Vector3();
  for (const k in types) {
    const [geo, mat, ombre] = types[k], cases = new Map();
    for (const o of L[k]) { v.setFromMatrixPosition(o.m); const id = Math.floor(v.x / CASE) + '_' + Math.floor(v.z / CASE); let a = cases.get(id); if (!a) cases.set(id, a = []); a.push(o); }
    for (const list of cases.values()) { const m = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((o, i) => { m.setMatrixAt(i, o.m); m.setColorAt(i, o.c); }); m.castShadow = ombre; m.receiveShadow = ombre; m.computeBoundingSphere(); m.boundingSphere.radius += 2; W.add(m); }
  }
}

/* ───────── ASSEMBLAGE ───────── */
function rendu2Init() {   // appelé à la fin de buildWorld
  cam.layers.enable(1);
  WATER.material.dispose(); WATER.material = eauMaterial();
  buildCiel();
  SANSREFLET.push(WATER, GRASS, RAIN, AMBI);
}
const _sd = new THREE.Vector3();
function rendu2Tick(dt, px, py, pz, tod, bi) {   // appelé à la fin de gfxTick : lumière, ciel, eau
  if (area === 'world') {
    sun.intensity *= lerp(1.2, 1.42, dayF); hemi.intensity *= lerp(1.3, .8, dayF);                                  // soleil plus franc, ombres plus profondes
    hemi.color.setRGB(lerp(.55, .80, dayF), lerp(.66, .90, dayF), 1);          // lumière du ciel, bleutée
    _sd.copy(sun.position).sub(sun.target.position).normalize(); USUND.value.copy(_sd);
    USUNC.value.set(sun.color.r, sun.color.g, sun.color.b).multiplyScalar(lerp(.35, 1.25, dayF));
    const b = scene.background; UHOR.value.set(b.r, b.g, b.b); UZEN.value.set(b.r * lerp(.5, .42, dayF), b.g * lerp(.6, .62, dayF), b.b * lerp(.9, 1.02, dayF)); UNUIT.value = 1 - dayF;
  } else { hemi.color.setRGB(1, 1, 1); UNUIT.value = 1; }
  if (CIEL) { CIEL.position.copy(cam.position); CIEL.visible = area === 'world'; }
  const nage = area === 'world' && typeof P !== 'undefined' && P.g && !P.fly && height(px, pz) < -.05 ? 1 : 0;
  URIP.value.set(px, pz, 0, lerp(URIP.value.w, nage, Math.min(1, dt * 4)));
}
