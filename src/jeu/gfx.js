'use strict';
/* Rendu : monde, shaders, modèles */
const $=id=>document.getElementById(id);
if(!window.THREE){$('title').style.display='flex';$('loaderr').textContent="Le moteur 3D n'a pas pu se charger. Recharge la page.";throw new Error('three missing');}
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function hstr(s){let h=7;for(let i=0;i<s.length;i++)h=Math.imul(h,31)+s.charCodeAt(i)|0;return h>>>0;}
let AC=null,muted=false;
function sfx(f,d=.08,type='square',v=.05,slide=0,delay=0){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime+delay,o=AC.createOscillator(),ga=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.linearRampToValueAtTime(Math.max(30,f+slide),t+d);ga.gain.setValueAtTime(v,t);ga.gain.linearRampToValueAtTime(0,t+d);o.connect(ga);ga.connect(AC.destination);o.start(t);o.stop(t+d+.02);}catch(e){}}
const jingle=()=>[523,659,784,1047].forEach((f,i)=>sfx(f,.14,'triangle',.08,0,i*.1));
const fanfare=()=>[392,523,659,784,1047,1319].forEach((f,i)=>sfx(f,.2,'triangle',.08,0,i*.12));
const horn=()=>{sfx(196,.5,'sawtooth',.06,0);sfx(294,.7,'sawtooth',.06,0,.35);};

/* ───────── MONDE ───────── */
const WS=1400,NB=BIO.length,BW=new Array(NB).fill(0);
function biome(x,z){const bx=x+18*Math.sin(z*.05),bz=z+18*Math.sin(x*.06+2);let b=0,bd=1e12;for(let i=0;i<NB;i++){const d=(bx-BIO[i].x)**2+(bz-BIO[i].z)**2;if(d<bd){bd=d;b=i;}}return b;}
function blend(x,z){const bx=x+18*Math.sin(z*.05),bz=z+18*Math.sin(x*.06+2);let s=0;for(let i=0;i<NB;i++){const d=(bx-BIO[i].x)**2+(bz-BIO[i].z)**2,w=1/((d+700)**4)*1e20;BW[i]=w;s+=w;}for(let i=0;i<NB;i++)BW[i]/=s;}
const gs=(x,z,s)=>Math.exp(-(x*x+z*z)/s);
function height(x,z){const d=Math.hypot(x,z),th=Math.atan2(z,x),R=560+38*Math.sin(3*th+1)+22*Math.sin(7*th);
  let h=3.4+1.6*Math.sin(x*.045+1.3)*Math.cos(z*.04)+Math.sin(x*.11+z*.07)+.35*Math.sin(x*.31)*Math.sin(z*.27);
  h+=7*gs(x+40,z+210,16200)+3*gs(x-175,z+150,9800)+9*gs(x+270,z+190,11000)+2*gs(x-120,z-300,9000)+6*gs(x-310,z+310,12000)+1.5*gs(x-50,z+410,14000);
  h-=9*gs(x-45,z-95,1152)+7.5*gs(x+150,z-150,480)+17*gs(x-340,z+270,500)+17*gs(x-262,z+352,420)+8*gs(x+300,z-250,300)+8*gs(x+395,z-205,260);
  if(d>R-45)h-=((d-R+45)/45)**2*10;
  h=Math.max(h,-3.5);for(const i of ISL){const v=7.5*gs(x-i[0],z-i[1],950)-2.2;if(v>h)h=v;}return h;}
let area='world',DG=null,WMODE=0;const COL=[],COLV=[];
const lavaAt=(x,z)=>biome(x,z)===FIREI&&Math.hypot(x-BIO[FIREI].x,z-BIO[FIREI].z)<240;
function ground(x,z){return area==='world'?Math.max(0,height(x,z)):0;}
function walkable(x,z,r=1){
  if(area==='world'){if(Math.abs(x)>685||Math.abs(z)>685)return false;if(WMODE===2)return true;if(height(x,z)<.3){if(WMODE!==1||lavaAt(x,z))return false;return true;}
    for(const b of BAR){const d=Math.hypot(x-b[0],z-b[1]);if(d>b[2]-r&&d<b[2]+4+r)return false;}
    for(const c of COL)if((x-c.x)**2+(z-c.z)**2<(c.r+r)**2)return false;for(const c of COLV)if((x-c.x)**2+(z-c.z)**2<(c.r+r)**2)return false;return true;}
  if(Math.abs(x)>19||z>5||z<-DG.len+1)return false;if(DG.gate!=null&&z<DG.gate+1)return false;for(const c of DG.col)if((x-c.x)**2+(z-c.z)**2<(c.r+r)**2)return false;return true;}
const RSEG=[];(function(){for(const[a,b]of RLINK){const A=VIL[a],B=VIL[b],dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz),nx=-dz/L,nz=dx/L,N=Math.ceil(L/14);let px=A.x,pz=A.z;for(let i=1;i<=N;i++){const t=i/N,w=Math.sin(t*Math.PI)*Math.sin(t*9+a)*10,x=A.x+dx*t+nx*w,z=A.z+dz*t+nz*w;RSEG.push([px,pz,x,z,Math.min(px,x)-7,Math.max(px,x)+7,Math.min(pz,z)-7,Math.max(pz,z)+7]);px=x;pz=z;}}})();
function roadDist(x,z){let m=99;for(const s of RSEG){if(x<s[4]||x>s[5]||z<s[6]||z>s[7])continue;const vx=s[2]-s[0],vz=s[3]-s[1],t=clamp(((x-s[0])*vx+(z-s[1])*vz)/(vx*vx+vz*vz),0,1),d=Math.hypot(x-s[0]-vx*t,z-s[1]-vz*t);if(d<m)m=d;}return m;}
function nearWalk(x,z){if(walkable(x,z,1.5))return[x,z];for(let r=3;r<110;r+=3)for(let a=0;a<6.28;a+=.4){const nx=x+Math.cos(a)*r,nz=z+Math.sin(a)*r;if(walkable(nx,nz,1.5))return[nx,nz];}return[x,z];}

/* ───────── RENDERER ───────── */
const QKEY='plume_quality';let quality=1;try{const q=localStorage.getItem(QKEY);if(q!==null)quality=+q;}catch(e){}
const renderer=new THREE.WebGLRenderer({canvas:$('cv'),antialias:true,powerPreference:'high-performance'});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.NoToneMapping;
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const scene=new THREE.Scene();scene.background=lin(0x9fd4f2);scene.fog=new THREE.Fog(0x9fd4f2,75,190);scene.fog.color.copy(scene.background);
const cam=new THREE.PerspectiveCamera(40,1,1,600);
const hemi=new THREE.HemisphereLight(0xffffff,0xa8b090,.84);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,.56);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-62,right:62,top:62,bottom:-62,near:1,far:260});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;scene.add(sun);scene.add(sun.target);
const torch=new THREE.PointLight(0xffc27a,0,95,1.2);scene.add(torch);
let composer=null,bloomPass=null,gradePass=null,hdr=false;
const GradeShader={uniforms:{tDiffuse:{value:null},uHurt:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D tDiffuse;uniform float uHurt;varying vec2 vUv;void main(){vec3 c=min(texture2D(tDiffuse,vUv).rgb,vec3(4.));float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.05);vec2 q=vUv-.5;float v=smoothstep(.95,.35,length(q));c*=mix(.86,1.,v);c=mix(c,vec3(.85,.04,.04),uHurt*(1.-v)*.85);c=pow(clamp(c,0.,1.),vec3(1./2.2));gl_FragColor=vec4(c,1.);}'};
let rtS=null,fsq=null,finalMat=null;
const FinalShader={vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform sampler2D tD,tZ;uniform vec2 uRes;uniform float uHurt,uNear,uFar;varying vec2 vUv;
 float lz(vec2 uv){float n=texture2D(tZ,uv).x*2.-1.;return 2.*uNear*uFar/(uFar+uNear-n*(uFar-uNear));}
 void main(){vec2 px=1./uRes;vec3 c=min(texture2D(tD,vUv).rgb,vec3(4.));float d=lz(vUv);float w=1.25;
  float dl=lz(vUv-vec2(px.x*w,0.)),dr=lz(vUv+vec2(px.x*w,0.)),du=lz(vUv+vec2(0.,px.y*w)),dd=lz(vUv-vec2(0.,px.y*w));
  float lap=abs(dl+dr+du+dd-4.*d)/d;float edge=smoothstep(.006,.02,lap)*(1.-smoothstep(150.,260.,d));
  float ao=0.;for(int i=0;i<6;i++){float a=float(i)*1.047+.3;float ds=lz(vUv+vec2(cos(a),sin(a))*px*9.);float df=(d-ds)/d;ao+=smoothstep(.004,.02,df)*(1.-smoothstep(.05,.11,df));}
  c*=1.-.3*ao/6.;c=mix(c,c*vec3(.16,.13,.2),edge*.85);
  float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.12);vec2 q=vUv-.5;float v=smoothstep(.95,.35,length(q));c*=mix(.88,1.,v);c=mix(c,vec3(.85,.04,.04),uHurt*(1.-v)*.85);
  c=pow(clamp(c,0.,1.),vec3(1./2.2));gl_FragColor=vec4(c,1.);}`};
function applyQuality(){const pr=Math.min(window.devicePixelRatio||1,[1,1.25,1.5][quality]);renderer.setPixelRatio(pr);const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
  sun.shadow.mapSize.set(quality?2048:1024,quality?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
  if(rtS){rtS.dispose();rtS=null;}composer=null;gradePass=null;renderer.outputColorSpace=THREE.SRGBColorSpace;
  if(quality>0&&THREE.Pass&&THREE.Pass.FullScreenQuad&&THREE.UnrealBloomPass){try{hdr=!!renderer.extensions.get('EXT_color_buffer_float');const sc=pr*[1,1,1.3][quality],Wd=Math.round(w*sc),Hd=Math.round(h*sc);
      rtS=new THREE.WebGLRenderTarget(Wd,Hd,{format:THREE.RGBAFormat,type:hdr?THREE.HalfFloatType:THREE.UnsignedByteType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});rtS.depthTexture=new THREE.DepthTexture(Wd,Hd);rtS.depthTexture.type=THREE.UnsignedIntType;
      bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(Wd,Hd),hdr?.4:.22,.5,hdr?1.05:.96);
      finalMat=new THREE.ShaderMaterial({uniforms:{tD:{value:rtS.texture},tZ:{value:rtS.depthTexture},uRes:{value:new THREE.Vector2(Wd,Hd)},uHurt:{value:0},uNear:{value:cam.near},uFar:{value:cam.far}},vertexShader:FinalShader.vertexShader,fragmentShader:FinalShader.fragmentShader,depthTest:false,depthWrite:false});
      fsq=new THREE.Pass.FullScreenQuad(finalMat);gradePass=finalMat;composer=true;renderer.outputColorSpace=THREE.LinearSRGBColorSpace;}catch(e){rtS=null;composer=null;gradePass=null;renderer.outputColorSpace=THREE.SRGBColorSpace;}}
  if(typeof GRASS!=='undefined'&&GRASS)GRASS.geometry.instanceCount=[0,2600,6500][quality];}
function frame(){if(rtS){renderer.setRenderTarget(rtS);renderer.render(scene,cam);bloomPass.render(renderer,null,rtS,0,false);renderer.setRenderTarget(null);fsq.render(renderer);}else{renderer.setRenderTarget(null);renderer.render(scene,cam);}}
addEventListener('resize',applyQuality);
const W=new THREE.Group(),DGp=new THREE.Group();scene.add(W);scene.add(DGp);
const GEO={sph:new THREE.SphereGeometry(1,14,10),box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(1,1,10),cyl:new THREE.CylinderGeometry(1,1,1,10),pyr:new THREE.ConeGeometry(1,1,4),ico:new THREE.IcosahedronGeometry(1,1),dod:new THREE.DodecahedronGeometry(1,0),tor:new THREE.TorusGeometry(1,.12,8,24),hsph:new THREE.SphereGeometry(1,16,8,0,6.283,0,1.5708)};
const MAT={},NIGHT=[];
const GRAD=new THREE.DataTexture(new Uint8Array([112,112,112,255,190,190,190,255,255,255,255,255]),3,1,THREE.RGBAFormat);GRAD.minFilter=GRAD.magFilter=THREE.NearestFilter;GRAD.needsUpdate=true;
function mat(c){return MAT[c]||(MAT[c]=new THREE.MeshToonMaterial({color:lin(c),gradientMap:GRAD}));}
function matMetal(c){const k=c+'m';return MAT[k]||(MAT[k]=new THREE.MeshToonMaterial({color:lin(c).multiplyScalar(1.08),gradientMap:GRAD}));}
function glow(c,k=3){const key=c+'g'+k;return MAT[key]||(MAT[key]=new THREE.MeshBasicMaterial({color:lin(c).multiplyScalar(k),toneMapped:false}));}
function matN(c){const k=c+'n';if(MAT[k])return MAT[k];const m=new THREE.MeshStandardMaterial({color:0x221a14,emissive:lin(c),emissiveIntensity:.2,toneMapped:false});NIGHT.push(m);return MAT[k]=m;}
function pt(p,geo,c,sx,sy,sz,x,y,z,rx,ry,rz,flat){const m=new THREE.Mesh(GEO[geo],typeof c==='string'?mat(c,flat):c);m.scale.set(sx,sy,sz);m.position.set(x,y,z);if(rx||ry||rz)m.rotation.set(rx||0,ry||0,rz||0);m.castShadow=true;p.add(m);return m;}
const LBL={};
function label(text,color='#fff',sc=1){const key=text+color;let t=LBL[key];if(!t){const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');x.font='bold 38px Trebuchet MS,Verdana,sans-serif';x.textAlign='center';x.lineWidth=7;x.strokeStyle='rgba(0,0,0,.85)';x.strokeText(text,256,45);x.fillStyle=color;x.fillText(text,256,45);t=LBL[key]=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;}
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true,toneMapped:false}));s.scale.set(16*sc,2*sc,1);s.renderOrder=10;return s;}

/* ───────── MODÈLES ───────── */
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString();
function mGoose0(c,o={}){const g=new THREE.Group(),Wc=c||'#fff',Sh=shade(Wc,.84),B=o.crow?'#26262c':'#f59a23',B2=o.crow?'#16161a':'#d9730f';
  pt(g,'sph',Wc,1.05,.95,1.45,0,1.55,0);pt(g,'sph',Sh,.99,.72,1.32,0,1.32,-.12);pt(g,'sph',Wc,.84,.68,.92,0,1.32,.36);pt(g,'sph',Wc,.6,.5,.6,0,1.75,.75);
  for(const a of[-.4,0,.4])pt(g,'cone',a?Sh:Wc,.3,1.05,.15,Math.sin(a)*.5,1.95,-1.36,-1.95,0,a*.8);
  const neck=new THREE.Group();neck.position.set(0,2,.9);g.add(neck);
  pt(neck,'cyl',Wc,.3,1.5,.3,0,.7,.1,.15);pt(neck,'sph',Wc,.36,.32,.36,0,.02,0);pt(neck,'sph',Wc,.5,.46,.54,0,1.55,.3);pt(neck,'sph',Sh,.3,.2,.3,0,1.9,.12);
  pt(neck,'cone',B,.2,.72,.2,0,1.5,.95,Math.PI/2);pt(neck,'sph',B2,.13,.07,.24,0,1.41,.82);pt(neck,'sph',B2,.21,.12,.12,0,1.5,.64);
  for(const s of[1,-1]){pt(neck,'sph','#ffffff',.13,.15,.09,s*.3,1.69,.55);pt(neck,'sph','#141414',.085,.105,.06,s*.315,1.69,.61);pt(neck,'sph',glow('#ffffff',1.2),.032,.032,.03,s*.34,1.73,.655);if(!o.crow)pt(neck,'sph','#ffb4a6',.085,.06,.04,s*.37,1.5,.58);}
  const wing=s=>{const w=new THREE.Group();w.position.set(s,1.78,-.05);pt(w,'sph',Wc,.2,.58,1,0,-.12,0);pt(w,'sph',Sh,.17,.46,.86,s*.06,-.34,-.26);pt(w,'sph',Wc,.14,.34,.7,s*.11,-.5,-.52);g.add(w);return w;},wl=wing(-1),wr=wing(1);
  const leg=s=>{const L=new THREE.Group();L.position.set(s*.4,.8,0);pt(L,'cyl',B,.1,.75,.1,0,-.38,0);pt(L,'sph',B2,.14,.11,.14,0,-.04,0);for(const t of[-.5,0,.5])pt(L,'box',B,.14,.07,.52,Math.sin(t)*.22,-.76,.24,0,t,0);pt(L,'box',B2,.38,.05,.3,0,-.77,.14);g.add(L);return L;},legL=leg(1),legR=leg(-1);
  if(o.evo===1){neck.scale.set(1.14,.8,1.14);pt(neck,'cone',Wc,.1,.42,.1,0,2.08,.18,-.35);pt(neck,'cone',Wc,.08,.34,.08,.1,2.04,.3,-.1,0,-.4);pt(g,'sph',Wc,.9,.6,.9,0,1.9,-.5);}
  if(o.evo===3){pt(g,'sph',matMetal('#ffd24a'),.82,.42,.7,0,2.05,.62);for(const s of[1,-1]){pt(g,'sph',matMetal('#e6edf4'),.44,.36,.66,s*1.02,2.22,-.02);pt(g,'sph',matMetal('#ffd24a'),.2,.2,.2,s*1.12,2.42,.3);}pt(neck,'sph',matMetal('#ffd24a'),.53,.3,.57,0,1.8,.24);pt(neck,'box',matMetal('#ffd24a'),.12,.34,.5,0,1.5,.62);for(let i=0;i<4;i++)pt(neck,'cone',i%2?'#ff6a3a':'#e23b2e',.16,.85-i*.1,.3,0,2.25-i*.1,.3-i*.3,-.45-i*.2);pt(g,'cyl',matMetal('#ffd24a'),1.08,.12,1.46,0,1.42,0);}
  if(o.scarf){pt(g,'cyl',o.scarf,.42,.28,.42,0,2.3,.93,.15);if(o.hero){pt(g,'sph',o.scarf,.17,.17,.17,.3,2.26,1.3);pt(g,'box',o.scarf,.15,.62,.07,.38,1.9,1.34,.2,0,-.22);pt(g,'box',shade(o.scarf,.8),.13,.5,.07,.2,1.92,1.38,.25,0,.1);}}
  if(o.hero){pt(g,'cyl','#7a4e28',1.07,.13,1.44,0,1.18,0);pt(g,'box','#ffd24a',.24,.2,.08,0,1.2,1.42);pt(g,'box','#8a5a30',.3,.55,.5,-1,1.22,.35);pt(g,'box','#a8743c',.32,.2,.52,-1,1.52,.35);}
  if(o.tab){pt(g,'sph',o.tab,1.09,.7,1.1,0,1.6,.3);pt(g,'cyl',o.tab,.4,.2,.4,0,2.3,.93,.15);}
  if(o.armor){pt(g,'sph',matMetal('#aab4c0'),1.1,.8,1.3,0,1.62,.05);pt(neck,'sph',matMetal('#aab4c0'),.52,.34,.56,0,1.76,.26);pt(neck,'box',matMetal('#8d99a6'),.1,.3,.5,0,2.02,.3);}
  if(o.shield){pt(g,'cyl',matMetal('#8d99a6'),.9,.14,.9,-1.25,1.6,.4,0,0,Math.PI/2);pt(g,'cyl',o.tab||'#3f7fd0',.55,.16,.55,-1.27,1.6,.4,0,0,Math.PI/2);}
  if(o.spear){pt(g,'cyl','#6b4423',.07,4.2,.07,1.15,2.2,.5,.25);pt(g,'cone',matMetal('#dfe7ee'),.18,.7,.18,1.15,4.4,1.05,.25);}
  if(o.bow)pt(g,'tor','#6b4423',.9,.9,.5,1.2,1.9,.5,0,Math.PI/2,0);
  if(o.staffG){pt(g,'cyl','#3a2a3a',.07,3.4,.07,1.15,1.9,.4);pt(g,'ico',glow('#b06aff',2.5),.28,.28,.28,1.15,3.7,.4);}
  if(o.crownG){pt(neck,'cyl',matMetal('#ffd24a'),.4,.22,.4,0,2.02,.3);for(let i=0;i<5;i++)pt(neck,'cone',matMetal('#ffd24a'),.08,.26,.08,Math.cos(i*1.257)*.34,2.25,.3+Math.sin(i*1.257)*.34);}
  if(o.cape){const cp=new THREE.Group();cp.position.set(0,2.35,.5);pt(cp,'box',o.cape,1.5,.1,1.3,0,-.2,-.85,-.35);pt(cp,'box',o.cape,1.9,.1,1.5,0,-.7,-2.05,-.42);pt(cp,'box',shade(o.cape,.75),1.94,.06,.2,0,-1.02,-2.78,-.42);g.add(cp);g.userData.cape=cp;}
  if(o.sword){const s=new THREE.Group();s.position.set(1.2,1.7,.3);pt(s,'box',matMetal('#eef3f8'),.17,.1,2.1,0,0,1.2);pt(s,'cone',matMetal('#eef3f8'),.12,.4,.07,0,0,2.43,Math.PI/2);pt(s,'box',glow('#bfe4ff',1.3),.05,.12,1.9,0,0,1.2);pt(s,'box',matMetal('#ffd24a'),.74,.2,.18,0,0,.15);pt(s,'sph',matMetal('#ffd24a'),.13,.13,.13,0,0,-.42);pt(s,'cyl','#3a2a1a',.09,.5,.09,0,0,-.15,Math.PI/2);g.add(s);g.userData.sword=s;}
  Object.assign(g.userData,{neck,wl,wr,legL,legR});return g;}
function mSquirrel0(c,o={}){const g=new THREE.Group(),F=c||'#b5651d',B='#f3d9b1';
  pt(g,'sph',F,.8,1,.75,0,1.2,0);pt(g,'sph',B,.55,.75,.4,0,1.15,.45);pt(g,'sph',F,.68,.62,.65,0,2.45,.1);
  pt(g,'sph',B,.4,.3,.3,0,2.3,.6);pt(g,'sph','#222',.1,.08,.08,0,2.42,.88);
  for(const s of[.3,-.3]){pt(g,'sph','#111',.09,.11,.06,s,2.6,.66);pt(g,'sph',glow('#ffffff',1.2),.03,.03,.03,s*1.05,2.64,.71);pt(g,'cone',F,.18,.42,.18,s*1.4,3.05,.05);pt(g,'sph',F,.22,.22,.3,s*2.5,1.5,.35);pt(g,'sph',F,.3,.18,.45,s*1.33,.15,.25);}
  const tail=new THREE.Group();tail.position.set(0,1,-.7);g.add(tail);
  pt(tail,'sph',F,.5,.5,.5,0,.3,-.4);pt(tail,'sph',F,.68,.7,.68,0,1.2,-.8);pt(tail,'sph',F,.62,.62,.62,0,2.1,-.55);pt(tail,'sph',B,.42,.42,.42,0,2.7,-.15);
  if(o.bandana)pt(g,'cyl',o.bandana,.7,.2,.68,0,2.8,.1);
  if(o.tab){pt(g,'sph',o.tab,.84,.6,.78,0,1.3,.02);pt(g,'cyl',o.tab,.5,.16,.5,0,1.95,.1);}
  if(o.hat){pt(g,'cone',o.hat,.6,1.2,.6,0,3.5,.1);pt(g,'cyl',o.hat,.95,.08,.95,0,2.95,.1);}
  if(o.crown){pt(g,'cyl',matMetal('#ffd24a'),.48,.3,.48,0,3.15,.1);for(let i=0;i<5;i++)pt(g,'cone',matMetal('#ffd24a'),.1,.3,.1,Math.cos(i*1.257)*.42,3.42,.1+Math.sin(i*1.257)*.42);}
  if(o.dagger)pt(g,'box',matMetal('#dfe7ee'),.1,.1,1,.85,1.5,.9);
  if(o.bow)pt(g,'tor','#6b4423',.8,.8,.5,.95,1.6,.5,0,Math.PI/2,0);
  if(o.staff){pt(g,'cyl','#6b4423',.07,3,.07,.95,1.6,.4);pt(g,'ico',glow(o.heal?'#7dff9a':'#c77dff',2.5),.25,.25,.25,.95,3.2,.4);}
  if(o.monocle)pt(g,'tor',matMetal('#ffd24a'),.16,.16,.16,.3,2.6,.72);
  if(o.otter){tail.scale.set(.42,.8,.42);tail.rotation.x=-1.15;tail.position.y=.7;pt(g,'box','#f3d9b1',.9,.03,.03,0,2.34,.82);}
  Object.assign(g.userData,{tail});return g;}
function mQuad0(c,o={}){const g=new THREE.Group(),dk=o.fox?'#3a2a22':c;
  pt(g,'sph',c,.8,.75,1.4,0,1.1,0);pt(g,'sph',c,.6,.58,.62,0,1.5,1.3);pt(g,'cone',o.fox?'#f6efe6':'#3a2a22',.3,.7,.3,0,1.4,1.95,Math.PI/2);pt(g,'sph','#111',.09,.08,.08,0,1.42,2.28);
  if(o.fox)pt(g,'sph','#f6efe6',.55,.5,.9,0,.85,.45);
  for(const s of[.35,-.35]){pt(g,'cone',c,.18,.45,.18,s,2.1,1.2);pt(g,'sph','#111',.08,.08,.08,s*.8,1.68,1.75);}
  const legs=[];for(const[x,z]of[[.45,.8],[-.45,.8],[.45,-.8],[-.45,-.8]])legs.push(pt(g,'cyl',dk,.16,.8,.16,x,.4,z));
  const tail=new THREE.Group();tail.position.set(0,1.3,-1.3);g.add(tail);
  if(o.fox){pt(tail,'sph',c,.38,.38,.9,0,.1,-.5);pt(tail,'sph','#f6efe6',.27,.27,.42,0,.2,-1.2);}
  if(o.boar){pt(g,'cone','#f6efe6',.1,.45,.1,.3,1.5,1.9,-.5);pt(g,'cone','#f6efe6',.1,.45,.1,-.3,1.5,1.9,-.5);pt(g,'sph','#2a1a12',.3,.4,1.1,0,1.75,-.1);}
  if(o.badger){pt(g,'sph','#f2f2ee',.2,.34,.6,0,1.86,1.25);pt(g,'sph','#f2f2ee',.22,.2,1.2,0,1.72,0);pt(g,'sph','#f2f2ee',.3,.3,.3,0,1.38,1.86);pt(tail,'sph','#3a3632',.3,.3,.5,0,0,-.3);}
  if(o.tab)pt(g,'cyl',o.tab,.62,.22,.62,0,1.45,.85,Math.PI/2.4);
  Object.assign(g.userData,{legs,tail});return g;}
function mBulldog0(c,o={}){const g=new THREE.Group(),D='#1a1614',Wt='#e8e2d6',lean=o.lean?.8:1;
  pt(g,'sph',c,1.2*lean,1.05,1.65,0,1.25,-.1);pt(g,'sph',c,1.35*lean,1.2,1.05,0,1.35,.75);pt(g,'sph',Wt,.8*lean,.7,.6,0,.95,1.2);
  pt(g,'sph',c,1.02,.92,.95,0,1.95,1.75);pt(g,'sph',D,.62,.46,.5,0,1.72,2.5);pt(g,'sph','#0a0808',.16,.12,.1,0,1.86,2.96);
  for(const s of[1,-1]){pt(g,'sph',c,.48,.52,.5,s*.5,1.5,2.35);pt(g,'box',D,.95,.2,.62,0,1.2,2.42);pt(g,'cone','#f6f1e4',.11,.36,.11,s*.32,1.42,2.72);
    pt(g,'sph',glow('#ff1a0a',3.2),.12,.1,.08,s*.4,2.18,2.52);pt(g,'box',D,.5,.14,.2,s*.4,2.36,2.45,0,0,s*-.35);pt(g,'cone',c,.26,.4,.2,s*.72,2.62,1.45,0,0,s*-.9);
    pt(g,'cyl',c,.3,1,.3,s*.85*lean,.5,.9);pt(g,'cyl',c,.27,.9,.27,s*.75*lean,.45,-1.1);pt(g,'sph',Wt,.34,.16,.4,s*.85*lean,.1,1);pt(g,'sph',Wt,.3,.14,.36,s*.75*lean,.1,-1);}
  const legs=[];const tail=new THREE.Group();tail.position.set(0,1.6,-1.6);pt(tail,'sph',c,.2,.2,.32,0,0,-.2);g.add(tail);
  const col=new THREE.Mesh(GEO.tor,matMetal('#3a3a40'));col.scale.set(1,1,2.6);col.position.set(0,1.62,1.2);col.rotation.x=.25;g.add(col);for(let i=0;i<7;i++){const a=i/7*6.283;pt(g,'cone',matMetal('#c8ccd4'),.1,.42,.1,Math.cos(a)*1.08,1.62+Math.sin(a)*1.08,1.2+Math.sin(a)*.25,Math.PI/2-.0,0,a-1.571);}
  if(o.horn){pt(g,'cone','#d8d2c2',.2,1.1,.2,.9,1.9,2.3,1.2,0,-.6);}
  if(o.king){pt(g,'cyl',matMetal('#ffd24a'),.62,.3,.62,0,2.92,1.7);for(let i=0;i<6;i++)pt(g,'cone',matMetal('#ffd24a'),.11,.42,.11,Math.cos(i*1.047)*.55,3.25,1.7+Math.sin(i*1.047)*.55);pt(g,'box','#6a0a0a',2.6,.12,3,0,2.05,-.6,-.12);pt(g,'sph',matMetal('#55585f'),1.28,.7,1.3,0,1.75,.2);const gr=new THREE.Mesh(GEO.ico,glow('#ffe9a0',3));gr.scale.setScalar(.3);gr.position.set(0,.75,1.85);g.add(gr);}
  Object.assign(g.userData,{tail});return g;}
/* personnages : pièces fusionnées, contours sombres, gabarits réutilisés */
const CHARMAT=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:GRAD}),TPL={};
function outMat(c,k){const m=new THREE.MeshBasicMaterial({color:lin(c).multiplyScalar(k||1),side:THREE.BackSide,toneMapped:false});m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <project_vertex>','vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);mvPosition.xyz+=normalize(normalMatrix*normal)*.06;gl_Position=projectionMatrix*mvPosition;');};return m;}
const OUTM=outMat('#2a1a12'),OUTT=outMat('#ffe45c',1.6),FLASHM=new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.6,1.6),toneMapped:false});
const _mi=new THREE.Matrix4(),_mr=new THREE.Matrix4();
function bakeChar(root){root.updateMatrixWorld(true);const sp=new Set();for(const k in root.userData){const v=root.userData[k];if(Array.isArray(v))v.forEach((o,i)=>{if(o&&o.isObject3D){o.name='sp_'+k+'_'+i;sp.add(o);}});else if(v&&v.isObject3D){v.name='sp_'+k;sp.add(v);}}
  const ok=m=>m.material.isMeshToonMaterial;
  const unit=U=>{if(U.isMesh){if(!ok(U))return;U.userData={k:'c'};const o=new THREE.Mesh(U.geometry,OUTM);o.userData={k:'o'};U.add(o);return;}
    const ms=[],walk=n=>{for(const ch of n.children){if(sp.has(ch))continue;if(ch.isMesh){if(ok(ch))ms.push(ch);}else walk(ch);}};walk(U);if(!ms.length)return;
    _mi.copy(U.matrixWorld).invert();let n=0;const parts=ms.map(m=>{const q=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();_mr.multiplyMatrices(_mi,m.matrixWorld);q.applyMatrix4(_mr);n+=q.attributes.position.count;return[q,m.material.color];});
    const Pa=new Float32Array(n*3),Na=new Float32Array(n*3),Ca=new Float32Array(n*3);let o=0;for(const[q,c]of parts){const cnt=q.attributes.position.count;Pa.set(q.attributes.position.array,o*3);Na.set(q.attributes.normal.array,o*3);for(let i=0;i<cnt;i++){Ca[(o+i)*3]=c.r;Ca[(o+i)*3+1]=c.g;Ca[(o+i)*3+2]=c.b;}o+=cnt;q.dispose();}
    const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(Pa,3));G.setAttribute('normal',new THREE.BufferAttribute(Na,3));G.setAttribute('color',new THREE.BufferAttribute(Ca,3));ms.forEach(m=>m.parent.remove(m));
    const M=new THREE.Mesh(G,CHARMAT);M.castShadow=true;M.userData={k:'c'};U.add(M);const O=new THREE.Mesh(G,OUTM);O.userData={k:'o'};U.add(O);};
  unit(root);sp.forEach(unit);root.userData={};return root;}
function charInst(type,c,o,build){const key=type+'|'+c+'|'+JSON.stringify(o);let t=TPL[key];if(!t)t=TPL[key]=bakeChar(build(c,o));const m=t.clone(true),u=m.userData={cols:[],outs:[]};
  m.traverse(n=>{if(n===m)return;if(n.name&&n.name.startsWith('sp_')){const p=n.name.slice(3).split('_');if(p.length>1)(u[p[0]]=u[p[0]]||[])[+p[1]]=n;else u[p[0]]=n;}const k=n.userData&&n.userData.k;if(k==='c'){n.userData={k,mat:n.material};u.cols.push(n);}else if(k==='o')u.outs.push(n);});return m;}
const mGoose=(c,o={})=>charInst('go',c,o,mGoose0),mSquirrel=(c,o={})=>charInst('sq',c,o,mSquirrel0),mQuad=(c,o={})=>charInst('qd',c,o,mQuad0),mBulldog=(c,o={})=>charInst('bd',c,o,mBulldog0);
function flashChar(m,on){const u=m.userData;if(!u.cols||!!u.fl===!!on)return;u.fl=!!on;for(const c of u.cols)c.material=on?FLASHM:c.userData.mat;}
function outChar(m,on){const u=m.userData;if(u.outs)for(const o of u.outs)o.material=on?OUTT:OUTM;}
GEO.gab=(()=>{const A=[-.5,0,-.5],B=[-.5,0,.5],C=[-.5,1,0],D=[.5,0,-.5],E=[.5,0,.5],F=[.5,1,0],t=[A,B,C,D,F,E,B,E,F,B,F,C,A,C,F,A,F,D,A,D,E,A,E,B],q=new THREE.BufferGeometry();q.setAttribute('position',new THREE.BufferAttribute(new Float32Array(t.flat()),3));q.computeVertexNormals();return q;})();
const STATM=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:GRAD});
function bakeStatic(root){root.updateMatrixWorld(true);const ms=[],walk=n=>{for(const ch of n.children){if(ch.userData.dyn)continue;if(ch.isMesh){if(ch.material.isMeshToonMaterial&&!ch.isInstancedMesh)ms.push(ch);}else walk(ch);}};walk(root);if(!ms.length)return root;
  _mi.copy(root.matrixWorld).invert();let n=0;const parts=ms.map(m=>{const q=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();_mr.multiplyMatrices(_mi,m.matrixWorld);q.applyMatrix4(_mr);n+=q.attributes.position.count;return[q,m.material.color];});
  const Pa=new Float32Array(n*3),Na=new Float32Array(n*3),Ca=new Float32Array(n*3);let o=0;for(const[q,c]of parts){const cnt=q.attributes.position.count;Pa.set(q.attributes.position.array,o*3);Na.set(q.attributes.normal.array,o*3);for(let i=0;i<cnt;i++){Ca[(o+i)*3]=c.r;Ca[(o+i)*3+1]=c.g;Ca[(o+i)*3+2]=c.b;}o+=cnt;q.dispose();}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(Pa,3));G.setAttribute('normal',new THREE.BufferAttribute(Na,3));G.setAttribute('color',new THREE.BufferAttribute(Ca,3));ms.forEach(m=>m.parent.remove(m));
  const M=new THREE.Mesh(G,STATM);M.castShadow=M.receiveShadow=true;root.add(M);return root;}
function mkModel(kind,bi){const T=ET[kind];const col=T.col||(T.m==='go'?FEA[bi]:FUR[bi]);return T.m==='bd'?mBulldog(col,T.o):T.m==='go'?mGoose(col,T.o):T.m==='sq'?mSquirrel(col,T.o):mQuad(col,T.o);}
function mkUnitModel(u){const U=UNIT[u],c=CLAN[U.clan].c,o=Object.assign({},U.o,{tab:c});if(u==='soigneur')o.heal=1;return U.m==='go'?mGoose(u==='sauteur'?'#f4f8ff':'#f0ece2',o):U.m==='sq'?mSquirrel(u==='soigneur'?'#6b7a5a':u==='harponneur'?'#5a4636':'#a05a22',o):mQuad(u==='marteleur'?'#3a3632':'#d9642b',o);}

/* ───────── CARTES PRÉ-CALCULÉES ───────── */
const MS=512,FIREI=BIO.findIndex(b=>b.fire),UFN={value:75},UFF={value:190};let HT,TT,CT,RDT,RAIN=null,HN=0;const CLD=[];const UT={value:0},UP={value:new THREE.Vector3()},ULIGHT={value:new THREE.Vector3(1,1,1)},USUN={value:1};
function bakeMaps(){const hd=new Uint8Array(MS*MS*4),td=new Uint8Array(MS*MS*4);
  for(let j=0;j<MS;j++)for(let i=0;i<MS;i++){const x=(i/(MS-1)-.5)*WS,z=(j/(MS-1)-.5)*WS,h=height(x,z),k=(j*MS+i)*4;blend(x,z);let g=0,r=0,gg=0,b=0;
    for(let n=0;n<NB;n++){const w=BW[n],B=BIO[n];g+=w*B.g;r+=w*(B.c[0]*.55+B.t[0]*.45);gg+=w*(B.c[1]*.55+B.t[1]*.45);b+=w*(B.c[2]*.55+B.t[2]*.45);}hd[k+2]=BW[FIREI]*255*sstep(250,205,Math.hypot(x-BIO[FIREI].x,z-BIO[FIREI].z));
    if(h<1.3)g*=sstep(.7,1.3,h);if(g>0){const rd=roadDist(x,z);if(rd<6)g*=sstep(3,6,rd);}for(const v of VIL){const d=Math.hypot(x-v.x,z-v.z);if(d<16)g*=sstep(7,16,d);}
    hd[k]=clamp((h+4)/24,0,1)*255;hd[k+1]=g*255;hd[k+3]=255;td[k]=r*255;td[k+1]=gg*255;td[k+2]=b*255;td[k+3]=255;}
  const mk=d=>{const t=new THREE.DataTexture(d,MS,MS,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;};HT=mk(hd);TT=mk(td);
  {const N=1024,wd=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=(j*N+i)*4;wd[k]=clamp((height((i/(N-1)-.5)*WS,(j/(N-1)-.5)*WS)+2.6)/4,0,1)*255;wd[k+3]=255;}WT=new THREE.DataTexture(wd,N,N,THREE.RGBAFormat);WT.magFilter=WT.minFilter=THREE.LinearFilter;WT.needsUpdate=true;}
  const RS=1024,rd=new Uint8Array(RS*RS*4).fill(255),K=RS/WS,stamp=(x,z,r0)=>{const ci=Math.round((x/WS+.5)*RS),cj=Math.round((z/WS+.5)*RS),R=Math.ceil((r0+8)*K);for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const a=ci+i,b=cj+j;if(a<0||b<0||a>=RS||b>=RS)continue;const d=Math.max(0,Math.hypot(i,j)/K-r0),v=Math.min(255,d/8*255)|0,k=(b*RS+a)*4;if(v<rd[k])rd[k]=v;}};
  for(const s of RSEG){const L=Math.hypot(s[2]-s[0],s[3]-s[1]),n=Math.ceil(L/1.1);for(let i=0;i<=n;i++)stamp(lerp(s[0],s[2],i/n),lerp(s[1],s[3],i/n),0);}for(const v of VIL)stamp(v.x,v.z,v.small?5:9);
  RDT=new THREE.DataTexture(rd,RS,RS,THREE.RGBAFormat);RDT.magFilter=RDT.minFilter=THREE.LinearFilter;RDT.needsUpdate=true;}
let GRASS=null,AMBI=null,WATER=null,WT=null;const FLAGS=[],SPIN=[];
function buildTerrain(){
  const SEG=300,geo=new THREE.PlaneGeometry(WS,WS,SEG,SEG);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,col=new Float32Array(p.count*3),r=rng(7),C=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=height(x,z);p.setY(i,h);blend(x,z);let cr=0,cg=0,cb=0;for(let n=0;n<NB;n++){const w=BW[n],c=BIO[n].c;cr+=w*c[0];cg+=w*c[1];cb+=w*c[2];}
    const n=(r()-.5)*.016+.018*Math.sin(x*.21)*Math.sin(z*.17);const rd=h>.9?roadDist(x,z):99;if(rd<4.4){const t=1-sstep(2.2,4.4,rd);cr=lerp(cr,cr*.4+.52,t);cg=lerp(cg,cg*.4+.47,t);cb=lerp(cb,cb*.4+.36,t);}if(h<1.15&&!lavaAt(x,z)){const t=sstep(.55,1.15,h),w=sstep(-.05,.4,h),d=sstep(-.1,-1.8,h);let sr=lerp(.78,.96,w),sg=lerp(.66,.84,w),sb=lerp(.42,.55,w);sr=lerp(sr,.30,d);sg=lerp(sg,.62,d);sb=lerp(sb,.62,d);cr=lerp(sr,cr,t);cg=lerp(sg,cg,t);cb=lerp(sb,cb,t);}else if(h<-.3){cr=.55;cg=.6;cb=.5;}
    C.setRGB(clamp(cr+n,0,1),clamp(cg+n,0,1),clamp(cb+n,0,1)).convertSRGBToLinear();col[i*3]=C.r;col[i*3+1]=C.g;col[i*3+2]=C.b;}
  geo.computeVertexNormals();{const nm=geo.attributes.normal,rk=new THREE.Color(.62,.52,.40).convertSRGBToLinear();for(let i=0;i<p.count;i++){const y=p.getY(i);if(y<.6)continue;const nx=nm.getX(i),ny=nm.getY(i),nz=nm.getZ(i),d=(-nx*.55+ny*.62-nz*.56)-.62,k=clamp(1+d*2.6,.62,1.32),sl=sstep(.045,.13,1-ny)*sstep(.9,1.6,y)*.75,e=1+clamp((y-4)*.012,-.03,.12);col[i*3]=lerp(col[i*3]*k*e,rk.r*k,sl);col[i*3+1]=lerp(col[i*3+1]*k*e,rk.g*k,sl);col[i*3+2]=lerp(col[i*3+2]*k,rk.b*k,sl);}}geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const dc=document.createElement('canvas');dc.width=dc.height=128;const dx=dc.getContext('2d'),dr=rng(3);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const v=236+(dr()*12|0);dx.fillStyle='rgb('+v+','+v+','+v+')';dx.fillRect(x,y,1,1);}dx.lineCap='round';for(let i=0;i<150;i++){const x=dr()*128,y=dr()*128,l=3+dr()*4;dx.strokeStyle=i%3?'rgba(40,60,20,.16)':'rgba(255,255,220,.5)';dx.lineWidth=1.3;for(const ox of[-128,0,128])for(const oy of[-128,0,128]){dx.beginPath();dx.moveTo(x+ox,y+oy);dx.lineTo(x+ox+(dr()-.5)*2,y+oy-l);dx.stroke();}}
  const dt=new THREE.CanvasTexture(dc);dt.wrapS=dt.wrapT=THREE.RepeatWrapping;dt.repeat.set(180,180);dt.colorSpace=THREE.SRGBColorSpace;
  const cc=document.createElement('canvas');cc.width=cc.height=256;const cx=cc.getContext('2d'),cr=rng(19);cx.fillStyle='#fff';cx.fillRect(0,0,256,256);for(let i=0;i<34;i++){const x=cr()*256,y=cr()*256,rr=22+cr()*46;for(const ox of[-256,0,256])for(const oy of[-256,0,256]){const gd=cx.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,rr);gd.addColorStop(0,'rgba(0,0,0,.5)');gd.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gd;cx.fillRect(x+ox-rr,y+oy-rr,rr*2,rr*2);}}
  CT=new THREE.CanvasTexture(cc);CT.wrapS=CT.wrapT=THREE.RepeatWrapping;
  const tm=new THREE.MeshStandardMaterial({vertexColors:true,map:dt,roughness:.97,metalness:0});tm.onBeforeCompile=s=>{s.uniforms.uCl={value:CT};s.uniforms.uRd={value:RDT};s.uniforms.uT=UT;s.vertexShader='varying vec2 vWp;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xz;');s.fragmentShader='uniform sampler2D uCl,uRd;uniform float uT;varying vec2 vWp;\n'+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat p1=texture2D(uCl,vWp*.011).r,p2=texture2D(uCl,vWp*.029+.31).r,p3=texture2D(uCl,vWp*.0045+.6).r;vec3 bs=diffuseColor.rgb;bs*=mix(.8,1.,smoothstep(.5,.55,p1));bs=mix(bs,bs*1.16+.012,smoothstep(.7,.73,p2));bs*=mix(.9,1.06,smoothstep(.35,.65,p3));float rdd=texture2D(uRd,vWp/'+WS+'.+.5).r*8.;vec3 pth=vec3(.72,.47,.16)*(.9+.14*p2);bs=mix(bs,pth,1.-smoothstep(2.2,2.6,rdd));bs=mix(bs,bs*.6,(1.-smoothstep(.0,.42,abs(rdd-2.75)))*.75);diffuseColor.rgb=bs*mix(.8,1.,texture2D(uCl,vWp*.0035+uT*.004).r);');};
  const terr=new THREE.Mesh(geo,tm);terr.receiveShadow=true;W.add(terr);
  // eau
  WATER=new THREE.Mesh(new THREE.PlaneGeometry(3200,3200),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:UT,uH:{value:HT},uW:{value:WT},uCl:{value:CT},uFog:{value:scene.fog.color},uLight:ULIGHT,uSun:USUN,uFn:UFN,uFf:UFF},
    vertexShader:'varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uT,uSun,uFn,uFf;uniform sampler2D uH,uW,uCl;uniform vec3 uFog,uLight;varying vec3 vW;varying float vD;float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 uv=vW.xz/'+WS+'.+.5;float h=-2.6,fw=0.;if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.){h=texture2D(uW,uv).r*4.-2.6;fw=smoothstep(.35,.7,texture2D(uH,uv).b);}float dp=-h;'+
      'float n=sin(vW.x*.33+uT*1.3)+sin(vW.z*.41-uT*1.1)+sin((vW.x+vW.z)*.21+uT*.7);vec3 c=mix(vec3(.10,.74,.66),vec3(.022,.50,.62),smoothstep(.15,1.,dp));c=mix(c,vec3(.010,.33,.56),smoothstep(1.2,2.3,dp));'+
      'vec2 wv=vW.xz+vec2(sin(vW.z*.23+uT*.6),sin(vW.x*.19-uT*.5))*1.4;float rp=sin(wv.x*.36+uT*.35)*sin(wv.y*.9-uT*.5);float ws=smoothstep(.972,.985,rp)*smoothstep(.35,1.,dp);'+
      'vec2 gc=floor(vW.xz*.55);float gh=hs(gc);vec2 gf=fract(vW.xz*.55)-.5-(vec2(hs(gc+3.),hs(gc+7.))-.5)*.6;float gl=step(.9,gh)*smoothstep(.55,.95,sin(uT*2.2+gh*60.))*(1.-smoothstep(.02,.09,abs(gf.x)+abs(gf.y)))*uSun;'+
      'float sh=dp+sin(uT*1.1+vW.x*.4+vW.z*.3)*.022;float fo=(1.-smoothstep(.04,.065,sh));float b1=(1.-smoothstep(.022,.045,abs(sh-.2-sin(uT*.8)*.035)))*.9;float b2=(1.-smoothstep(.02,.05,abs(sh-.46-sin(uT*.6+1.)*.05)))*.45;float fm=max(fo,max(b1,b2))*smoothstep(.0002,.0016,fwidth(dp));'+
      'c+=ws*vec3(.30,.36,.34);c=mix(c,vec3(.97,1.,1.),fm*(1.-fw));c+=gl*.8;c*=uLight*mix(.8,1.,texture2D(uCl,vW.xz*.0035+uT*.004).r);float al=mix(mix(.42,.97,smoothstep(.0,1.1,dp)),1.,max(fm,max(ws,fw)));c=mix(c,vec3(.16,.02,.005),fw);vec3 lv=mix(vec3(1.,.16,.01),vec3(1.,.62,.1),clamp(n/3.+fo*1.2+b1,0.,1.))*(.9+fo*2.6+b1);'+
      'float f=smoothstep(uFn,uFf,vD);gl_FragColor=vec4(mix(c,uFog,f),al);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\ngl_FragColor.rgb+=lv*fw*(1.-f*.6);}'}));
  WATER.rotation.x=-Math.PI/2;WATER.renderOrder=2;W.add(WATER);
  // herbe
  const bg=new THREE.InstancedBufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-.5,0,0,.5,0,0,-.36,.4,0,.36,.4,0,-.2,.75,0,.2,.75,0,0,1,0]),3));bg.setIndex([0,1,2,2,1,3,2,3,4,4,3,5,4,5,6]);
  const NG=22000,PATCH=124,off=new Float32Array(NG*3),gr=rng(11);for(let i=0;i<NG;i++){off[i*3]=gr()*PATCH;off[i*3+1]=gr()*PATCH;off[i*3+2]=gr();}bg.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,3));
  GRASS=new THREE.Mesh(bg,new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uT:UT,uP:UP,uH:{value:HT},uC:{value:TT},uFog:{value:scene.fog.color},uLight:ULIGHT,uFn:UFN,uFf:UFF,uCl:{value:CT}},
    vertexShader:'uniform vec3 uP;uniform float uT,uFn,uFf;uniform sampler2D uH,uC,uCl;attribute vec3 aOff;varying vec3 vC;varying float vF;void main(){float PA='+PATCH+'.;vec2 wp=mod(aOff.xy-uP.xz+PA*.5,PA)-PA*.5+uP.xz;vec2 uv=wp/'+WS+'.+.5;vec4 hm=texture2D(uH,uv);float h=hm.r*24.-4.;'+
      'vec2 dl=wp-uP.xz;float edge=1.-smoothstep(PA*.36,PA*.5,max(abs(dl.x),abs(dl.y)));float r=aOff.z;float s=hm.g*edge*(.5+r*.8)*step(.1,hm.g)*smoothstep(-.3,1.1,sin(wp.x*.13)+sin(wp.y*.11+1.7)+sin((wp.x+wp.y)*.07));float a=r*6.283;vec3 p=position;float b=p.y*p.y;'+
      'float wind=sin(uT*1.8+wp.x*.21+wp.y*.17)+.5*sin(uT*3.1+wp.x*.5+r*6.);float pd=length(dl);vec2 push=dl/(pd+.01)*max(0.,2.8-pd)*.42;'+
      'vec3 q=vec3(p.x*cos(a)*.2,p.y*1.02,p.x*sin(a)*.2);q.x+=(wind*.2+push.x)*b;q.z+=(wind*.12+push.y)*b;q.y-=length(push)*b*.5;q*=s;'+
      'vec3 t=pow(texture2D(uC,uv).rgb,vec3(2.2));vC=t*(.72+.42*p.y)*(.9+.2*fract(r*7.3))*mix(.86,1.,texture2D(uCl,wp*.0035+uT*.004).r);vec4 mv=viewMatrix*vec4(wp.x+q.x,h+q.y,wp.y+q.z,1.);vF=smoothstep(uFn,uFf,-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 uFog,uLight;varying vec3 vC;varying float vF;void main(){gl_FragColor=vec4(mix(vC*uLight,uFog,vF),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
  GRASS.frustumCulled=false;GRASS.material.depthWrite=false;GRASS.renderOrder=3;W.add(GRASS);
  // particules d'ambiance
  const NA=520,ap=new Float32Array(NA*3),ar=rng(5);for(let i=0;i<NA;i++){ap[i*3]=ar()*70;ap[i*3+1]=ar()*22;ap[i*3+2]=ar()*70;}const ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.BufferAttribute(ap,3));
  AMBI=new THREE.Points(ag,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:UT,uP:UP,uVel:{value:new THREE.Vector3(.6,.15,.3)},uCol:{value:new THREE.Vector3(1,1,.8)},uSize:{value:2.2},uA:{value:.45}},
    vertexShader:'uniform vec3 uP,uVel;uniform float uT,uSize;varying float vA;void main(){vec3 p=position+uVel*uT;p.xz=mod(p.xz-uP.xz+35.,70.)-35.+uP.xz;p.y=mod(p.y,22.)+uP.y+.4;p.x+=sin(uT*1.3+position.z)*.7;vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uSize*(70./-mv.z)*(.6+fract(position.x*7.))*'+(Math.min(window.devicePixelRatio||1,2)).toFixed(2)+';vA=.5+.5*sin(uT*3.+position.y*9.);}',
    fragmentShader:'uniform vec3 uCol;uniform float uA;varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(uCol,uA*smoothstep(.5,.1,d)*mix(.55,1.,vA));}'}));
  AMBI.frustumCulled=false;scene.add(AMBI);
  const NR=1100,rp=new Float32Array(NR*6),re=new Float32Array(NR*2),rr2=rng(23);for(let i=0;i<NR;i++){const x=rr2()*70,y=rr2()*32,z=rr2()*70;rp.set([x,y,z,x,y,z],i*6);re[i*2]=0;re[i*2+1]=1;}const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rp,3));rg.setAttribute('aE',new THREE.BufferAttribute(re,1));
  RAIN=new THREE.LineSegments(rg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:UT,uP:UP,uR:{value:0}},vertexShader:'uniform vec3 uP;uniform float uT;attribute float aE;void main(){vec3 p=position;p.y=mod(p.y-uT*46.,32.)+uP.y-2.;p.xz=mod(p.xz-uP.xz+35.,70.)-35.+uP.xz;p+=aE*vec3(.35,1.9,.1);gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',fragmentShader:'uniform float uR;void main(){gl_FragColor=vec4(.72,.8,.95,uR*.55);}'}));RAIN.frustumCulled=false;RAIN.visible=false;scene.add(RAIN);}
const AMB=[[0xfff6c0,.6,.15,.3,2.2,.45,1],[0xcfe9a0,.3,-.3,.2,2.4,.5,1],[0xffe08a,1,.1,.4,2.2,.5,1],[0xb8ff8a,.2,.25,.2,3,.8,2.6],[0xffffff,1.5,-5,.5,3.2,.9,1],[0xff7a2a,.4,3,.2,2.8,.9,3],[0xff9a3a,1,-1.8,.4,3.4,.85,1.1],[0xc8d0e0,6,-3,1,2.6,.7,1],[0xbfd0e0,1.5,-3,.4,2,.25,1],[0xff6a1a,.6,4.2,.3,3.2,.95,3.2],[0xc8ccd0,1.1,.06,.4,5,.1,1]];

/* ───────── CONSTRUCTIONS ───────── */
function win(g,x,y,z,ry){const m=new THREE.Mesh(GEO.box,matN('#ffc060'));m.scale.set(1.1,1.1,.25);m.position.set(x,y,z);if(ry)m.rotation.y=ry;g.add(m);}
const LPOOL=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,200,110,1)');gr.addColorStop(1,'rgba(255,170,60,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});})(),LPG=new THREE.CircleGeometry(1,20),SMOKE=[];
function pool(g,x,y,z,r){const m=new THREE.Mesh(LPG,LPOOL);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.scale.setScalar(r);m.renderOrder=1;g.add(m);}
function smoke(g,x,y,z){for(let i=0;i<3;i++){const m=new THREE.Mesh(GEO.sph,new THREE.MeshBasicMaterial({color:lin(0xf4f0e8),transparent:true,opacity:.5,depthWrite:false}));g.add(m);SMOKE.push({m,x,y,z,o:i/3+x*.13});}}
function lantern(g,x,z,y=0){pool(g,x,y+.25,z,4.2);pt(g,'cyl','#3d3026',.12,3.2,.12,x,y+1.6,z);const m=new THREE.Mesh(GEO.sph,matN('#ffb84a'));m.scale.set(.38,.45,.38);m.position.set(x,y+3.4,z);g.add(m);pt(g,'cone','#3d3026',.5,.3,.5,x,y+3.95,z);}
function flag(g,x,z,c,h=7,y=0){pt(g,'cyl','#5a4a3a',.14,h,.14,x,y+h/2,z);const f=new THREE.Group();f.position.set(x,y+h-.9,z);const m=pt(f,'box',c,2.4,1.5,.08,1.25,0,0);pt(f,'box',glow('#ffffff',.9),.5,.5,.1,1.25,0,0).material=mat('#fff6d8');g.add(f);FLAGS.push(f);return m;}
const FLC=['#ff5f9a','#ffd23a','#ff7a3c','#c56cf0','#ffffff'],RFC=['#e23b2e','#2f86e6','#f28a1e','#1fae9c','#c2385a'],SHC=['#2f86e6','#e23b2e','#2a9d6a','#f2b01e','#7a4fd0'],WLC=['#fff0d2','#ffe6bc','#fbead4','#f8dfc2'];
function roof(g,wx,wz,y,h,col,wc,rot){const R=new THREE.Group();R.position.y=y;if(rot)R.rotation.y=Math.PI/2;g.add(R);const L=wx+1.1,s=wz/2+.65,sl=Math.hypot(s,h),a=Math.atan2(h,s),n=5,d=shade(col,.66),c2=shade(col,.86);
  pt(R,'gab',wc,wx,h,wz,0,0,0);for(let k=0;k<n;k++){const t=(k+.5)/n;for(const sg of[-1,1])pt(R,'box',k%2?col:c2,L-(k%2?.12:0),.26,sl/n+.2,0,h*t+.17+(k%2?.05:0),sg*s*(1-t),sg*a);}
  for(const ex of[-1,1])for(const sg of[-1,1])pt(R,'box',d,.22,.34,sl+.25,ex*L/2,h*.5+.2,sg*s*.5,sg*a);pt(R,'box',d,L+.25,.32,.5,0,h+.3,0);return R;}
function winF(g,x,y,z,ry,sc,box){const s=new THREE.Group();s.position.set(x,y,z);s.rotation.y=ry||0;g.add(s);const T='#5a3418';pt(s,'box',T,1.5,1.55,.16,0,0,0);win(s,0,0,.06);pt(s,'box',T,.09,1.2,.1,0,0,.2);pt(s,'box',T,1.2,.09,.1,0,0,.2);for(const k of[-1,1]){pt(s,'box',sc,.46,1.45,.12,k,0,.08);pt(s,'box',shade(sc,.72),.34,.08,.14,k,.35,.09);pt(s,'box',shade(sc,.72),.34,.08,.14,k,-.35,.09);}
  if(box){pt(s,'box','#8a5a30',1.5,.3,.46,0,-.94,.3);for(let k=0;k<3;k++){pt(s,'sph','#4caf3a',.25,.2,.22,-.45+k*.45,-.72,.32);pt(s,'sph',FLC[(k+HN)%5],.17,.17,.17,-.45+k*.45,-.58,.37);}}}
function timber(g,W,D,y0,H){const T='#5a3418';for(const sx of[-1,1])for(const sz of[-1,1])pt(g,'box',T,.36,H,.36,sx*W/2,y0+H/2,sz*D/2);
  for(const sz of[-1,1]){const z=sz*(D/2+.03);pt(g,'box',T,W+.36,.3,.2,0,y0+H-.15,z);pt(g,'box',T,W,.2,.14,0,y0+1.3,z);for(const sx of[-1,1]){pt(g,'box',T,.22,H,.14,sx*1.05,y0+H/2,z);pt(g,'box',T,.16,1.75,.12,sx*(W/4+.55),y0+.65,z,0,0,sx*sz*.95);pt(g,'box',T,.16,1.75,.12,sx*(W/4+.55),y0+.65,z,0,0,-sx*sz*.95);}}
  for(const sx of[-1,1]){const x=sx*(W/2+.03);pt(g,'box',T,.2,.3,D+.36,x,y0+H-.15,0);pt(g,'box',T,.14,.2,D,x,y0+1.3,0);for(const sz of[-1,1])pt(g,'box',T,.14,H,.22,x,y0+H/2,sz*1.6);}}
function cottage(g,v,farm){HN++;const k=HN%4,w=WLC[HN%4],r=RFC[HN%5],sc=SHC[HN%5],W=6.6,D=6.2,T='#5a3418',two=k===1,H=two?3.5:4.2;
  pt(g,'box','#a39a8e',W+.4,.9,D+.4,0,.45,0);for(let i=0;i<7;i++)pt(g,'box',i%2?'#b8b0a4':'#8e867c',.7,.34,.12,-2.9+i*.97,.3+(i%2)*.3,D/2+.22);
  pt(g,'box',w,W,H,D,0,H/2,0);timber(g,W,D,0,H);
  pt(g,'box',T,1.9,2.95,.2,0,1.5,D/2+.1);pt(g,'box','#9a5a28',1.5,2.6,.2,0,1.4,D/2+.2);for(const x of[-.4,0,.4])pt(g,'box','#7a4520',.05,2.5,.22,x,1.4,D/2+.21);pt(g,'sph',matMetal('#ffd24a'),.1,.1,.1,.5,1.4,D/2+.36);pt(g,'box','#b8b0a4',2.3,.25,1,0,.12,D/2+.6);pt(g,'box',r,2.5,.14,1.1,0,3.15,D/2+.5,.4);
  {const m=new THREE.Mesh(GEO.sph,matN('#ffb84a'));m.scale.set(.2,.26,.2);m.position.set(1.25,2.5,D/2+.3);g.add(m);pt(g,'box',T,.08,.08,.34,1.25,2.8,D/2+.17);}
  const wy=two?2.3:2.55;for(const x of[-2.15,2.15])winF(g,x,wy,D/2+.05,0,sc,1);winF(g,W/2+.05,wy,0,Math.PI/2,sc,1);winF(g,-W/2-.05,wy,0,-Math.PI/2,sc,0);winF(g,1.6,wy,-D/2-.05,Math.PI,sc,0);
  let top=H;if(two){const W2=W+.6,D2=D+.6;pt(g,'box',T,W2+.1,.3,D2+.1,0,H+.1,0);pt(g,'box',w,W2,3,D2,0,H+1.7,0);timber(g,W2,D2,H+.2,3);for(const x of[-2.15,2.15])winF(g,x,H+1.85,D2/2+.05,0,sc,x>0);winF(g,W2/2+.05,H+1.85,0,Math.PI/2,sc,0);winF(g,-W2/2-.05,H+1.85,0,-Math.PI/2,sc,0);top=H+3.2;
    roof(g,D2,W2,top,3,r,w,1);pt(g,'cyl','#3a2416',.5,.12,.5,0,top+1.5,D2/2+.03,Math.PI/2);pt(g,'box',T,.2,2.6,.12,0,top+1.2,D2/2+.02);}
  else{roof(g,W,D,top,3.3,r,w);if(k===3){pt(g,'box',w,1.7,1.5,1.6,1.5,top+1.25,2.3);winF(g,1.5,top+1.3,3.12,0,sc,0);roof(g,1.6,1.9,top+2,.9,r,w,1);}
    if(k===2){pt(g,'box','#a8743c',1.5,2.5,3.6,W/2+.75,1.25,-.6);pt(g,'box',r,1.9,.2,4.2,W/2+.85,2.75,-.6,0,0,-.35);for(let i=0;i<4;i++)pt(g,'cyl',i%2?'#c9955a':'#b07d44',.3,1.4,.3,W/2+.75,.35+(i>1?.55:0),1.6+(i%2)*.62,0,0,Math.PI/2);}}
  const cx=two?-1.2:-1.9,cz=-1.1,cy=top+(two?2.4:2.5);pt(g,'box','#9a9288',1.05,3.4,1.05,cx,cy-.6,cz);pt(g,'box','#7c746a',1.3,.3,1.3,cx,cy+1.2,cz);pt(g,'box','#55504a',.7,.3,.7,cx,cy+1.45,cz);for(let i=0;i<4;i++)pt(g,'box',i%2?'#b0a89c':'#857d73',.5,.28,.08,cx-.2+(i%2)*.4,cy-1+i*.5,cz+.54);smoke(g,cx,cy+1.8,cz);
  pt(g,'box',T,.12,.12,1.2,-W/2-.6,3.3,D/2-.3,0,Math.PI/2);if(k!==2){pt(g,'box','#c9955a',1.2,.75,.08,-W/2-.75,2.85,D/2-.3);pt(g,'box',sc,.5,.3,.1,-W/2-.75,2.85,D/2-.28);}
  if(farm){pt(g,'sph','#f0c93a',1.9,1.5,1.9,5.4,1.1,1.2);pt(g,'sph','#e0b62e',1.3,1.1,1.3,6.3,.8,-1.4);pt(g,'cyl','#8a5a30',.07,2.8,.07,4.2,1.4,2.6,0,0,.2);}
  else{pt(g,'cyl','#a8743c',.62,1.3,.62,-W/2-.9,.65,D/2+.5);for(const y of[.3,1])pt(g,'cyl','#4a3a2a',.66,.1,.66,-W/2-.9,y,D/2+.5);pt(g,'box','#b98a52',1,.9,1,W/2+.1,.45,D/2+1.1,0,.3);pt(g,'box','#8a5a30',1.04,.1,1.04,W/2+.1,.9,D/2+1.1,0,.3);}}
function house(g,st,v){const w=v.w,D='#3a2416',T='#6b4a2e';let r=v.r;
  if(st==='cot'||st==='farm')cottage(g,v,st==='farm');
  else if(st==='tree'){pt(g,'cyl','#5e3c1e',2.1,6.4,2.1,0,3.2,0,0,0,0,true);pt(g,'sph',w,4.1,3,4.1,0,7.8,0);pt(g,'cone',r,5,3.6,5,0,10.9,0,0,0,0,true);pt(g,'sph','#6b4423',.5,.5,.5,0,12.8,0);pt(g,'box',D,1.3,2,.3,0,7.3,3.95);win(g,2.3,8.1,3.2,.6);win(g,-2.3,8.1,3.2,-.6);pt(g,'box','#8a5a30',.9,6.6,.2,0,3.2,2.3,-.12);pt(g,'cyl','#8a5a30',4.6,.25,4.6,0,6.2,0);}
  else if(st==='stilt'){for(const[x,z]of[[2.6,2.6],[-2.6,2.6],[2.6,-2.6],[-2.6,-2.6]])pt(g,'cyl','#3d3026',.3,3.6,.3,x,1.8,z);pt(g,'box','#4a3a2a',7.4,.3,7.4,0,3.5,0);pt(g,'box',w,6,3.6,6,0,5.4,0);pt(g,'pyr',r,5.6,3.2,5.6,0,8.8,0,0,Math.PI/4,0,true);pt(g,'box',D,1.3,2.3,.3,0,4.8,3.05);win(g,1.9,5.8,3,0);pt(g,'box','#4a3a2a',1,4.2,.2,0,1.7,4.4,-.45);lantern(g,3.2,3.4,3.5);}
  else if(st==='igloo'){const d=new THREE.Mesh(GEO.hsph,mat(w));d.scale.set(4.6,3.8,4.6);d.castShadow=true;g.add(d);pt(g,'cyl',w,1.6,1.9,1.6,0,.9,4.4,Math.PI/2);pt(g,'sph','#141018',1.1,1.3,.5,0,.9,5.35);win(g,2.7,2.2,2.9,.75);pt(g,'cyl','#7a7068',.4,1.6,.4,-1.5,3.6,-1);for(let i=0;i<5;i++)pt(g,'box',r,1.2,.5,.3,Math.cos(i*.7+.4)*4.3,.9+i%2*.8,Math.sin(i*.7+.4)*4.3,0,-i*.7-.4+1.57);}
  else if(st==='tent'){pt(g,'cone',w,4,6,4,0,3,0,0,.4,0,true);pt(g,'cone',r,4.1,1.7,4.1,0,5.25,0,0,.4,0,true);pt(g,'box','#141018',1.4,2.6,.3,0,1.2,3.2);pt(g,'cyl','#5a4a3a',.1,1,.1,0,6.3,0);}
  else if(st==='forge'){pt(g,'box',w,6.8,5,6.4,0,2.5,0,0,0,0,true);pt(g,'box',r,7.4,.9,7,0,5.3,0,0,0,0,true);pt(g,'box',w,1.6,4.5,1.6,-2,7.2,-1.6,0,0,0,true);const ch=new THREE.Mesh(GEO.cone,glow('#ff6a1a',2.4));ch.scale.set(.6,1.4,.6);ch.position.set(-2,9.9,-1.6);g.add(ch);SPIN.push({m:ch,fire:1});pt(g,'box','#141018',1.7,2.8,.3,0,1.4,3.25);const fw=new THREE.Mesh(GEO.box,glow('#ff7a2a',2));fw.scale.set(1.3,1,.25);fw.position.set(2.2,2.6,3.2);g.add(fw);pt(g,'box','#2a2622',1.6,.9,1,4.6,.45,1.5);pt(g,'box','#55504a',2,.35,1.2,4.6,1.05,1.5);}
  else{pt(g,'sph',w,5.2,3.4,5.2,0,.3,0,0,0,0,true);pt(g,'sph','#6a3a20',3.2,2.3,3.4,2.5,.3,-1.5,0,0,0,true);pt(g,'sph','#141018',1.5,1.8,.8,0,1,4.6);pt(g,'cone','#f6efe6',.25,1.7,.25,1.8,2.3,4.5,.3);pt(g,'cone','#f6efe6',.25,1.7,.25,-1.8,2.3,4.5,.3);win(g,3,2.3,3.3,.7);}
  bakeStatic(g);}
const FORTV={},DUNV={};
function villageDecor(v,vi,y0,n){const D=new THREE.Group(),R=rng(vi*77+5),hh=(x,z)=>height(v.x+x,v.z+z)-y0,cozy=v.st==='cot'||v.st==='farm',ST=v.st==='igloo'?['#dfe8f0','#c8d4e0','#eef4f8','#b4c2d0']:['#d6ccb8','#bdb3a1','#e4dac6','#aaa293'];D.position.set(v.x,y0,v.z);
  const stone=(x,z,s)=>{const h=hh(x,z);if(h+y0<.5)return;pt(D,'cyl',ST[(R()*4)|0],s,.2,s*(.8+R()*.3),x,h+.05,z,0,R()*3);};
  for(const r of[2.9,4.2,5.5,6.8,8.1]){const c=Math.round(r*2.5);for(let i=0;i<c;i++){const a=i/c*6.283+r;stone(Math.cos(a)*r+(R()-.5)*.3,Math.sin(a)*r+(R()-.5)*.3,.5+R()*.16);}}
  for(let i=0;i<n;i++){const a=i/n*6.283+.5+vi;for(let d=9.3;d<15.6;d+=1.05)for(const o of[-.62,.62])stone(Math.cos(a)*d-Math.sin(a)*(o+(R()-.5)*.3),Math.sin(a)*d+Math.cos(a)*(o+(R()-.5)*.3),.46+R()*.14);}
  const sub=(a,d,face)=>{const s=new THREE.Group(),x=Math.cos(a)*d,z=Math.sin(a)*d;s.position.set(x,hh(x,z),z);s.rotation.y=-a-Math.PI/2+(face||0);D.add(s);return s;};
  if(v.st!=='den'&&v.st!=='forge'){for(let i=0;i<4;i++){const s=sub(i*1.571+.05,3.3);pt(s,'box','#8a8072',2.6,.3,.9,0,.15,0);pt(s,'box','#4a3320',2.3,.2,.6,0,.3,0);for(let k=0;k<5;k++){pt(s,'sph','#3fa83a',.26,.24,.24,-.9+k*.45,.48,(k%2)*.16-.08);pt(s,'sph',FLC[(k+i+vi)%5],.17,.17,.17,-.9+k*.45,.66,(k%2)*.16-.08);}}
    for(let i=0;i<2;i++){const s=sub(i*3.14+2.35,6.6);pt(s,'box','#a8743c',2.4,.16,.7,0,.7,0);pt(s,'box','#a8743c',2.4,.6,.12,0,1.15,-.34,-.15);for(const x of[-1,1])pt(s,'box','#6b4a2a',.16,.7,.6,x,.35,0);}
    {const s=sub(.85+vi,7.6);pt(s,'cyl','#6b4a2a',.13,3.2,.13,0,1.6,0);pt(s,'box','#d9b06a',1.5,.42,.1,.55,2.7,0);pt(s,'box','#c99a55',1.3,.42,.1,-.45,2.15,0,0,.5);pt(s,'cone','#6b4a2a',.2,.3,.2,0,3.3,0);}}
  if(cozy)for(let i=0;i<n;i++){const a=(i+.5)/n*6.283+.5+vi,gx=Math.cos(a)*21.5,gz=Math.sin(a)*21.5;if(height(v.x+gx,v.z+gz)<1)continue;const s=sub(a,21.5);
    for(let k=0;k<3;k++){pt(s,'box','#5a3c22',4.6,.3,.85,0,.12,-1.25+k*1.25);for(let q=0;q<5;q++){const x=-1.8+q*.9,z=-1.25+k*1.25,t=(k+i)%3;if(t===0){pt(s,'sph','#5fc23a',.36,.3,.36,x,.42,z);pt(s,'sph','#8fdc5a',.2,.2,.2,x,.56,z);}else if(t===1){pt(s,'cone','#3fa83a',.2,.6,.2,x,.6,z);pt(s,'sph','#ff8a1e',.16,.12,.16,x,.3,z);}else{pt(s,'sph',q%2?'#ff7a1a':'#e83a2e',.34,.28,.34,x,.42,z);pt(s,'cyl','#3f8a2e',.05,.2,.05,x,.72,z);}}}
    for(let q=0;q<6;q++){const x=-2.9+q*1.16;for(const z of[-2.3,2.3]){if(z>0&&(q===2||q===3))continue;pt(s,'box','#c9a56a',.16,1.1,.16,x,.55,z);pt(s,'cone','#c9a56a',.14,.2,.14,x,1.2,z);}}for(const z of[-2.3,2.3])for(const y of[.45,.85]){if(z>0){pt(s,'box','#d8b67c',2.5,.1,.08,-1.75,y,z);pt(s,'box','#d8b67c',2.5,.1,.08,1.75,y,z);}else pt(s,'box','#d8b67c',5.9,.1,.08,0,y,z);}
    for(const x of[-2.95,2.95]){for(const z of[-1.15,0,1.15])pt(s,'box','#c9a56a',.16,1.1,.16,x,.55,z);for(const y of[.45,.85])pt(s,'box','#d8b67c',.08,.1,4.6,x,y,0);}
    if(i%3===0){pt(s,'cyl','#8a5a30',.09,2.6,.09,2.2,1.3,-1.6);pt(s,'box','#8a5a30',1.8,.1,.1,2.2,1.9,-1.6);pt(s,'box','#d9483b',.8,.9,.4,2.2,1.75,-1.6);pt(s,'sph','#f0d9a0',.34,.34,.34,2.2,2.5,-1.6);pt(s,'cone','#c9955a',.55,.4,.55,2.2,2.9,-1.6);}
    if(i%2){for(const x of[-2.4,2.4])pt(s,'cyl','#8a6a42',.1,2.9,.1,x,1.45,-3.7);pt(s,'box','#f4efe6',4.8,.04,.04,0,2.75,-3.7);for(let q=0;q<5;q++)pt(s,'box',['#ffffff','#ff7a8a','#6ab8ff','#ffe07a','#ffffff'][q],.62,q%2?.9:.7,.05,-1.8+q*.9,2.75-(q%2?.45:.35),-3.7);}
    else{for(let q=0;q<3;q++){pt(s,'cyl','#3fa83a',.06,1.9,.06,-1.6+q*1.6,.95,-3.5);pt(s,'cyl','#ffd23a',.42,.08,.42,-1.6+q*1.6,1.95,-3.42,1.2);pt(s,'cyl','#6b4a2a',.2,.1,.2,-1.6+q*1.6,1.96,-3.38,1.2);}}}
  bakeStatic(D);W.add(D);}
function buildStructures(){
  VIL.forEach((v,vi)=>{const n=v.small?3:6,cc=CLAN[v.clan].c;
    for(let i=0;i<n;i++){const a=i/n*6.283+.5+vi,x=v.x+Math.cos(a)*19.5,z=v.z+Math.sin(a)*19.5,g=new THREE.Group();g.position.set(x,height(x,z)-.4,z);g.rotation.y=-a-Math.PI/2;house(g,v.st,v);W.add(g);COL.push({x,z,r:v.st==='tree'?2.6:4.5});}
    const y=height(v.x,v.z),g=new THREE.Group();g.position.set(v.x,y,v.z);
    if(v.small||v.st==='den'||v.st==='forge'){pt(g,'cyl','#5a4a3a',1.4,.3,1.4,0,.15,0);for(let i=0;i<5;i++)pt(g,'cyl','#3d2a1a',.14,1.5,.14,Math.cos(i*1.257)*.6,.6,Math.sin(i*1.257)*.6,.5*Math.sin(i*1.257),0,-.5*Math.cos(i*1.257));const f=new THREE.Mesh(GEO.cone,glow('#ff8a2b',2.6));f.scale.set(.7,1.8,.7);f.position.y=1.2;g.add(f);SPIN.push({m:f,fire:1});}
    else{pt(g,'cyl','#8e857b',1.9,1.2,1.9,0,.6,0,0,0,0,true);pt(g,'cyl','#1f6fb0',1.55,.1,1.55,0,1.18,0);pt(g,'box','#6b4423',.25,3,.25,1.6,1.8,0);pt(g,'box','#6b4423',.25,3,.25,-1.6,1.8,0);pt(g,'pyr',v.r,2.6,1.3,1.8,0,3.9,0,0,Math.PI/4,0,true);}
    for(let i=0;i<4;i++){const a=i*1.571+.8;lantern(g,Math.cos(a)*9,Math.sin(a)*9,height(v.x+Math.cos(a)*9,v.z+Math.sin(a)*9)-y);}
    for(let i=0;i<(v.small?1:3);i++){const a=i*2.094+2.2,fx=Math.cos(a)*13.5,fz=Math.sin(a)*13.5;flag(g,fx,fz,cc,8,height(v.x+fx,v.z+fz)-y);}
    if(!v.small)villageDecor(v,vi,y,n);
    W.add(g);COL.push({x:v.x,z:v.z,r:2});const l=label(v.n,'#ffe9a8',1.15);l.position.set(v.x,y+10,v.z-3);W.add(l);
    if(v.st==='farm'){const[mx,mz]=[v.x+31,v.z-8],m=new THREE.Group();m.position.set(mx,height(mx,mz)-.3,mz);pt(m,'cone','#efe2c0',3.6,11,3.6,0,5.5,0,0,0,0,true);pt(m,'cone','#c9762b',3,2.6,3,0,12,0,0,0,0,true);const bl=new THREE.Group();bl.position.set(0,9.5,3);for(let i=0;i<4;i++){const b=pt(bl,'box','#f4efe6',1.3,6.5,.12,0,0,0);b.rotation.z=i*1.571;b.position.set(Math.sin(-i*1.571)*3.4,Math.cos(i*1.571)*3.4,0);}pt(bl,'sph','#6b4423',.5,.5,.5,0,0,0);m.add(bl);SPIN.push({m:bl});W.add(m);COL.push({x:mx,z:mz,r:3.6});}});
  for(const id in DUN){const d=DUN[id];const[x,z]=nearWalk(d[1],d[2]);d[1]=x;d[2]=z;const y=height(x,z),g=new THREE.Group();g.position.set(x,y,z);
    pt(g,'dod','#6a6660',5.2,4.8,4.2,0,2.7,-2.6,0,0,0,true);pt(g,'dod','#57534e',2.6,3,2.4,-4.4,1.2,-.8,0,1,0,true);pt(g,'dod','#57534e',2.2,2.4,2,4.2,1,-.6,0,2,0,true);pt(g,'sph','#07060a',2.4,3,1.2,0,1.8,0);
    const ring=new THREE.Mesh(GEO.tor,glow(d[8]?'#ff5d5d':'#ffd86b',2.2));ring.scale.set(2.6,3.1,2);ring.position.set(0,1.9,.6);g.add(ring);
    const l=label(d[0]+' · Niv. '+d[3],d[8]?'#ff9c9c':'#ffffff',1.2);l.position.set(0,8.5,0);g.add(l);W.add(g);COL.push({x,z:z-3,r:3.8});DUNV[id]={g,ring};}
  for(const id in FORT){const f=FORT[id];const[x,z]=nearWalk(f[1],f[2]);f[1]=x;f[2]=z;const y=height(x,z),g=new THREE.Group();g.position.set(x,y,z);
    for(let i=0;i<22;i++){const a=i/22*6.283;if(Math.abs(a-1.571)<.42)continue;const px=Math.cos(a)*12,pz=Math.sin(a)*12,hy=height(x+px,z+pz)-y;pt(g,'cyl','#6b4a2a',.55,5,.55,px,hy+2.3,pz,0,0,0,true);pt(g,'cone','#5a3c20',.55,1,.55,px,hy+5.3,pz,0,0,0,true);}
    pt(g,'box','#7a7068',4,8,4,0,4,-4,0,0,0,true);pt(g,'box','#5f574f',5,1,5,0,8.4,-4,0,0,0,true);pt(g,'pyr','#4a3a2a',3.8,2.6,3.8,0,10.2,-4,0,Math.PI/4,0,true);win(g,0,5.6,-1.95);
    const fl=flag(g,0,-4,FACTION[f[4]].c,6,11);flag(g,5,9.5,FACTION[f[4]].c,6,height(x+5,z+9.5)-y);const fl2=FLAGS[FLAGS.length-1].children[0];
    const fire=new THREE.Mesh(GEO.cone,glow('#ff8a2b',2.6));fire.scale.set(.7,1.7,.7);fire.position.set(3,1,3);g.add(fire);SPIN.push({m:fire,fire:1});pt(g,'cyl','#3d2a1a',1,.3,1,3,.15,3);
    const tg=new THREE.Group();tg.position.set(-5,0,3);house(tg,'tent',{w:'#6a5a4a',r:FACTION[f[4]].c});tg.scale.setScalar(.7);g.add(tg);
    const l=label(f[0]+' · Niv. '+f[3],'#ff9c9c',1.2);l.position.set(0,15,-4);g.add(l);W.add(g);COL.push({x,z:z-4,r:3});FORTV[id]={g,flags:[fl,fl2],label:l};}}
const UTSWAY=s=>{s.uniforms.uT=UT;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat sw=sin(uT*1.6+instanceMatrix[3].x*.31+instanceMatrix[3].z*.23);transformed.x+=sw*.07*(position.y+.7);transformed.z+=sw*.045*(position.y+.7);\n#endif');};
function buildDecor(){
  const L={trunk:[],cone:[],ball:[],rock:[],flower:[],glow:[],tuft:[]},M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),V=new THREE.Vector3(),Sc=new THREE.Vector3(),r=rng(77);
  const put=(list,x,y,z,sx,sy,sz,c,ry=0,rx=0,rz=0)=>{E.set(rx,ry,rz);Q.setFromEuler(E);V.set(x,y,z);Sc.set(sx,sy,sz);list.push({m:M4.clone().compose(V,Q,Sc),c:new THREE.Color(c).offsetHSL(0,.12,.015).convertSRGBToLinear()});};
  const clearOf=(x,z)=>{if(roadDist(x,z)<5.5)return false;for(const p of POIS)if((x-p[3])**2+(z-p[4])**2<144)return false;for(const b of BAR){const d=Math.hypot(x-b[0],z-b[1]);if(d<b[2]+7&&d>b[2]-3)return false;}for(const v of VIL)if((x-v.x)**2+(z-v.z)**2<(v===VIL[0]?56:v.st==='farm'?38:28)**2)return false;for(const id in DUN)if((x-DUN[id][1])**2+(z-DUN[id][2])**2<110)return false;for(const id in FORT)if((x-FORT[id][1])**2+(z-FORT[id][2])**2<17*17)return false;return true;};
  const pick=a=>a[(r()*a.length)|0],lt=(c,k=.1)=>'#'+new THREE.Color(c).offsetHSL(.025,.06,k).getHexString();
  const round=(x,h,z,s,cols,tr='#6b4423')=>{put(L.trunk,x,h+1.3*s,z,.42*s,2.6*s,.42*s,tr);const c=pick(cols);put(L.ball,x,h+3.9*s,z,2.3*s,2*s,2.3*s,c,r()*6);put(L.ball,x+1.3*s,h+3.2*s,z+.5*s,1.5*s,1.3*s,1.5*s,pick(cols),r()*6);put(L.ball,x-1.1*s,h+3.4*s,z-.8*s,1.6*s,1.4*s,1.6*s,pick(cols),r()*6);put(L.ball,x+.2*s,h+5.2*s,z-.2*s,1.4*s,1.2*s,1.4*s,c,r()*6);put(L.ball,x-.55*s,h+5.05*s,z-.5*s,1.45*s,1.05*s,1.45*s,lt(c),r()*6);put(L.ball,x-1.5*s,h+4*s,z-.9*s,.9*s,.7*s,.9*s,lt(c,.07),r()*6);if(r()<.3)for(let q=0;q<4;q++)put(L.flower,x+(r()-.5)*3.4*s,h+(3+r()*2)*s,z+(.6+r()*1.2)*s,.22,.22,.22,pick(['#ff4a3a','#ffd23a','#ff8ab0']));};
  const pine=(x,h,z,s,c1,c2,c3)=>{put(L.trunk,x,h+s,z,.34*s,2*s,.34*s,'#5a3a1e');put(L.cone,x,h+2.9*s,z,2.1*s,2.8*s,2.1*s,c1,r()*6);put(L.cone,x,h+4.5*s,z,1.6*s,2.5*s,1.6*s,c2,r()*6);put(L.cone,x,h+6*s,z,1.05*s,2.2*s,1.05*s,c3,r()*6);};
  const dead=(x,h,z,s,c)=>{put(L.trunk,x,h+2*s,z,.3*s,4*s,.3*s,c);put(L.trunk,x+.7*s,h+3.2*s,z,.12*s,1.8*s,.12*s,c,0,0,-.9);put(L.trunk,x-.6*s,h+2.6*s,z+.2*s,.12*s,1.5*s,.12*s,c,0,.3,.9);};
  const dens=[.15,.7,.24,.38,.3,.24,.6,.24,.46,.26,.16];
  for(let i=0;i<24000;i++){const x=(r()-.5)*1340,z=(r()-.5)*1340,h=height(x,z);if(h<1.15)continue;const rdd=roadDist(x,z);if(rdd>4.6&&rdd<10&&r()<.55){const b0=biome(x,z);if(b0!==4&&b0!==5&&b0!==9&&b0!==10&&!VIL.some(v=>(x-v.x)**2+(z-v.z)**2<900)){const s0=.8+r()*.7,bc=b0===2?'#7aa832':b0===6?'#c0662a':'#2a8a3c';put(L.ball,x,h+.75*s0,z,1.6*s0,1.15*s0,1.6*s0,bc,r()*6);put(L.ball,x+1.2*s0,h+.5*s0,z+.5,1.05*s0,.8*s0,1.05*s0,bc,r()*6);if(r()<.4)put(L.flower,x-.9,h+.4,z+1.1,.3,.3,.3,pick(['#ff6fa0','#ffd24a','#ffffff']));}continue;}if(!clearOf(x,z))continue;const b=biome(x,z),s=.8+r()*.8,k=r();
    if(r()<dens[b]){
      if(b===0)round(x,h,z,s,['#5fae3e','#74bd48','#4f9e38']);
      else if(b===1){if(k<.6)round(x,h,z,s*1.25,['#357a30','#2f6e2c','#3f8a34','#2a6030'],'#4a2f18');else pine(x,h,z,s*1.1,'#255a30','#2b6836','#327a3e');}
      else if(b===2)round(x,h,z,s,['#e08a2b','#e8c23a','#d9a030','#c9662b']);
      else if(b===3){if(k<.45)dead(x,h,z,s,'#3d3026');else{put(L.trunk,x,h+1.4*s,z,.5*s,2.8*s,.5*s,'#3d3026');put(L.ball,x,h+3.6*s,z,3*s,1.6*s,3*s,'#35523f',r()*6);put(L.ball,x+1.6*s,h+2.6*s,z,1.5*s,1.9*s,1.5*s,'#2f4a3a',r()*6);put(L.ball,x-1.5*s,h+2.6*s,z+.5,1.4*s,1.9*s,1.4*s,'#3a5a45',r()*6);}}
      else if(b===4)pine(x,h,z,s,'#3f7a66','#9fc8c0','#f2f8fc');
      else if(b===5){if(k<.5)dead(x,h,z,s,'#1c1414');else{put(L.rock,x,h+.7*s,z,1.8*s,1.5*s,1.6*s,'#2e2424',r()*6);if(k<.75)put(L.glow,x+.4,h+.5,z+1.1*s,.5*s,.3*s,.5*s,'#ff5a1a');}}
      else if(b===6)round(x,h,z,s*1.15,['#d9542b','#e07a22','#c23a22','#e8a02a','#b83a1c'],'#4a2a18');
      else if(b===8){if(k<.6)pine(x,h,z,s*1.2,'#1c342e','#234238','#2b5044');else{put(L.trunk,x,h+1.5*s,z,.5*s,3*s,.5*s,'#2e2620');put(L.ball,x,h+3.8*s,z,2.8*s,1.7*s,2.8*s,'#2c4a3a',r()*6);put(L.ball,x+1.4*s,h+2.8*s,z,1.4*s,2*s,1.4*s,'#264236',r()*6);}}
      else if(b===9){if(k<.35)dead(x,h,z,s,'#120c0c');else{put(L.rock,x,h+.8*s,z,2*s,1.7*s,1.8*s,'#1c1616',r()*6);if(k<.8){put(L.glow,x+.6,h+.4,z+1.2*s,.6*s,.35*s,.6*s,'#ff4a12');put(L.glow,x-1*s,h+.3,z-.6,.4*s,.25*s,.4*s,'#ff8a1a');}}}
      else if(b===10){if(k<.4)dead(x,h,z,s*1.2,'#1e1c1a');else if(k<.75)put(L.rock,x,h+1.8*s,z,1.1*s,3.8*s,1*s,'#34363a',r()*6,.08,.1);else{put(L.cone,x,h+.6,z,.25,1.3,.25,'#d8d2c2',0,.3,1.2);put(L.cone,x+.5,h+.4,z+.3,.2,1,.2,'#d8d2c2',0,1.2,.4);put(L.flower,x-.4,h+.35,z,.38,.3,.42,'#d8d2c2');}}
      else{if(k<.4)pine(x,h,z,s,'#22303a','#2c3e4a','#5a6a7a');else if(k<.75){put(L.rock,x,h+1.4*s,z,1.5*s,3.2*s,1.4*s,'#3a3d4a',r()*6,.1,.15);}else{put(L.glow,x,h+1.2*s,z,.5*s,2.6*s,.5*s,'#5ad0ff',r()*6,.15,.1);put(L.glow,x+.7,h+.7*s,z+.3,.3*s,1.5*s,.3*s,'#9a7aff',0,-.2,.3);}}
    }else if(k<.07)put(L.rock,x,h+.3*s,z,.9*s,.7*s,.9*s,b===4?'#aab4c0':b===5||b===7?'#3a3238':'#8e857b',r()*6);
    else if(k<.13&&(b<3||b===6)){put(L.ball,x,h+.5*s,z,1.1*s,.8*s,1.1*s,b===6?'#c9662b':b===2?'#b8a030':'#3f8a34',r()*6);}
    else if(k<.42&&(b===0||b===2||b===1||b===6))put(L.flower,x,h+.35,z,.26,.26,.26,pick(['#f7e26b','#ffffff','#ee8fd3','#ff8a5c','#9fd0ff','#ff5a7a']));
    else if(k<.2&&b===1){put(L.trunk,x,h+.3,z,.12,.6,.12,'#f0e8d8');put(L.flower,x,h+.7,z,.5,.3,.5,'#d9342b');}
    else if(k<.3&&b===3&&h<2.4){for(let j=0;j<3;j++)put(L.trunk,x+j*.4,h+1.1,z+(j%2)*.4,.06,2.2,.06,'#b8a060',0,0,.1*j-.1);}
    else if(k<.2&&b===3)put(L.glow,x,h+.25,z,.16,.16,.16,'#9aff8a');
    else if(k<.6&&(b<4||b===6||b===8)){const gc=b===2?'#c9a82e':b===6?'#d9762a':b===3?'#3f7a55':b===8?'#2f6a52':'#3fa838';for(let q=0;q<4;q++)put(L.tuft,x+(q-1.5)*.36,h+.45,z+(q%2)*.35,.2,1+q%2*.35,.2,gc,0,(q-1.5)*.16,(q-1.5)*-.22);}
    else if(k<.63&&b<4){put(L.trunk,x,h+.35,z,.6*s,.7,.6*s,'#7a5230');put(L.flower,x,h+.72,z,.52*s,.05,.52*s,'#d9b98a');}
    else if(k<.66&&h>1.5){put(L.rock,x,h+.4*s,z,1.3*s,.9*s,1.1*s,b===4?'#b8c2ce':'#9a9288',r()*6);put(L.rock,x+1.1*s,h+.25*s,z+.4,.7*s,.5*s,.7*s,b===4?'#a4aebc':'#857d73',r()*6);if(b<4)put(L.ball,x-.3*s,h+.95*s,z-.2,.9*s,.35*s,.8*s,'#5fae3e',r()*6);}}
  for(let i=0;i<16000;i++){const x=(r()-.5)*1340,z=(r()-.5)*1340,h=height(x,z);if(h>1.1||h<-.9||lavaAt(x,z))continue;const b=biome(x,z);if(b===5||b===9)continue;const k=r(),fresh=b===0||b===1||b===3||b===2;
    if(h<-.12){if(fresh&&k<.5){const s=.55+r()*.5;put(L.flower,x,.05,z,s,.04,s,pick(['#3fae4a','#56c25a','#2f9a44']));if(k<.12){put(L.flower,x+.1,.16,z,.2,.14,.2,pick(['#ff9ac0','#ffffff','#ffe07a']));}}}
    else if(h<.45){if(b!==4&&k<.5)for(let q=0;q<4;q++){const hx=x+(q-1.5)*.3,hz=z+(q%2)*.3,l=1.6+r()*1.2;put(L.tuft,hx,h+l/2,hz,.09,l,.09,b===3?'#7a8a48':'#5fa83a',0,0,(q-1.5)*.07);if(q%2)put(L.trunk,hx,h+l,hz,.1,.5,.1,'#7a4a22');}else if(k<.62)put(L.rock,x,h+.2,z,.8+r()*.6,.5,.7+r()*.5,'#a8a094',r()*6);}
    else if(k<.16&&b!==4)put(L.flower,x,h+.1,z,.2,.1,.2,pick(['#ff8a6a','#ffffff','#ffc0d0','#ffe9a8']));else if(k<.2)put(L.rock,x,h+.12,z,.4,.3,.4,'#c8c0b4',r()*6);}
  for(const v of VIL){if(v.small)continue;for(let i=0;i<46;i++){const a=r()*6.283,d=23+r()*4,x=v.x+Math.cos(a)*d,z=v.z+Math.sin(a)*d,h=height(x,z);if(h<1.2||roadDist(x,z)<4)continue;if(i%5===0){put(L.ball,x,h+.6,z,1.3,.95,1.3,'#2a8a3c',r()*6);}else put(L.flower,x,h+.38,z,.3,.3,.3,pick(['#ff6fa0','#ffd24a','#ffffff','#ff8a5c','#b98aff']));}}
  const inst=(geo,list,material,shadow)=>{if(!list.length)return;const m=new THREE.InstancedMesh(geo,material,list.length);list.forEach((o,i)=>{m.setMatrixAt(i,o.m);m.setColorAt(i,o.c);});m.castShadow=shadow;m.receiveShadow=shadow;m.frustumCulled=false;W.add(m);};
  const sm=f=>{const m=new THREE.MeshToonMaterial({gradientMap:GRAD});m.onBeforeCompile=UTSWAY;return m;},TM=()=>new THREE.MeshToonMaterial({gradientMap:GRAD});
  const BLOB=new THREE.IcosahedronGeometry(1,1);{const p=BLOB.attributes.position,n=BLOB.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.17*Math.sin(x*5.1+y*3.3)+.13*Math.sin(z*6.7+x*2.1),l=Math.hypot(x,y,z);p.setXYZ(i,x*k,y*k,z*k);n.setXYZ(i,x/l,y/l+.25,z/l);}}
  inst(new THREE.CylinderGeometry(.8,1,1,7),L.trunk,TM(),true);inst(new THREE.ConeGeometry(1,1,9),L.cone,sm(true),true);inst(BLOB,L.ball,sm(false),true);inst(GEO.dod,L.rock,TM(),true);inst(new THREE.ConeGeometry(1,1,4),L.tuft,TM(),false);
  inst(new THREE.SphereGeometry(1,6,4),L.flower,TM(),false);
  if(L.glow.length){L.glow.forEach(o=>o.c.multiplyScalar(2.6));inst(new THREE.ConeGeometry(1,1,5),L.glow,new THREE.MeshBasicMaterial({toneMapped:false}),false);}}

/* ───────── JOUR / NUIT, AMBIANCE ───────── */
let dayF=1,wRain=0,wFire=0,wFogB=0,flash=0,flashT=6;const _c1=new THREE.Color(),_c2=new THREE.Color(),SKY=BIO.map(b=>lin(b.sky)),SUNDAY=lin(0xfff0d8),SUNDUSK=lin(0xff9a55),MOON=lin(0x8fa8ff),NSKY=lin(0x0c1430),ambCol=new THREE.Vector3(1,1,.8);
function gfxTick(dt,px,py,pz,tod,bi){UT.value+=dt;LPOOL.opacity=(1-dayF)*.5;for(const s of SMOKE){const t=(UT.value*.2+s.o)%1;s.m.position.set(s.x+t*t*1.4,s.y+t*4.4,s.z+t*.5);s.m.scale.setScalar(.3+t*.95);s.m.material.opacity=.5*(1-t)*Math.min(1,t*7);}UP.value.set(px,py,pz);
  if(area==='world'){const el=Math.sin((tod-.25)*6.283);dayF=sstep(-.18,.22,el);const dusk=1-sstep(.0,.45,Math.abs(el));
    const B=BIO[bi],fg=B.fog||[75,190],kk=Math.min(1,dt*1.2);wRain=lerp(wRain,B.rain?1:0,kk);wFire=lerp(wFire,B.fire?1:0,kk);wFogB=lerp(wFogB,fg[0]<20?1:0,kk);scene.fog.near=lerp(scene.fog.near,fg[0],kk);scene.fog.far=lerp(scene.fog.far,fg[1],kk);UFN.value=scene.fog.near;UFF.value=scene.fog.far;
    RAIN.visible=wRain>.03;RAIN.material.uniforms.uR.value=wRain;if(flash>0)flash-=dt*3;if(wRain>.6){flashT-=dt;if(flashT<=0){flashT=5+Math.random()*9;flash=1;sfx(70,1.1,'sawtooth',.07,-35,.15);sfx(46,1.4,'square',.04,-10,.3);}}
    const dim=(1-.5*wRain)*(1-.3*wFogB)*(1-.1*wFire);_c1.copy(SUNDAY).lerp(SUNDUSK,Math.max(dusk*.8,wFire*.7));_c2.copy(MOON).lerp(_c1,dayF);sun.color.copy(_c2);sun.intensity=lerp(.2,.52,dayF)*dim;hemi.intensity=lerp(.34,.58,dayF)*(1-.2*wFogB)*(1-.12*wRain)+Math.max(0,flash)*1.2;hemi.groundColor.setRGB(lerp(.62,.8,wFire),lerp(.66,.36,wFire),lerp(.56,.24,wFire));
    const a=tod*6.283;sun.position.set(px+Math.cos(a)*45+10,py+lerp(38,70,dayF),pz+28+Math.sin(a)*12);sun.target.position.set(px,py,pz);
    _c1.copy(SKY[bi]).lerp(SUNDUSK,dusk*.35*dayF).lerp(NSKY,1-dayF);scene.background.lerp(_c1,Math.min(1,dt*2));scene.fog.color.copy(scene.background);
    const lv=lerp(.4,1.04,dayF)*(.45+.55*dim)+Math.max(0,flash)*.8;ULIGHT.value.set(lerp(lv*.75,lv*(1+dusk*.12),dayF),lv,lerp(lv*1.5,lv*(1-dusk*.15),dayF));USUN.value=dayF;
    const A=AMB[bi],u=AMBI.material.uniforms,k=Math.min(1,dt*1.5);_c1.set(A[0]).convertSRGBToLinear();const gl=A[6]*(bi===3||bi===5?1:lerp(1.6,1,dayF));ambCol.lerp(_v.set(_c1.r*gl,_c1.g*gl,_c1.b*gl),k);u.uCol.value.copy(ambCol);
    u.uVel.value.lerp(_v.set(A[1],A[2],A[3]),k);u.uSize.value=lerp(u.uSize.value,A[4],k);u.uA.value=lerp(u.uA.value,A[5],k);
    const ni=.12+(1-dayF)*3.4;for(const m of NIGHT)m.emissiveIntensity=ni;}
  else{torch.position.set(px,py+7,pz+2);}
  for(const c of CLD){const u=c.userData,x=((u.ox+UT.value*2.4-px+160)%320+320)%320-160+px,z=((u.oz-pz+160)%320+320)%320-160+pz;c.visible=area==='world';c.position.set(x,py+22,z);u.m.opacity=.9*sstep(11,26,Math.hypot(x-px,z-pz-18))*(1-.5*wFogB)*lerp(.45,1,dayF);}
  for(const f of FLAGS)f.rotation.y=Math.sin(UT.value*2.2+f.position.x)*.35-.2;
  for(const s of SPIN){if(s.fire){const k=1+Math.sin(UT.value*13+s.m.position.x)*.15;s.m.scale.set(.7*k,1.7*(2-k),.7*k);}else s.m.rotation.z+=dt*.7;}}
const _v=new THREE.Vector3();
function buildClouds(){const r=rng(31);for(let i=0;i<9;i++){const g=new THREE.Group(),mm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false,toneMapped:false,fog:false});for(let k=0;k<5;k++){const s=new THREE.Mesh(GEO.sph,mm),q=2.6+r()*3;s.scale.set(q*1.5,q*.7,q);s.position.set((k-2)*3.4+r()*2,r()*1.3,r()*3-1.5);g.add(s);}g.userData={ox:r()*320,oz:r()*320,m:mm};g.renderOrder=6;scene.add(g);CLD.push(g);}}
function buildWorld(){bakeMaps();buildTerrain();buildStructures();buildDecor();buildClouds();applyQuality();}
