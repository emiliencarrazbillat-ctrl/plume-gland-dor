'use strict';
/* Plume & le Gland d'Or — logique de jeu */
const SLOT={w:'Arme',a:'Armure',h:'Coiffe'};
const SPELLS=[['Flammèche','🔥',35],['Soin','💚',45],['Éclair','⚡',40],['Givre','❄️',40],['Cri de guerre','📯',30],['Météore','💥',55],['Tempête','🌀',50]];
const DIFF=[['Aventure',.85,.8,1.1],['Héroïque',1.25,1.3,.88],['Cauchemar',1.55,1.75,.74]];SECRETS.push(['chouette','riddle',-300,62,'La Vieille Chouette',[],0]);
let SAVEKEY='plume_gland_s1',CURSLOT=1;
let S=null,state='title',time=0,menuOpen=false,busy=false;
const newState=()=>({lvl:1,xp:0,gold:0,hp:9999,mp:100,x:-1,z:59,inv:{baton:1},eq:{w:'baton',a:null,h:null},sp:[0,0,0,0,0,0,0],qd:{},q:null,ch:{},rest:[-1,59],inns:{},rep:{},army:[],forts:{},raid:null,raidCd:420,fl:{},pz:{},sec:{},hostile:{},diff:1,ab:{},vil:{b:{},wins:0,raidCd:540,dmg:{},raid:null},mat:0,garr:{},track:null,wp:null,home:0,time:0,kills:0,won:0,intro:0});
function fixState(s){const d=newState();for(const k in d)if(s[k]===undefined)s[k]=d[k];while(s.sp.length<7)s.sp.push(0);return s;}
function save(){if(!S||state!=='play')return;try{if(area==='world'){S.x=P.x;S.z=P.z;}localStorage.setItem(SAVEKEY,JSON.stringify(S));}catch(e){}}
function loadSave(){try{let s=JSON.parse(localStorage.getItem(SAVEKEY));if(!s)s=JSON.parse(localStorage.getItem('plume_gland_v1'));if(s&&s.inv&&s.qd)return fixState(s);}catch(e){}return null;}
const need=L=>Math.round(45*L**1.55);
const repOf=c=>S.rep[c]||0,allied=c=>repOf(c)>=50&&!S.hostile[c],nAllies=()=>Object.keys(CLAN).filter(allied).length;
const RANKS=['Inconnue','Amie','Alliée','Championne'],rank=c=>repOf(c)>=80?3:repOf(c)>=50?2:repOf(c)>=20?1:0;
const armyCap=()=>Math.min(12,2+Math.floor(S.lvl/4)+nAllies());
const owned=id=>!!S.forts[id],nForts=()=>Object.keys(FORT).filter(owned).length;
function itemStat(id,k){const lv=S.inv[id]||1;return IT[id][k]*(1+.2*(lv-1));}
function stats(){let atk=8+3*S.lvl,def=S.lvl,hp=90+24*S.lvl,mag=6+2.5*S.lvl;for(const s in S.eq){const id=S.eq[s];if(id){atk+=itemStat(id,3);def+=itemStat(id,4);hp+=itemStat(id,5);mag+=itemStat(id,6);}}
  if(allied('lac'))hp*=1.1;if(allied('glands'))atk*=1.1;if(allied('givre'))def*=1.15;if(allied('blaireaux')){atk*=1.08;def*=1.08;}return{atk,def,hp:Math.round(hp),mag};}
const score=id=>itemStat(id,3)*2+itemStat(id,4)*2+itemStat(id,5)*.2+itemStat(id,6)*1.5;
function giveItem(id){const had=S.inv[id];S.inv[id]=Math.min(9,(had||0)+1);const s=IT[id][1];let msg=had?IT[id][0]+' amélioré (niv. '+S.inv[id]+')':'Objet obtenu : '+IT[id][0];if(!S.eq[s]||score(id)>score(S.eq[s])){S.eq[s]=id;msg+=' — équipé';}return msg;}
function loot(tier){const c=Object.keys(IT).filter(k=>IT[k][2]<=tier&&IT[k][2]>=tier-2);return giveItem(c[Math.floor(Math.random()*c.length)]);}
function addGold(n){n=Math.round(n*(allied('dore')?1.25:1));S.gold+=n;return n;}
function gainXP(n){S.xp+=n;let up=false;while(S.xp>=need(S.lvl)&&S.lvl<45){S.xp-=need(S.lvl);S.lvl++;up=true;}if(up){S.hp=stats().hp;S.mp=100;fanfare();note('Niveau '+S.lvl+' !');burst(P.x,ground(P.x,P.z)+2,P.z,'#ffd86b',18);if(evoStage()!==P.evo)evoRefresh(1);}}
function addRep(c,n){if(!CLAN[c])return;const o=repOf(c),v=Math.min(100,o+n);S.rep[c]=v;if(o<20&&v>=20)note(CLAN[c].n+' : tu peux désormais recruter ses soldats.');if(o<50&&v>=50){note('Alliance scellée avec le '+CLAN[c].n+' ! Bonus : '+CLAN[c].bonus+'.');horn();}if(o<80&&v>=80)note('Championne du '+CLAN[c].n+' : recrutement à moitié prix.');}
const clanOf=g=>{const d=NPCD[g];if(d[3]>=0)return VIL[d[3]].clan;let b=VIL[0],bd=1e9;for(const v of VIL){const q=Math.hypot(v.x-d[4],v.z-d[5]);if(q<bd){bd=q;b=v;}}return b.clan;};

/* ───────── ENTITÉS ───────── */
const P={alt:0,st:1,fly:false,swim:false,x:0,z:52,ang:0,atkT:0,cd:0,roll:0,rollCd:0,rdx:0,rdz:0,inv:0,dead:false,walk:0,g:null,m:null,hurtT:0};
let ENT=[],ALLY=[],TEL=[],PART=[],PICK=[],NPCS=[],SPAWNS=[],FT=[],PROJ=[],warT=0,stormT=0,stormN=0,honkCd=0,YETI=null;
function buildPlayer(){P.g=new THREE.Group();P.m=mGoose('#ffffff',{scarf:'#2d6cdf',sword:1,cape:'#2456b8',hero:1});P.g.add(P.m);scene.add(P.g);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.5,1.75,32),new THREE.MeshBasicMaterial({color:lin(0x7fd0ff).multiplyScalar(1.6),transparent:true,opacity:.7,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.18;P.g.add(ring);
  const sw=new THREE.Mesh(new THREE.RingGeometry(2.4,5.8,24,1,-1.15,2.3),new THREE.MeshBasicMaterial({color:lin(0xe8f6ff).multiplyScalar(2.4),map:(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,26,64,64,64);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.55,'rgba(255,255,255,.12)');g.addColorStop(.86,'rgba(255,255,255,.9)');g.addColorStop(.95,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})(),transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));sw.rotation.x=-Math.PI/2;sw.rotation.z=-Math.PI/2;sw.position.y=1.4;P.g.add(sw);P.swing=sw;}
function buildNPCs(){for(const id in NPCD){const d=NPCD[id];let x=d[4],z=d[5],cx=x,cz=z+1;if(d[3]>=0){cx=VIL[d[3]].x;cz=VIL[d[3]].z;x+=cx;z+=cz;}[x,z]=nearWalk(x,z);
  const g=new THREE.Group();g.position.set(x,height(x,z),z);const o=Object.assign({},d[7]);if(d[3]>=0&&!o.tab&&!o.scarf&&!o.bandana&&d[1]!=='qd')o[d[1]==='go'?'scarf':'bandana']=CLAN[VIL[d[3]].clan].c;
  const m=d[1]==='go'?mGoose(d[2],o):d[1]==='sq'?mSquirrel(d[2],o):mQuad(d[2],o);g.add(m);g.rotation.y=Math.atan2(cx-x,cz-z);
  const sd=new THREE.Mesh(CIRC,SHM);sd.rotation.x=-Math.PI/2;sd.scale.set(1.7,1.7,1);sd.position.y=.1;g.add(sd);const l=label(d[0],d[6]?'#9fe0ff':'#ffffff',.68);l.position.y=5;g.add(l);W.add(g);COL.push({x,z,r:1.1});NPCS.push({id,name:d[0],role:d[6],idle:d[8],x,z,g,m,mark:null,markT:''});}}
const MARKT={};
function markSprite(t){let tx=MARKT[t];if(!tx){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),C=t==='?'?['#b9ffbf','#2fbf5a','#0f5a2a']:t==='!'?['#fff1a0','#f5a81c','#7a4a08']:['#c8ecff','#3f9ff0','#12467a'];
    let g=x.createRadialGradient(64,54,10,64,54,62);g.addColorStop(0,C[0]+'cc');g.addColorStop(1,C[0]+'00');x.fillStyle=g;x.fillRect(0,0,128,128);
    x.beginPath();x.arc(64,52,38,Math.PI*.75,Math.PI*.25);x.lineTo(64,120);x.closePath();g=x.createLinearGradient(0,14,0,120);g.addColorStop(0,C[0]);g.addColorStop(.55,C[1]);g.addColorStop(1,C[2]);x.fillStyle=g;x.lineJoin='round';x.lineWidth=8;x.strokeStyle='#2a1a10';x.stroke();x.fill();
    x.beginPath();x.arc(64,52,29,0,6.283);x.fillStyle='rgba(255,255,255,.22)';x.fill();x.lineWidth=7;x.strokeStyle='#2a1a10';x.fillStyle='#fff';x.lineCap='round';
    if(t==='!'){x.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*.6283,r=i%2?11:25;x[i?'lineTo':'moveTo'](64+Math.cos(a)*r,53+Math.sin(a)*r);}x.closePath();x.stroke();x.fill();}
    else if(t==='?'){x.beginPath();x.moveTo(47,54);x.lineTo(59,66);x.lineTo(83,40);x.lineWidth=17;x.stroke();x.strokeStyle='#fff';x.lineWidth=8;x.stroke();}
    else{x.beginPath();x.rect(48,34,32,38);x.stroke();x.fill();x.strokeStyle=C[2];x.lineWidth=4;for(const y of[44,53,62]){x.beginPath();x.moveTo(55,y);x.lineTo(73,y);x.stroke();}}
    tx=MARKT[t]=new THREE.CanvasTexture(c);}
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false,transparent:true,toneMapped:false}));s.scale.set(3.6,3.6,1);s.renderOrder=11;return s;}
function refreshMarks(){const st=curStep();for(const n of NPCS){let t='';if(st&&(st[0]==='talk'||st[0]==='ret'||st[0]==='choice')&&st[1]===n.id)t='?';else if(!S.q){const a=availQ(n.id);if(a)t=a.m?'!':'!s';}
  if(t===n.markT)continue;n.markT=t;if(n.mark){n.g.remove(n.mark);n.mark=null;}if(t){n.mark=markSprite(t);n.mark.position.y=7.6;n.g.add(n.mark);}}}
const SHM=new THREE.MeshBasicMaterial({color:0x0a1408,transparent:true,opacity:.3,depthWrite:false});
function bars(g,hy,col){const bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x1c0e05,depthTest:false,transparent:true,opacity:.92})),fg=new THREE.Sprite(new THREE.SpriteMaterial({color:lin(col).multiplyScalar(.9),depthTest:false,toneMapped:false}));const sd=new THREE.Mesh(CIRC,SHM);sd.rotation.x=-Math.PI/2;sd.scale.set(1.7,1.7,1);sd.position.y=.1;sd.renderOrder=1;g.add(sd);bg.scale.set(4.34,.66,1);bg.position.y=hy;fg.scale.set(4,.36,1);fg.position.set(0,hy,0);bg.renderOrder=8;fg.renderOrder=9;g.add(bg);g.add(fg);return fg;}
function mkEnemy(kind,lvl,x,z,o={}){const T=ET[kind],boss=T.ai==='boss',bi=area==='world'?biome(x,z):(DG?DG.bi:0);
  const g=new THREE.Group(),m=mkModel(kind,o.bi!==undefined?o.bi:bi),sc=(T.sc||1)*(o.elite?1.5:1);m.scale.setScalar(sc);g.add(m);
  const DF=DIFF[S.diff]||DIFF[1],hpm=T.hp*(o.elite?3.2:1)*DF[1],e={kind,T,lvl,x,z,hx:x,hz:z,g,m,sc,boss,elite:!!o.elite,quest:!!o.quest,dun:!!o.dun,spawn:o.spawn||null,
    maxhp:Math.round((34+17*lvl)*hpm),dmg:(7+3.4*lvl)*T.dm*(o.elite?1.25:1)*DF[2],xp:Math.round((10+8*lvl)*(1+lvl/40)*(boss?10:o.elite?3:1)),gold:Math.round((3+2*lvl)*(boss?8:o.elite?3:1)),
    cd:rnd(.5,1.5),wind:0,stun:0,slow:0,aggro:false,t:rnd(0,6),wa:rnd(0,6.28),wt:0,pi:0,sumAt:.66,hit:0,dead:false,tg:null,rt:0};
  e.hp=e.maxhp;const hy=3.9*sc+1;e.fg=bars(g,hy,boss?0xffb03b:0xff5566);
  const l=label((boss||o.elite?T.n+' · ':'')+'Nv '+lvl,lvl>S.lvl+2?'#ff8a8a':o.elite||boss?'#ffd86b':'#ffffff',.8);l.position.y=hy+1.75;g.add(l);
  g.position.set(x,ground(x,z),z);(area==='world'?W:DGp).add(g);ENT.push(e);return e;}
function rmEnemy(e){e.dead=true;e.g.parent&&e.g.parent.remove(e.g);if(e.spawn)e.spawn.ent=null;}
function mkAlly(u,rec,x,z,temp){const U=UNIT[u],g=new THREE.Group(),m=mkUnitModel(u);g.add(m);const L=S.lvl,cc=CLAN[U.clan].c;
  const a={u,U,rec,temp:!!temp,x,z,g,m,sc:1,maxhp:Math.round((60+22*L)*U.hp),dmg:(5+2.2*L)*U.dm,cd:rnd(0,1),rt:0,hcd:3,t:rnd(0,6),tg:null,atk:0,dead:false,moving:false,ally:true};a.hp=a.maxhp;
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.2,1.45,24),new THREE.MeshBasicMaterial({color:lin(cc).multiplyScalar(1.5),transparent:true,opacity:.75,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.16;g.add(ring);
  a.fg=bars(g,4.8,0x6fe07a);g.position.set(x,ground(x,z),z);(area==='world'?W:DGp).add(g);ALLY.push(a);return a;}
function rmAlly(a){a.dead=true;a.g.parent&&a.g.parent.remove(a.g);}
function syncArmy(){ALLY.forEach(a=>rmAlly(a));ALLY=[];S.army.forEach(r=>{if(r.ko)return;const[x,z]=nearWalk(P.x+rnd(-4,4),P.z+3+rnd(0,4));mkAlly(r.u,r,x,z);});}
function burst(x,y,z,c,n=8,k=2.4){const mt=new THREE.MeshBasicMaterial({color:lin(c).multiplyScalar(k),transparent:true,toneMapped:false});for(let i=0;i<n;i++){const m=new THREE.Mesh(GEO.ico,mt.clone());m.position.set(x,y,z);m.scale.setScalar(rnd(.15,.42));scene.add(m);PART.push({m,vx:rnd(-8,8),vy:rnd(4,12),vz:rnd(-8,8),t:0,life:rnd(.4,.8)});}}
function ftext(x,y,z,txt,color,small){txt=''+txt;const d=document.createElement('div'),big=txt[0]==='✸';if(big)txt=txt.slice(1)+'!';d.className='ft';d.textContent=txt;d.style.color=color;d.style.fontSize=small?'1.2em':big?'3em':txt.indexOf('XP')>0?'1.25em':'2.1em';$('fts').appendChild(d);FT.push({d,x,y,z,t:0,jx:rnd(-30,30),big});}
const telMat=(c,o)=>new THREE.MeshBasicMaterial({color:lin(c).multiplyScalar(1.4),transparent:true,opacity:o,depthTest:false,depthWrite:false,toneMapped:false});
const CIRC=new THREE.CircleGeometry(1,40),RING=new THREE.RingGeometry(.93,1,48);
function tele(src,x,z,r,dur,mult,o={}){const g=new THREE.Group(),col=o.friendly?0x7fd0ff:0xff2a1a,a=new THREE.Mesh(CIRC,telMat(col,.3)),b=new THREE.Mesh(RING,telMat(col,.9));
  a.rotation.x=b.rotation.x=-Math.PI/2;b.scale.setScalar(r);a.scale.setScalar(.01);g.add(a);g.add(b);g.position.set(x,ground(x,z)+.25,z);g.renderOrder=2;scene.add(g);if(src)dur*=(DIFF[S.diff]||DIFF[1])[3];TEL.push({src,x,z,r,dur,t:0,dmg:src?src.dmg*mult:0,g,a,leap:o.leap,cb:o.cb});}
function clearTel(){TEL.forEach(t=>scene.remove(t.g));TEL=[];}
function mkPick(x,z,color,onGet){const g=new THREE.Group();const c=new THREE.Mesh(GEO.ico,glow(color,2));c.scale.setScalar(.55);c.position.y=1.4;g.add(c);const h=new THREE.Mesh(GEO.cyl,new THREE.MeshBasicMaterial({color:lin(color).multiplyScalar(1.5),transparent:true,opacity:.22,depthWrite:false,toneMapped:false}));h.scale.set(.5,9,.5);h.position.y=4.5;g.add(h);
  g.position.set(x,ground(x,z),z);(area==='world'?W:DGp).add(g);const p={x,z,g,onGet};PICK.push(p);return p;}
function shot(from,tgt,col,onHit){const m=new THREE.Mesh(GEO.ico,glow(col,3));m.scale.setScalar(.28);scene.add(m);PROJ.push({m,sx:from.x,sy:ground(from.x,from.z)+2.4,sz:from.z,tgt,t:0,onHit});}

/* ───────── COMBAT ───────── */
let shake=0;
function hurtPlayer(d){if(P.inv>0||P.roll>0||P.dead||busy)return;const st=stats(),dm=Math.max(1,Math.round(d*(60/(60+st.def))*rnd(.9,1.1)));S.hp-=dm;P.inv=.5;P.hurtT=.45;ftext(P.x,ground(P.x,P.z)+5,P.z,'-'+dm,'#ff6b6b');sfx(150,.16,'sawtooth',.07,-70);shake=.25;if(typeof starFx==='function'){starFx(P.x,ground(P.x,P.z)+2.4,P.z+.6,4.4,'r');sparks(P.x,ground(P.x,P.z)+2.2,P.z,'#ff6a5a',6,13);}if(S.hp<=0){S.hp=0;die();}}
function hurtAlly(a,d){if(a.dead)return;d=Math.max(1,Math.round(d*.7));a.hp-=d;ftext(a.x,ground(a.x,a.z)+4.5,a.z,'-'+d,'#ffb37a',1);if(a.hp<=0){burst(a.x,ground(a.x,a.z)+1.5,a.z,CLAN[a.U.clan].c,8);rmAlly(a);if(a.rec){a.rec.ko=1;note(a.rec.n+" est hors de combat. Une nuit à l'auberge le remettra sur pattes.");}}}
function hurtEnemy(e,d,crit,col,small){if(e.dead)return;d=Math.max(1,Math.round(d));e.hp-=d;e.hit=.15;hitFlash(e,crit);e.aggro=true;ftext(e.x,ground(e.x,e.z)+3.5*e.sc+1,e.z,(crit?'✸':'')+d,col||(crit?'#ffd24a':'#ffffff'),small);
  if(e.hp<=0){burst(e.x,ground(e.x,e.z)+1.5,e.z,'#ffffff',10,1.6);sfx(120,.2,'sawtooth',.06,-80);S.kills++;addGold(e.gold);ftext(e.x,ground(e.x,e.z)+6,e.z,'+'+e.xp+' XP','#9fe0ff');
    if(e.spawn)e.spawn.dead=time+75;const st=curStep();if(st&&st[0]==='kills'&&st[1]===e.kind){S.q.c=(S.q.c||0)+1;if(S.q.c>=st[2])stepDone();}
    const par=e.g.parent;rmEnemy(e);if(par){par.add(e.g);e.g.children.forEach(c=>{if(c.isSprite||c.material===SHM)c.visible=false;});flashChar(e.m,false);outChar(e.m,false);DYING.push({g:e.g,m:e.m,t:0,sc:e.sc});}gainXP(e.xp);if(e.boss){$('boss').style.display='none';fanfare();shake=.6;}}}
function attack(){if(P.cd>0||P.roll>0||P.dead)return;P.cd=.36;P.atkT=.2;const st=stats();let best=null,bd=8.5;
  for(const e of ENT){const d=Math.hypot(e.x-P.x,e.z-P.z)-e.sc;if(d<bd){bd=d;best=e;}}if(best)P.ang=Math.atan2(best.x-P.x,best.z-P.z);
  sfx(320,.08,'sawtooth',.04,380);let hit=false;const cr=allied('roux')?.24:.12;
  for(const e of ENT.slice()){const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz)-e.sc*.8;if(d>5.6)continue;let da=Math.atan2(dx,dz)-P.ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>1.25&&d>1.5)continue;
    const crit=Math.random()<cr;hurtEnemy(e,st.atk*rnd(.85,1.15)*(crit?1.8:1),crit);burst(e.x,ground(e.x,e.z)+2,e.z,'#fff3c4',3,3);hit=true;if(!e.boss){e.stun=.18;const k=1.2/(Math.hypot(dx,dz)||1),nx=e.x+dx*k,nz=e.z+dz*k;if(walkable(nx,nz)){e.x=nx;e.z=nz;}}}
  if(hit){S.mp=Math.min(100,S.mp+(allied('brumes')?14:11));sfx(220,.06,'square',.05,-60);}}
function roll(){if(P.rollCd>0||P.dead||P.roll>0)return;let[ax,az]=moveInput();if(!ax&&!az){ax=Math.sin(P.ang);az=Math.cos(P.ang);}const l=Math.hypot(ax,az);P.rdx=ax/l;P.rdz=az/l;P.roll=.32;P.rollCd=.75;P.ang=Math.atan2(ax,az);sfx(500,.15,'sine',.04,-300);}
function cast(i){if(P.dead||busy||!S.sp[i])return;const sp=SPELLS[i];const cost=Math.round(sp[2]*(allied('loutres')?.85:1));if(S.mp<cost){toast('Pas assez de magie');sfx(120,.08);return;}S.mp-=cost;const st=stats(),y=ground(P.x,P.z);
  if(i===0){tele(null,P.x,P.z,9.5,.25,0,{friendly:1});burst(P.x,y+1,P.z,'#ff7b2b',26,3.2);sfx(200,.4,'sawtooth',.07,300);for(const e of ENT.slice())if(Math.hypot(e.x-P.x,e.z-P.z)<9.5+e.sc)hurtEnemy(e,st.mag*2.3,false,'#ffb03b');}
  else if(i===1){const h=Math.round(st.hp*.28+st.mag*2);S.hp=Math.min(st.hp,S.hp+h);ftext(P.x,y+5,P.z,'+'+h,'#7dff9a');burst(P.x,y+2,P.z,'#7dff9a',16,2.6);for(const a of ALLY){a.hp=Math.min(a.maxhp,a.hp+a.maxhp*.25);}jingle();}
  else if(i===2){const t=ENT.filter(e=>Math.hypot(e.x-P.x,e.z-P.z)<18).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z)).slice(0,4);sfx(900,.25,'square',.06,-700);
    if(!t.length)burst(P.x,y+3,P.z,'#fff68a',8,3);for(const e of t){bolt(P.x,y+3,P.z,e.x,ground(e.x,e.z)+2,e.z);burst(e.x,ground(e.x,e.z)+3,e.z,'#fff68a',8,3.5);hurtEnemy(e,st.mag*2.7,false,'#fff68a');if(!e.boss)e.stun=.5;}}
  else if(i===3){tele(null,P.x,P.z,11.5,.25,0,{friendly:1});burst(P.x,y+1,P.z,'#9fe0ff',26,2.8);sfx(700,.4,'sine',.07,-400);for(const e of ENT.slice())if(Math.hypot(e.x-P.x,e.z-P.z)<11.5+e.sc){e.slow=4.5;hurtEnemy(e,st.mag*1.9,false,'#9fe0ff');}}
  else if(i===5){let t=null,bd=24;for(const e of ENT){const d=Math.hypot(e.x-P.x,e.z-P.z);if(d<bd){bd=d;t=e;}}const mx=t?t.x:P.x+Math.sin(P.ang)*10,mz=t?t.z:P.z+Math.cos(P.ang)*10;sfx(800,.9,'sawtooth',.05,-700);
    const rock=new THREE.Mesh(GEO.ico,glow('#ff7a1a',4));rock.scale.setScalar(1.6);rock.position.set(mx+14,ground(mx,mz)+42,mz-10);scene.add(rock);PART.push({m:rock,vx:-14/.85,vy:-42/.85,vz:10/.85,t:0,life:.85,nograv:1});
    tele(null,mx,mz,9,.85,0,{friendly:1,cb:()=>{const yy=ground(mx,mz);burst(mx,yy+1,mz,'#ff7a1a',34,4);burst(mx,yy+1,mz,'#ffe08a',14,4);shake=.5;sfx(70,.6,'sawtooth',.1,-30);for(const e of ENT.slice())if(Math.hypot(e.x-mx,e.z-mz)<9+e.sc){hurtEnemy(e,st.mag*4.6,false,'#ff9a3a');if(!e.boss)e.stun=.8;}}});}
  else if(i===6){stormT=7;stormN=0;sfx(60,1.2,'sawtooth',.07,-20);toast('La tempête se lève !');}
  else{warT=10;horn();toast('À la charge !');burst(P.x,y+3,P.z,'#ffd24a',20,3);for(const a of ALLY){a.hp=Math.min(a.maxhp,a.hp+a.maxhp*.2);burst(a.x,ground(a.x,a.z)+3,a.z,'#ffd24a',4,3);}}}
function bolt(x1,y1,z1,x2,y2,z2){const pts=[];for(let i=0;i<=7;i++){const t=i/7,j=i%7?1.3:0;pts.push(new THREE.Vector3(lerp(x1,x2,t)+rnd(-j,j),lerp(y1,y2,t)+rnd(-j,j),lerp(z1,z2,t)+rnd(-j,j)));}
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),14,.14,5),new THREE.MeshBasicMaterial({color:lin(0xfff68a).multiplyScalar(4),transparent:true,toneMapped:false}));scene.add(m);PART.push({m,vx:0,vy:0,vz:0,t:0,life:.22,still:1});}
function die(){P.dead=true;busy=true;sfx(200,.7,'sawtooth',.07,-170);toast('Plume est K.O.…');fadeTo(()=>{if(area!=='world')leaveDungeon(true);for(const id in FORT)resetFort(id);if(RR.spawned)cleanRaid();ENT.slice().forEach(e=>{if(e.quest)rmEnemy(e);});ENT=ENT.filter(e=>!e.dead);QR.spawned=false;QR.mobs=[];clearTel();
  [P.x,P.z]=nearWalk(S.rest[0],S.rest[1]);S.hp=stats().hp;S.mp=100;P.dead=false;busy=false;syncArmy();toast('Tu te réveilles près du dernier lieu de repos.');});}
function stepTo(e,tx,tz,sp,dt,dir=1){const dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz)||1,s=sp*(e.slow>0?.45:1)*dt*dir,nx=e.x+dx/d*s,nz=e.z+dz/d*s;if(walkable(nx,e.z,.8))e.x=nx;if(walkable(e.x,nz,.8))e.z=nz;e.moving=true;}
function pickTarget(e){let b=P.dead?null:P,bd=P.dead?1e9:Math.hypot(P.x-e.x,P.z-e.z)*.8;for(const a of ALLY){const d=Math.hypot(a.x-e.x,a.z-e.z);if(d<bd){bd=d;b=a;}}e.tg=b;}
function ai(e,dt){const T=e.T;e.moving=false;e.t+=dt;if(e.hit>0)e.hit-=dt;if(e.slow>0)e.slow-=dt;
  e.rt-=dt;if(e.rt<=0||!e.tg||e.tg.dead){e.rt=.6;pickTarget(e);}const G=e.tg;if(!G){return;}
  const dx=G.x-e.x,dz=G.z-e.z,d=Math.hypot(dx,dz),dp=Math.hypot(P.x-e.x,P.z-e.z);
  if(e.stun>0){e.stun-=dt;return;}if(e.wind>0){e.wind-=dt;return;}e.cd-=dt*(e.slow>0?.6:1);
  if(!e.aggro){if(d<(e.quest||e.dun?(e.boss?26:22):20)){e.aggro=true;if(T.m==='bd')sfx(62,.7,'sawtooth',.07,-22);}else{e.wt-=dt;if(e.wt<=0){e.wt=rnd(1.5,4);e.wa=rnd(0,6.28);e.wm=Math.random()<.6;}
      if(e.wm&&!e.boss){const nx=e.x+Math.sin(e.wa)*3*dt,nz=e.z+Math.cos(e.wa)*3*dt;if(walkable(nx,nz,.8)&&Math.hypot(nx-e.hx,nz-e.hz)<12){e.x=nx;e.z=nz;e.moving=true;e.g.rotation.y=e.wa;}}return;}}
  if(!e.quest&&!e.dun&&(dp>65||Math.hypot(e.x-e.hx,e.z-e.hz)>75)){e.aggro=false;e.hp=e.maxhp;return;}
  e.g.rotation.y=Math.atan2(dx,dz);const go=(sp,dir)=>stepTo(e,G.x,G.z,sp,dt,dir);
  switch(T.ai){
    case'melee':if(d>3.4+e.sc)go(T.sp);else if(e.cd<=0){tele(e,e.x,e.z,4.4+e.sc,.7,1);e.wind=.75;e.cd=1.7;}break;
    case'leap':if(d>14)go(T.sp);else if(e.cd<=0){tele(e,G.x,G.z,4+e.sc*.5,.85,1,{leap:1});e.wind=.9;e.cd=2.5;}else if(d>6)go(T.sp*.5);break;
    case'ranged':if(d>17)go(T.sp);else if(d<8)go(T.sp*.8,-1);if(d<20&&e.cd<=0){tele(e,G.x,G.z,3.4,.95,1);e.wind=.4;e.cd=2.3;}break;
    case'mage':if(d>15)go(T.sp);else if(d<7)go(T.sp*.8,-1);if(d<19&&e.cd<=0){tele(e,G.x,G.z,6.5,1.3,1.3);e.wind=.8;e.cd=3.3;}break;
    case'boss':{$('boss').style.display='block';$('bname').textContent=T.n+' · Nv '+e.lvl;$('bbar').style.width=clamp(e.hp/e.maxhp*100,0,100)+'%';
      if(d>6+e.sc)go(T.sp*.8);
      if(T.sum&&e.hp<e.maxhp*e.sumAt){e.sumAt-=.33;for(let i=0;i<2;i++){const a=rnd(0,6.28),[sx,sz]=nearWalk(e.x+Math.cos(a)*7,e.z+Math.sin(a)*7);const s=mkEnemy(T.sum,Math.max(1,e.lvl-2),sx,sz,{dun:e.dun,quest:e.quest});s.aggro=true;burst(sx,2,sz,'#c77dff',8);}toast(T.n+' appelle des renforts !');}
      if(e.cd<=0){const pat=T.pat[e.pi++%T.pat.length],enr=e.hp<e.maxhp*.4?.8:1,Q=Math.random()<.7||P.dead?G:P;
        if(pat==='melee'){tele(e,e.x,e.z,8.5,.9*enr,1);e.wind=1*enr;e.cd=2.1*enr;}
        else if(pat==='leap'){tele(e,Q.x,Q.z,6.5,.9*enr,1.15,{leap:1});e.wind=1*enr;e.cd=2.3*enr;}
        else if(pat==='triple'){tele(e,Q.x,Q.z,5,.9,1);for(let i=0;i<2;i++){const a=rnd(0,6.28);tele(e,P.x+Math.cos(a)*8,P.z+Math.sin(a)*8,5,1.2+i*.3,1);}e.wind=.8;e.cd=2.7*enr;}
        else if(pat==='nova'){tele(e,e.x,e.z,13.5,1.5*enr,1.35);e.wind=1.6*enr;e.cd=2.6*enr;}
        else{for(let i=0;i<7;i++)tele(e,P.x+rnd(-13,13),P.z+rnd(-13,13),4.6,1+i*.18,1);e.wind=.6;e.cd=3*enr;}
        sfx(110,.3,'sawtooth',.05,60);}
      break;}}}
function slot(i){const row=Math.floor(i/4)+1,c=i%4,lx=(c-1.5)*3.2,lz=-row*3.6,s=Math.sin(P.ang),co=Math.cos(P.ang);return[P.x+lx*co+lz*s,P.z-lx*s+lz*co];}
function allyAI(a,dt,i){const U=a.U;a.cd-=dt;a.t+=dt;a.moving=false;if(a.atk>0)a.atk-=dt;const dP=Math.hypot(a.x-P.x,a.z-P.z),boost=warT>0?1.6:1;
  a.rt-=dt;if(a.rt<=0||(a.tg&&a.tg.dead)){a.rt=.45;let b=null,bd=26;for(const e of ENT){const d=Math.hypot(e.x-a.x,e.z-a.z);if(d<bd&&(e.aggro||d<13)&&Math.hypot(e.x-P.x,e.z-P.z)<36){bd=d;b=e;}}a.tg=b;}
  if(U.ai==='heal'){a.hcd-=dt;if(a.hcd<=0){let w=null,wr=.8;const st=stats();if(S.hp/st.hp<wr&&dP<26&&!P.dead){w=P;wr=S.hp/st.hp;}for(const o of ALLY){const r=o.hp/o.maxhp;if(r<wr&&Math.hypot(o.x-a.x,o.z-a.z)<26){w=o;wr=r;}}
      if(w){a.hcd=4;const h=Math.round(14+6*S.lvl);shot(a,w,'#7dff9a',()=>{if(w===P){S.hp=Math.min(stats().hp,S.hp+h);}else if(!w.dead)w.hp=Math.min(w.maxhp,w.hp+h);ftext(w.x,ground(w.x,w.z)+5,w.z,'+'+h,'#7dff9a',1);});}else a.hcd=.8;}}
  const e=a.tg;
  if(!e||dP>42){a.tg=dP>42?null:a.tg;const[fx,fz]=slot(i),d=Math.hypot(fx-a.x,fz-a.z);if(dP>60){[a.x,a.z]=nearWalk(fx,fz);}else if(d>1.6){stepTo(a,fx,fz,Math.min(17,4+d*2.2),dt);a.g.rotation.y=Math.atan2(fx-a.x,fz-a.z);}else a.g.rotation.y+=(P.g.rotation.y-a.g.rotation.y)*.1;return;}
  const dx=e.x-a.x,dz=e.z-a.z,d=Math.hypot(dx,dz)-e.sc*.8;a.g.rotation.y=Math.atan2(dx,dz);
  const hit=(m,small)=>{const crit=Math.random()<(a.u==='rodeur'?.3:.08);hurtEnemy(e,a.dmg*m*boost*rnd(.85,1.15)*(crit?1.8:1),crit,'#cfe8ff',1);};
  switch(U.ai){
    case'melee':if(d>2.8)stepTo(a,e.x,e.z,U.sp,dt);else if(a.cd<=0){a.cd=a.u==='rodeur'?.85:1.15;a.atk=.2;hit(1);}break;
    case'ranged':case'heal':if(d>15)stepTo(a,e.x,e.z,U.sp,dt);else if(d<6)stepTo(a,e.x,e.z,U.sp*.7,dt,-1);if(d<18&&a.cd<=0){a.cd=U.ai==='heal'?2.2:1.5;a.atk=.2;shot(a,e,U.ai==='heal'?'#9affc0':'#ffe9a8',()=>{if(!e.dead)hit(1);});}break;
    case'leap':if(d>11)stepTo(a,e.x,e.z,U.sp,dt);else if(a.cd<=0){a.cd=3;a.atk=.3;const k=Math.max(0,(d-1.5))/(Math.hypot(dx,dz)||1),nx=a.x+dx*k,nz=a.z+dz*k;if(walkable(nx,nz,.8)){a.x=nx;a.z=nz;}burst(a.x,ground(a.x,a.z)+.5,a.z,'#cfeaff',8,2.4);
        for(const o of ENT.slice())if(Math.hypot(o.x-a.x,o.z-a.z)<5+o.sc)hurtEnemy(o,a.dmg*1.5*boost,false,'#cfe8ff',1);}else if(d>3.5)stepTo(a,e.x,e.z,U.sp*.6,dt);break;}}

/* ───────── QUÊTES ───────── */
let QR={spawned:false,mobs:[],picks:[],beam:null};
function curQ(){if(!S.q)return null;if(S.q.id==='bounty'){const d=S.q.dyn;return{id:'bounty',dyn:1,n:d.n,g:d.g,lv:d.lv,s:[['kills',d.kind,d.cnt]],e:["Beau travail. Voilà ta prime."]};}return QBY[S.q.id];}
function curStep(){const q=curQ();if(!q)return null;return S.q.step<q.s.length?q.s[S.q.step]:['ret',q.ret||q.g];}
const hiddenNPC=id=>id==='colvert'&&S&&S.fl.colvertGone;
function availQ(npc){if(hiddenNPC(npc))return null;return QL.find(q=>q.g===npc&&!S.qd[q.id]&&(!q.pre||S.qd[q.pre])&&!(S.q&&S.q.id===q.id));}
const npcBy=id=>NPCS.find(n=>n.id===id);
function condOK(k){if(k.startsWith('army'))return S.army.length>=+k.slice(4);if(k.startsWith('ally'))return nAllies()>=+k.slice(4);if(k.startsWith('forts'))return nForts()>=+k.slice(5);if(k.startsWith('unit:'))return S.army.some(a=>a.u===k.slice(5));return owned(k);}
function condProg(k){if(k.startsWith('army'))return' ('+S.army.length+'/'+k.slice(4)+')';if(k.startsWith('ally'))return' ('+nAllies()+'/'+k.slice(4)+')';if(k.startsWith('forts'))return' ('+nForts()+'/'+k.slice(5)+')';return'';}
function qTarget(){const st=curStep();if(!st)return null;if(st[0]==='event'||st[0]==='ask')return null;if(st[0]==='puzzle'){const p=PUZ[st[1]];if(p.dun){const d=DUN[p.dun];return{x:d[1],z:d[2]};}return{x:p.x,z:p.z};}if(st[0]==='talk'||st[0]==='ret'||st[0]==='choice'){const n=npcBy(st[1]);return{x:n.x,z:n.z};}if(st[0]==='dungeon'){const d=DUN[st[1]];return{x:d[1],z:d[2]};}if(st[0]==='cond'){const f=FORT[st[1]];return f?{x:f[1],z:f[2]}:null;}if(st[0]==='kills')return null;return{x:st[1],z:st[2]};}
function stepText(){const st=curStep();if(!st)return'';switch(st[0]){case'spawn':return QR.spawned?'Élimine les ennemis ('+QR.mobs.filter(e=>!e.dead).length+' restants)':'Rejoins la zone marquée et élimine les ennemis';
  case'collect':return'Ramasse : '+st[4]+' ('+(S.q.c||0)+'/'+st[3]+')';case'goto':return'Rends-toi au point marqué';case'talk':return'Parle à '+npcBy(st[1]).name;case'dungeon':return'Nettoie : '+DUN[st[1]][0]+' (Niv. '+DUN[st[1]][3]+')';
  case'cond':return st[2]+condProg(st[1]);case'puzzle':return"Résous l'énigme : "+PUZ[st[1]].n;case'choice':return'Donne ta réponse à '+npcBy(st[1]).name;case'event':case'ask':return'…';case'kills':return'Élimine : '+ET[st[1]].n+' ('+(S.q.c||0)+'/'+st[2]+')';default:return'Retourne voir '+npcBy(st[1]).name;}}
function setupStep(){QR.mobs.forEach(e=>{if(!e.dead)rmEnemy(e);});ENT=ENT.filter(e=>!e.dead);QR.picks.forEach(p=>{p.g.parent&&p.g.parent.remove(p.g);});PICK=PICK.filter(p=>!QR.picks.includes(p));
  QR={spawned:false,mobs:[],picks:[],beam:QR.beam};const st=curStep();
  if(st&&(st[0]==='spawn'||st[0]==='collect'||st[0]==='goto')){const[x,z]=nearWalk(st[1],st[2]);st[1]=x;st[2]=z;}
  if(st&&st[0]==='collect'&&area==='world'){const r=rng(hstr(S.q.id)+S.q.step);for(let i=0;i<st[3];i++){const a=r()*6.28,d=3+r()*13,[x,z]=nearWalk(st[1]+Math.cos(a)*d,st[2]+Math.sin(a)*d);if(i<(S.q.c||0))continue;
    const p=mkPick(x,z,'#ffe45c',()=>{S.q.c=(S.q.c||0)+1;sfx(1100,.08,'triangle',.06);ftext(x,ground(x,z)+3,z,st[4],'#ffe45c');if(S.q.c>=st[3])stepDone();});QR.picks.push(p);}}
  const t=qTarget();if(!QR.beam){const b=new THREE.Group();const c=new THREE.Mesh(GEO.cyl,new THREE.MeshBasicMaterial({color:lin(0xffd24a).multiplyScalar(1.6),transparent:true,opacity:.25,depthWrite:false,toneMapped:false}));c.scale.set(1.2,60,1.2);c.position.y=30;b.add(c);const k=new THREE.Mesh(GEO.cone,glow('#ffd24a',2));k.scale.set(1.2,2.4,1.2);k.rotation.x=Math.PI;k.position.y=9;b.add(k);b.userData.k=k;W.add(b);QR.beam=b;}
  QR.beam.visible=!!t;if(t)QR.beam.position.set(t.x,height(t.x,t.z),t.z);refreshMarks();}
function stepDone(){S.q.step++;S.q.c=0;jingle();setupStep();toast('Objectif accompli !');save();}
function startQuest(q){S.q={id:q.id,step:0,c:0};setupStep();toast('Nouvelle quête : '+q.n);sfx(660,.2,'triangle',.07);save();}
async function finishQuest(q){const dyn=q.dyn;if(!dyn)S.qd[q.id]=1;S.q=null;setupStep();const xp=Math.round(need(dyn?S.lvl:q.lv)*(dyn?.3:q.m?.7:.45)),gold=addGold((15+12*q.lv)*(q.m?2:1)),c=clanOf(q.g);const lines=['Quête terminée : « '+q.n+' »  ·  +'+xp+' XP  ·  +'+gold+' or'];
  if(c){const n=dyn?5:q.m?16:13;addRep(c,n);lines[0]+='  ·  '+CLAN[c].n+' +'+n;}if(q.rep&&repOf(q.rep[0])<q.rep[1]){addRep(q.rep[0],q.rep[1]-repOf(q.rep[0]));}
  if(q.it)lines.push(giveItem(q.it)+'.');if(q.sp!==undefined){S.sp[q.sp]=1;lines.push('Nouveau sort : '+SPELLS[q.sp][1]+' '+SPELLS[q.sp][0]+' (touche '+(q.sp+1)+').');}
  fanfare();gainXP(xp);await say('',lines);refreshMarks();save();if(q.id==='m26')ending();}
function questTick(){const st=curStep();if(!st)return;if(st[0]==='cond'){if(condOK(st[1])&&!busy)stepDone();return;}
  if(st[0]==='puzzle'){if(S.pz[st[1]]&&!busy&&area==='world')stepDone();return;}if(st[0]==='choice')return;
  if(st[0]==='event'){if(!busy&&area==='world'&&!fade){busy=true;EVENTS[st[1]]().then(()=>{busy=false;stepDone();});}return;}
  if(st[0]==='ask'){if(!busy&&area==='world'&&!fade){busy=true;say('',st[1],st[2]).then(c=>{S.fl[st[3]]=c;if(st[3]==='scorie'){if(c===0)note('Scorie forge pour toi : +'+addGold(400)+' or.');else addRep('blaireaux',12);}busy=false;stepDone();});}return;}if(area!=='world'||st[0]==='kills')return;const d=Math.hypot(P.x-st[1],P.z-st[2]);
  if(st[0]==='spawn'){if(!QR.spawned&&d<30){QR.spawned=true;for(const[k,lv,n,el]of st[3])for(let i=0;i<n;i++){const a=rnd(0,6.28),[x,z]=nearWalk(st[1]+Math.cos(a)*rnd(2,8),st[2]+Math.sin(a)*rnd(2,8));const e=mkEnemy(k,lv,x,z,{quest:1,elite:el});burst(x,ground(x,z)+2,z,'#c77dff',6);QR.mobs.push(e);}sfx(140,.4,'sawtooth',.06,80);}
    else if(QR.spawned&&QR.mobs.every(e=>e.dead))stepDone();}
  else if(st[0]==='goto'&&d<5&&!busy){busy=true;say('',st[3]).then(()=>{busy=false;stepDone();});}}

/* ───────── GUERRE : AVANT-POSTES ET RAIDS ───────── */
const FR={};for(const id in FORT)FR[id]={spawned:false,mobs:[],temp:[]};let RR={spawned:false,mobs:[],temp:[]},incT=0;
function setFortLook(id){const v=FORTV[id],f=FORT[id],own=owned(id),m=mat(own?'#3f7fd0':FACTION[f[4]].c);v.flags.forEach(x=>x.material=m);v.g.remove(v.label);v.label=label(f[0]+(own?' · territoire allié':' · Niv. '+f[3]),own?'#9fe0ff':'#ff9c9c',1.2);v.label.position.set(0,15,-4);v.g.add(v.label);}
function reinforce(list){let n=0;for(const c in CLAN)if(allied(c)){const[x,z]=nearWalk(P.x+rnd(-9,9),P.z+rnd(4,11));list.push(mkAlly(CLAN[c].unit,null,x,z,true));burst(x,ground(x,z)+2,z,CLAN[c].c,8);n++;}if(n)note(n+' renfort'+(n>1?'s':'')+' de tes clans alliés se joi'+(n>1?'gnent':'nt')+' à la bataille !');}
function garrison(f,n,lvl,list,elites){const K=FACTION[f[4]].mobs,bi=f[4]==='noires'?7:f[4]==='roux'?6:undefined;for(let i=0;i<n;i++){const a=rnd(0,6.28),[x,z]=nearWalk(f[1]+Math.cos(a)*rnd(3,10),f[2]+2+Math.sin(a)*rnd(3,10));list.push(mkEnemy(K[i%K.length],lvl+(i%4===0?1:0),x,z,{quest:1,bi}));}
  for(let i=0;i<elites;i++){const[x,z]=nearWalk(f[1]+i*4-2,f[2]+4);list.push(mkEnemy(K[K.length-1],lvl+1,x,z,{quest:1,elite:1,bi}));}}
function resetFort(id){const R=FR[id];R.mobs.forEach(e=>{if(!e.dead)rmEnemy(e);});R.temp.forEach(a=>{if(!a.dead)rmAlly(a);});ENT=ENT.filter(e=>!e.dead);ALLY=ALLY.filter(a=>!a.dead);R.spawned=false;R.mobs=[];R.temp=[];}
function cleanRaid(){RR.mobs.forEach(e=>{if(!e.dead)rmEnemy(e);});RR.temp.forEach(a=>{if(!a.dead)rmAlly(a);});ENT=ENT.filter(e=>!e.dead);ALLY=ALLY.filter(a=>!a.dead);RR={spawned:false,mobs:[],temp:[]};}
function capture(id){const f=FORT[id];S.forts[id]=1;FR[id].temp.forEach(a=>{if(!a.dead){burst(a.x,ground(a.x,a.z)+2,a.z,CLAN[a.U.clan].c,6);rmAlly(a);}});ALLY=ALLY.filter(a=>!a.dead);FR[id]={spawned:false,mobs:[],temp:[]};
  const xp=Math.round(need(f[3])*.5),gold=addGold(40+15*f[3]);for(const c in CLAN)if(repOf(c)>=20)addRep(c,4);setFortLook(id);fanfare();horn();burst(f[1],ground(f[1],f[2])+8,f[2],'#7fd0ff',30,3);
  note('Victoire ! '+f[0]+' est à toi. +'+xp+' XP, +'+gold+' or, et un revenu régulier.');gainXP(xp);if(Math.random()<.6)note(loot(Math.min(14,Math.round(f[3]/2.2))));if(S.raidCd>300)S.raidCd=300;save();}
function warTick(dt){if(area!=='world')return;
  for(const id in FORT){if(owned(id))continue;const f=FORT[id],R=FR[id],d=Math.hypot(P.x-f[1],P.z-f[2]);
    if(!R.spawned){if(d<38&&!P.dead&&!busy){R.spawned=true;garrison(f,Math.min(13,7+Math.floor(f[3]/3)),f[3],R.mobs,f[3]>=15?2:1);reinforce(R.temp);horn();note('Bataille : '+f[0]+' ! Élimine toute la garnison.');}}
    else if(R.mobs.every(e=>e.dead))capture(id);else if(d>125)resetFort(id);}
  incT+=dt;if(incT>60){incT=0;let g=0;for(const id in FORT)if(owned(id))g+=4+FORT[id][3];if(g){g=addGold(g);ftext(P.x,ground(P.x,P.z)+7,P.z,'+'+g+' or (territoires)','#ffd86b',1);}}
  if(DLG)return;
  if(!S.raid){if(nForts()){S.raidCd-=dt;if(S.raidCd<=0){const own=Object.keys(FORT).filter(owned),id=own[(Math.random()*own.length)|0];S.raid={id,t:300};horn();note('⚔ Raid ennemi sur '+FORT[id][0]+' ! Défends-le avant la fin du compte à rebours.');}}return;}
  const f=FORT[S.raid.id],d=Math.hypot(P.x-f[1],P.z-f[2]);
  const lose=()=>{cleanRaid();S.forts[S.raid.id]=0;setFortLook(S.raid.id);note(f[0]+" est retombé aux mains de l'ennemi…");sfx(160,.6,'sawtooth',.06,-90);S.raid=null;S.raidCd=420;save();};
  if(!RR.spawned){S.raid.t-=dt;if(d<38&&!P.dead&&!busy){RR.spawned=true;garrison(f,Math.min(14,4+Math.floor(S.lvl/4)),Math.max(f[3],S.lvl-1),RR.mobs,S.lvl>=10?1:0);RR.mobs.forEach(e=>e.aggro=true);reinforce(RR.temp);horn();note('Repousse les assaillants !');}else if(S.raid.t<=0){if(xGarrHold(S.raid.id)){note('La garnison de '+f[0]+' a repoussé le raid sans toi !');S.raid=null;S.raidCd=480;save();}else lose();}}
  else if(RR.mobs.every(e=>e.dead)){RR.temp.forEach(a=>{if(!a.dead)rmAlly(a);});ALLY=ALLY.filter(a=>!a.dead);RR={spawned:false,mobs:[],temp:[]};const xp=Math.round(need(S.lvl)*.2),gold=addGold(30+10*S.lvl);for(const c in CLAN)if(repOf(c)>=20)addRep(c,2);fanfare();note('Raid repoussé ! +'+xp+' XP, +'+gold+' or.');gainXP(xp);S.raid=null;S.raidCd=480+rnd(0,180);save();}
  else if(d>125)lose();}

/* ───────── ÉNIGMES, SECRETS, ÉVÉNEMENTS ───────── */
const PZR={},SECR=[];
function buildPuzzle(id,parent,x,z,y){const p=PUZ[id],g=new THREE.Group();g.position.set(x,y,z);const n=p.runes.length,R=n>4?8.5:7,rt={id,x,z,prog:0,runes:[],g};
  pt(g,'box','#6a6660',1.7,3.4,.8,0,1.7,0,0,0,0,true);pt(g,'box','#57534e',2.4,.5,1.4,0,.25,0);const gl=new THREE.Mesh(GEO.box,glow('#7fd0ff',1.6));gl.scale.set(1.1,.12,.84);gl.position.y=2.6;g.add(gl);
  const l=label(p.n,'#cfe8ff',1);l.position.y=5.6;g.add(l);
  for(let i=0;i<n;i++){const a=i/n*6.283-1.571,rx=Math.cos(a)*R,rz=Math.sin(a)*R,pg=new THREE.Group();pg.position.set(rx,parent===W?height(x+rx,z+rz)-y:0,rz);pt(pg,'cyl','#5f5a55',.75,2.3,.75,0,1.15,0,0,0,0,true);pt(pg,'cyl','#4a4642',1,.3,1,0,.15,0);
    const orb=new THREE.Mesh(GEO.ico,mat('#3a3a44'));orb.scale.setScalar(.55);orb.position.y=3;pg.add(orb);const lb=label(p.runes[i],'#ffffff',.78);lb.position.y=4.4;pg.add(lb);g.add(pg);rt.runes.push({x:x+rx,z:z+rz,orb,lit:0});}
  parent.add(g);PZR[id]=rt;pzLook(id);return rt;}
function pzLook(id){const r=PZR[id];if(!r)return;const ok=S&&S.pz[id];r.prog=0;r.runes.forEach(u=>{u.lit=0;u.orb.material=ok?glow('#7dff9a',3):mat('#3a3a44');});}
async function pzStele(id){const p=PUZ[id];let lines=p.clue;if(p.need&&!S.pz[id]&&!(S.qd[p.need[0]]||(S.q&&S.q.id===p.need[0]&&S.q.step>=p.need[1])))lines=["Six runes éteintes, et une stèle usée : « Trois pierres dans la lande disent l'ordre. Qui touche au hasard nourrit le Chenil. »"];
  busy=true;await say(p.n,S.pz[id]?["Les runes brillent d'une lumière paisible. L'énigme est résolue."]:lines.concat("Touche les "+p.runes.length+" runes dans le bon ordre. À la moindre erreur, tout est à refaire, et les runes se vengent."));busy=false;}
function pzTouch(id,i){const p=PUZ[id],r=PZR[id];if(S.pz[id]){toast('Énigme déjà résolue.');return;}if(r.runes[i].lit){toast('Cette rune brille déjà.');return;}const u=r.runes[i],y=ground(u.x,u.z);
  if(p.order[r.prog]===i){u.lit=1;u.orb.material=glow('#7fd0ff',3);r.prog++;sfx(420+r.prog*95,.2,'triangle',.07);burst(u.x,y+3,u.z,'#7fd0ff',8,3);
    if(r.prog>=p.order.length){S.pz[id]=1;r.runes.forEach(v=>v.orb.material=glow('#7dff9a',3));fanfare();const xp=Math.round(need(S.lvl)*.25),gold=addGold(60+20*S.lvl);note('Énigme résolue : '+p.n+' ! +'+xp+' XP, +'+gold+' or.');gainXP(xp);
      if(p.dun&&DG&&DG.gateM){DGp.remove(DG.gateM);DG.gate=null;DG.gateM=null;burst(0,4,-DG.len*.5,'#7fd0ff',30,3);note('Le verrou cède !');}save();}}
  else{r.runes.forEach(v=>{v.lit=0;v.orb.material=mat('#3a3a44');});r.prog=0;sfx(110,.5,'sawtooth',.08,-60);shake=.45;const st=stats();S.hp=Math.max(1,S.hp-Math.round(st.hp*.18));P.hurtT=.45;burst(u.x,y+3,u.z,'#ff3a1a',16,3);toast('Mauvais ordre ! Les runes se rebellent.');
    const kinds=p.dun?DUN[p.dun][5].map(k=>k[0]):BIO[biome(r.x,r.z)].mobs,lv=p.dun?DUN[p.dun][3]:Math.max(BIO[biome(r.x,r.z)].lv+2,S.lvl-1);for(let k=0;k<(S.lvl>12?3:2);k++){const a=rnd(0,6.28),[x,z]=nearWalk(r.x+Math.cos(a)*5,r.z+Math.sin(a)*5),e=mkEnemy(kinds[(Math.random()*kinds.length)|0],lv,x,z,{quest:1,dun:!!p.dun});e.aggro=true;burst(x,ground(x,z)+2,z,'#ff3a1a',6);}}}
function buildSecretsAndPuzzles(){for(const id in PUZ){const p=PUZ[id];if(p.dun)continue;const[x,z]=nearWalk(p.x,p.z);p.x=x;p.z=z;const r=buildPuzzle(id,W,x,z,height(x,z));COL.push({x,z,r:1.2});r.runes.forEach(u=>COL.push({x:u.x,z:u.z,r:.9}));}
  for(const s of SECRETS){let[id,type,x,z,name,lines,gold]=s;if(type!=='duck')[x,z]=nearWalk(x,z);const g=new THREE.Group(),y=type==='duck'?0:height(x,z);g.position.set(x,y,z);
    if(type==='stele'){pt(g,'box','#7a7670',3,1.4,3,0,.7,0,0,0,0,true);const st=mGoose('#8e8a84',{});st.scale.setScalar(1.7);st.position.y=1.4;st.traverse(o=>{if(o.isMesh)o.material=mat('#8e8a84');});g.add(st);COL.push({x,z,r:2});}
    else if(type==='npc'||type==='riddle'){const m=type==='npc'?mGoose('#e8d9ff',{scarf:'#d97757',hat:1}):mGoose('#8a7458',{crow:1,scarf:'#3a2a1a'});if(type==='riddle'){m.scale.setScalar(1.25);for(const sx of[.3,-.3])pt(m.userData.neck,'sph',glow('#ffd24a',2),.14,.14,.1,sx,1.68,.58);}g.add(m);g.userData.m=m;COL.push({x,z,r:1.2});}
    else if(type==='duck'){pt(g,'sph','#ffd21a',7,5.5,9,0,3.4,0);pt(g,'sph','#ffd21a',3.8,3.8,3.8,0,9.2,4.6);pt(g,'sph','#f58a1a',1.9,.9,2.3,0,8.7,8.6);for(const sx of[1.5,-1.5])pt(g,'sph','#111',.5,.6,.3,sx,10.2,7.7);pt(g,'cone','#ffd21a',2.6,4,2.6,0,6.2,-8,-1.9);}
    else if(type==='chest'){pt(g,'box','#6a4a2a',2.2,1.3,1.5,0,.65,0);pt(g,'box',matMetal('#b89a4a'),2.3,.25,1.6,0,1.1,0);COL.push({x,z,r:1.3});}
    else if(type==='ghost'){const m=mGoose('#ffffff',{});const gm=new THREE.MeshBasicMaterial({color:lin(0x9fe0ff).multiplyScalar(1.8),transparent:true,opacity:.45,toneMapped:false,depthWrite:false});m.traverse(o=>{if(o.isMesh){o.material=gm;o.castShadow=false;}});g.add(m);g.visible=false;}
    else{pt(g,'sph','#e9eef6',6,3.2,6,0,.2,0,0,0,0,true);}
    W.add(g);SECR.push({id,type,x,z,name,lines,gold,g});}}
function foundSecret(id,gold){if(S.sec[id])return;S.sec[id]=1;if(gold)gold=addGold(gold);const n=Object.keys(S.sec).length,T=SECRETS.length+2;jingle();note('✦ Secret découvert ('+n+'/'+T+')'+(gold?' · +'+gold+' or':''));if(n>=T)note(giveItem('plumedor')+' — tous les secrets du royaume !');save();}
async function secretAct(s){busy=true;try{if(s.type==='riddle'){let k=S.fl.rid||0;if(k>=RIDDLES.length){await say(s.name,"« Hou. Tu as répondu à tout. Va, petite oie : tu penses presque comme une chouette. »");return;}
    if(!k)await say(s.name,["« Hou ? Une visiteuse, dans mon coin de forêt. Personne ne me trouve, d'habitude. »","« Six énigmes. Une bonne réponse, une récompense. Une mauvaise… un coup de bec. »"]);
    const R=RIDDLES[k],c=await say(s.name,'« '+R[0]+' »',R[1]);if(c===R[2]){S.fl.rid=k+1;const gold=addGold(80+12*S.lvl),xp=Math.round(need(S.lvl)*.12);jingle();gainXP(xp);await say(s.name,'« Juste. » +'+gold+' or, +'+xp+' XP.'+(k+1>=RIDDLES.length?'':' « Reviens me parler pour la suivante. »'));if(k+1>=RIDDLES.length){foundSecret('chouette',0);note(giveItem('mage'));}save();}
    else{S.hp=Math.max(1,S.hp-Math.round(stats().hp*.12));P.hurtT=.45;sfx(150,.2,'sawtooth',.07,-70);await say(s.name,"« Faux ! » (Coup de bec.) « Réfléchis, et reviens. »");}return;}
  await say(s.type==='npc'?'Claude, oie de passage':s.name,s.lines);foundSecret(s.id,s.gold);}finally{busy=false;}}
function secretTick(){if(area!=='world')return;for(const s of SECR){if(s.type==='ghost')s.g.visible=dayF<.45;else if(s.type==='boss'&&!S.sec.yeti){if(!YETI){if(Math.hypot(s.x-P.x,s.z-P.z)<15&&!P.dead&&!busy){YETI=mkEnemy('b_yeti',Math.max(20,S.lvl+1),s.x,s.z,{quest:1,bi:4});YETI.aggro=true;s.g.visible=false;shake=.6;toast(s.lines[0]);sfx(60,1,'sawtooth',.09,-20);}}
      else if(YETI.dead){if(YETI.hp<=0){foundSecret('yeti',600);note(loot(Math.min(14,Math.round(S.lvl/2.2)+1)));}else s.g.visible=true;YETI=null;}}}}
function honk(){if(honkCd>0||P.dead||busy)return;honkCd=10;sfx(470,.13,'sawtooth',.09,-110);sfx(390,.2,'sawtooth',.09,-140,.12);ftext(P.x,ground(P.x,P.z)+6,P.z,'HONK !','#ffe45c');tele(null,P.x,P.z,9,.2,0,{friendly:1});for(const e of ENT)if(!e.boss&&Math.hypot(e.x-P.x,e.z-P.z)<9){e.stun=1;e.wind=0;}foundSecret('honk',100);}
const EVO=[[1,'Oison','#ffe27a',.78],[8,'Oie aventurière','#ffffff',1],[20,'Grande Oie royale','#ffffff',1.22]],PADV={on:false,x:0,y:0};
function evoStage(){return S.lvl>=EVO[2][0]?3:S.lvl>=EVO[1][0]?2:1;}
function evoRefresh(anim){const st=evoStage(),gold=S.fl&&S.fl.gold,o={scarf:st===3?'#b3262e':'#2d6cdf',sword:1,cape:st===3?'#b3262e':'#2456b8',hero:1,evo:st};if(gold)o.crownG=1;P.evo=st;P.sc=EVO[st-1][3];if(P.m)P.g.remove(P.m);P.m=mGoose(gold?'#ffd24a':EVO[st-1][2],o);P.m.scale.setScalar(P.sc);P.g.add(P.m);const pt0=$('port');if(pt0)pt0.dataset.evo=gold?'g'+st:st;
  if(anim){const y=ground(P.x,P.z);toast('✨ Plume évolue : '+EVO[st-1][1]+' ! ✨');fanfare();burst(P.x,y+2,P.z,'#ffffff',26,3);burst(P.x,y+2,P.z,'#ffd24a',18,2.6);shake=.4;if(typeof starFx==='function'){starFx(P.x,y+2.6,P.z+.6,11,'c');ringFx(P.x,y+.3,P.z,9,0xffd24a);ringFx(P.x,y+.3,P.z,5,0xffffff);}}}
function goldify(){evoRefresh();}
function npcVis(){NPCS.forEach(n=>{n.g.visible=!hiddenNPC(n.id);});}
const EVENTS={
 colvert:async()=>{await say('',["La maison de Maître Colvert est vide. Sur la table, le coffret de la Graine d'Aube est ouvert. Vide, lui aussi.","À la place, un mot : « Pardonne-moi, Plume. La magie que je t'ai apprise n'était pas la mienne. Elle avait un prix, et les Molosses viennent le réclamer. — C. »","Maître Colvert, ton mentor, a trahi le royaume et volé la Graine d'Aube."]);S.fl.colvertGone=1;npcVis();refreshMarks();sfx(160,.8,'sawtooth',.06,-90);},
 roux:async()=>{await say('',["Au plus fort de la mêlée, un hurlement monte derrière toi. Ce n'est pas un cri de guerre.","Vieux Croc, dressé sur la crête : « Les Molosses offrent le Bois Roux, la forêt et le lac. Toi, tu n'offrais que des discours, la volaille ! »","Les Crocs-Roux se retournent contre l'alliance. Tes rôdeurs désertent. Le Clan des Crocs-Roux est désormais HOSTILE."]);
   S.hostile.roux=1;S.rep.roux=0;S.army=S.army.filter(a=>a.u!=='rodeur');for(const a of ALLY.slice())if(a.u==='rodeur'){const x=a.x,z=a.z;rmAlly(a);const e=mkEnemy('renard',Math.max(1,S.lvl-1),x,z,{quest:1,bi:6});e.aggro=true;burst(x,ground(x,z)+2,z,'#d9542b',8);}ALLY=ALLY.filter(a=>!a.dead);horn();sfx(160,.8,'sawtooth',.06,-90);},
 rouxback:async()=>{S.hostile.roux=0;S.rep.roux=Math.max(60,repOf('roux'));await say('',["Vieux Croc roule dans la poussière. Autour de vous, les renards baissent les oreilles… puis la tête.","Les Crocs-Roux reviennent dans l'alliance. Renarde Braise est leur nouvelle cheffe, et tu peux de nouveau recruter leurs rôdeurs."]);horn();}};

/* ───────── DONJONS ───────── */
function enterDungeon(id){const d=DUN[id];fadeTo(()=>{ENT.forEach(e=>{e.g.parent&&e.g.parent.remove(e.g);if(e.spawn)e.spawn.ent=null;e.dead=true;});ENT=[];for(const f in FR)FR[f]={spawned:false,mobs:[],temp:[]};if(RR.spawned)RR={spawned:false,mobs:[],temp:[]};QR.spawned=false;QR.mobs=[];clearTel();W.visible=false;AMBI.visible=false;area=id;
  const len=d[4],col=d[7],r=rng(hstr(id));DG={id,len,col:[],cleared:false,bi:biome(d[1],d[2]),chest:null,opened:false,gate:null};
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(44,len+16,22,Math.round(len/2)),new THREE.MeshStandardMaterial({color:lin(col),roughness:.9,flatShading:true}));const fp=fl.geometry.attributes.position;for(let i=0;i<fp.count;i++)fp.setZ(i,r()*.35);fl.geometry.computeVertexNormals();fl.rotation.x=-Math.PI/2;fl.position.set(0,-.2,-len/2+4);fl.receiveShadow=true;DGp.add(fl);
  const dark='#'+lin(col).multiplyScalar(1).getHexString(),dk=new THREE.Color(col).multiplyScalar(.5).getStyle();
  pt(DGp,'box',dk,3,10,len+16,-21.5,5,-len/2+4,0,0,0,true);pt(DGp,'box',dk,3,10,len+16,21.5,5,-len/2+4,0,0,0,true);pt(DGp,'box',dk,46,10,3,0,5,-len-1.5,0,0,0,true);pt(DGp,'box',dk,46,2.4,3,0,1.2,7.5,0,0,0,true);
  for(let z=4;z>-len;z-=7){for(const s of[-1,1]){pt(DGp,'dod',dk,2+r()*1.6,2.5+r()*3,2+r(),s*(19.6+r()),1.2,z+r()*3,0,r()*3,0,true);}}
  const cg=id==='d6'||id==='d11'||id==='d12'||id==='d15'?'#5ad0ff':id==='d7'||id==='d14'?'#ff5a1a':id==='d10'?'#b06aff':id==='d13'?'#ff2a1a':'#ffb03b';
  for(let z=-12;z>-len+20;z-=11+r()*6){const x=(r()<.5?-1:1)*(5+r()*11);pt(DGp,'dod',dk,2.2,4.8,2.2,x,2.3,z,0,r()*3,0,true);DG.col.push({x,z,r:2});
    for(const s of[-1,1]){pt(DGp,'cyl','#3a2a1a',.15,2.6,.15,s*19.3,3,z);const t=new THREE.Mesh(GEO.cone,glow(cg,3));t.scale.set(.4,.9,.4);t.position.set(s*19.3,4.7,z);DGp.add(t);}
    if(r()<.6){const c=new THREE.Mesh(GEO.cone,glow(cg,2.2));c.scale.set(.5,2.2+r()*2,.5);c.position.set(-x*.9+r()*3,1,z+4);c.rotation.z=r()*.5-.25;DGp.add(c);}}
  const portal=new THREE.Mesh(GEO.cyl,new THREE.MeshBasicMaterial({color:lin(0x7fd0ff).multiplyScalar(2),transparent:true,opacity:.4,toneMapped:false}));portal.scale.set(1.8,7,1.8);portal.position.set(0,3.5,3.5);DGp.add(portal);
  const list=[];for(const[k,n]of d[5])for(let i=0;i<n;i++)list.push(k);list.sort(()=>r()-.5);const zone=len-(d[6]?40:22);
  list.forEach((k,i)=>{const gI=Math.floor(i/3),groups=Math.ceil(list.length/3),z=-16-(gI+.5)*zone/groups+rnd(-3,3),x=rnd(-13,13);const[px,pz]=nearWalk(x,z);mkEnemy(k,d[3]+(r()<.3?1:0),px,pz,{dun:1});});
  if(d[6])mkEnemy(d[6],d[3]+(id==='d8'||id==='d10'?0:1),0,-len+16,{dun:1});
  const pid=DUNP[id];if(pid&&!S.pz[pid]){const gz=-Math.round(len*.5);buildPuzzle(pid,DGp,0,gz+13,0);PZR[pid].runes.forEach(u=>DG.col.push({x:u.x,z:u.z,r:.9}));DG.col.push({x:0,z:gz+13,r:1.2});
    const gm=new THREE.Mesh(GEO.box,new THREE.MeshBasicMaterial({color:lin(cg).multiplyScalar(.9),transparent:true,opacity:.28,depthWrite:false}));gm.scale.set(40,9,.6);gm.position.set(0,4.5,gz);DGp.add(gm);for(let x=-18;x<=18;x+=4)pt(DGp,'cyl','#2a2a30',.3,9,.3,x,4.5,gz);DG.gate=gz;DG.gateM=gm;}
  const ch=new THREE.Group();pt(ch,'box','#8a5a30',2.6,1.6,1.8,0,.8,0);pt(ch,'box',matMetal('#e6c873'),2.7,.3,1.9,0,1.3,0);pt(ch,'box',matMetal('#e6c873'),.4,.6,.2,0,.9,.95);ch.position.set(0,0,-len+5);DGp.add(ch);DG.chest=ch;DG.col.push({x:0,z:-len+5,r:1.6});
  P.x=0;P.z=-2;P.ang=Math.PI;scene.background.set(0x030206);scene.fog.color.set(0x030206);scene.fog.near=52;scene.fog.far=120;hemi.intensity=.5;sun.intensity=.3;sun.color.set(0x8090c0);sun.position.set(20,60,-len/2+30);sun.target.position.set(0,0,-len/2);torch.intensity=1.5;torch.color.copy(lin(cg)).lerp(lin(0xffc27a),.6);
  syncArmy();$('zone').textContent=d[0]+' · Niv. '+d[3];toast(d[0]);});}
function leaveDungeon(silent){ENT.forEach(e=>{e.dead=true;});ENT=[];PICK=PICK.filter(p=>p.g.parent!==DGp);clearTel();ALLY.forEach(a=>rmAlly(a));ALLY=[];while(DGp.children.length)DGp.remove(DGp.children[0]);const d=DUN[area];area='world';DG=null;W.visible=true;AMBI.visible=true;
  [P.x,P.z]=nearWalk(d[1],d[2]+7);torch.intensity=0;scene.fog.near=75;scene.fog.far=190;$('boss').style.display='none';curBio=-1;if(S.q)setupStep();if(!silent){syncArmy();save();}}
function dungeonTick(){if(!DG)return;if(!DG.cleared&&ENT.length===0){DG.cleared=true;fanfare();toast('Donjon nettoyé ! Le coffre est ouvert.');burst(0,2,-DG.len+5,'#ffd86b',20,3);const st=curStep();if(st&&st[0]==='dungeon'&&st[1]===DG.id){S.q.step++;S.q.c=0;save();}}
  if(Math.hypot(P.x,P.z-3.5)<2.2&&!busy){busy=true;fadeTo(()=>{leaveDungeon();busy=false;});}}
async function openChest(){if(DG.opened)return;if(!DG.cleared){toast('Le coffre est scellé tant que des ennemis rôdent.');return;}DG.opened=true;const d=DUN[DG.id],first=!S.ch[DG.id],gold=addGold((20+12*d[3])*(first?1:.4));S.ch[DG.id]=1;jingle();
  DG.chest.children[1].position.y=2.1;await say('',first?['Coffre ouvert ! +'+gold+' or.',loot(Math.min(14,Math.round(d[3]/2.2)))+'.']:['Tu as déjà vidé ce coffre… il reste '+gold+' pièces au fond.']);save();}

/* ───────── DIALOGUES / INTERFACE ───────── */
let DLG=null;
function say(name,lines,choices){return new Promise(res=>{DLG={name,lines:Array.isArray(lines)?lines:[lines],i:0,choices,sel:0,res};renderDlg();});}
function renderDlg(){const d=$('dlg');if(!DLG){d.style.display='none';return;}d.style.display='block';$('dname').textContent=DLG.name||'';$('dname').style.display=DLG.name?'':'none';$('dtext').textContent=DLG.lines[DLG.i];
  const last=DLG.i===DLG.lines.length-1,ch=$('dch');ch.innerHTML='';if(last&&DLG.choices)DLG.choices.forEach((c,i)=>{const b=document.createElement('button');b.textContent=c;if(i===DLG.sel)b.className='sel';b.onclick=ev=>{ev.stopPropagation();if(DLG){DLG.sel=i;advDlg();}};ch.appendChild(b);});
  $('dnext').style.display=(last&&DLG.choices)?'none':'';}
function advDlg(){if(!DLG)return;sfx(660,.04,'square',.03);if(DLG.i<DLG.lines.length-1){DLG.i++;renderDlg();return;}const d=DLG;DLG=null;renderDlg();d.res(d.choices?d.sel:-1);}
$('dlg').onclick=()=>{if(DLG&&!(DLG.choices&&DLG.i===DLG.lines.length-1))advDlg();};
let toastT=null,NOTES=[],noteT=0;function toast(m){const e=$('toast');e.textContent=m;e.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(()=>e.style.opacity=0,2600);}
function note(m){NOTES.push(m);}
let fade=null;function fadeTo(cb){fade={t:0,dir:1,cb};}
async function recruit(n){const c=clanOf(n.id),C=CLAN[c],U=UNIT[C.unit],rep=repOf(c);if(S.hostile[c]){await say(n.name,'Pas un de mes soldats ne marchera avec toi.');return;}
  if(rep<20){await say(n.name,"Le "+C.n+" ne te connaît pas encore assez (réputation "+rep+"/20). Aide ses membres, et je t'ouvrirai mes rangs.");return;}
  for(;;){const cost=Math.round((50+18*S.lvl)*(rep>=80?.5:1)),cap=armyCap(),k=await say(n.name,U.n+" : "+cost+" or. Ta troupe : "+S.army.length+"/"+cap+" soldats. Tu as "+S.gold+" or.",['Recruter : '+U.n+' ('+cost+' or)','Renvoyer un soldat','Au revoir']);
    if(k===0){if(S.army.length>=cap){await say(n.name,"Ta troupe est au complet. Monte en niveau ou scelle des alliances pour commander davantage de soldats.");continue;}if(S.gold<cost){await say(n.name,"Il te manque de l'or. Les avant-postes capturés rapportent un revenu régulier.");continue;}
      S.gold-=cost;const used=S.army.map(a=>a.n),free=NAMES.filter(x=>!used.includes(x)),nm=free[(Math.random()*free.length)|0]||'Recrue';S.army.push({u:C.unit,n:nm,ko:0});syncArmy();jingle();
      if(!S.sp[4]){S.sp[4]=1;await say('',[nm+" rejoint ta troupe ! Tes soldats te suivent, attaquent tes ennemis et montent de niveau avec toi.","Nouveau : 📯 Cri de guerre (touche 5). Tes soldats frappent bien plus fort pendant 10 secondes."]);}else await say('',nm+' ('+U.n+') rejoint ta troupe !');save();}
    else if(k===1){if(!S.army.length){await say(n.name,"Tu n'as personne à renvoyer.");continue;}const j=await say(n.name,'Qui renvoyer ?',S.army.map(a=>a.n+' ('+UNIT[a.u].n+')').concat('Personne'));if(j<S.army.length){S.army.splice(j,1);syncArmy();save();}}
    else break;}}
async function talk(n){if(busy)return;busy=true;try{const st=curStep(),q=curQ();
  if(st&&st[0]==='talk'&&st[1]===n.id){await say(n.name,st[2]);stepDone();return;}
  if(st&&st[0]==='ret'&&st[1]===n.id){await say(n.name,q.e);await finishQuest(q);return;}
  if(st&&st[0]==='choice'&&st[1]===n.id){const c=await say(n.name,st[2],st[3]);if(c===st[4]){stepDone();}else{await say(n.name,st[5]);const cl=clanOf(n.id);S.rep[cl]=Math.max(0,repOf(cl)-8);toast(CLAN[cl].n+' : réputation −8');}return;}
  {const vi=NPCD[n.id][3],cl=vi>=0?VIL[vi].clan:null;if(cl&&S.hostile[cl]){await say(n.name,"Grrr. La meute ne parle plus aux amies de la volaille. File avant que je morde.");return;}}
  const a=availQ(n.id);
  if(a){if(S.q){const c=await say(n.name,"J'ai une tâche pour toi : « "+a.n+" » (niveau conseillé "+a.lv+"). Mais tu as déjà une quête en cours.",['Garder ma quête actuelle','Abandonner « '+curQ().n+' » et accepter']);if(c!==1){if(!n.role)return;}else{const k=await say(n.name,a.i,['Accepter (niveau conseillé '+a.lv+')','Plus tard']);if(k===0)startQuest(a);return;}}
    else{const c=await say(n.name,a.i,['Accepter (niveau conseillé '+a.lv+')','Plus tard']);if(c===0){startQuest(a);return;}if(!n.role)return;}}
  if(n.role==='inn'){S.inns[n.id]=1;const c=await say(n.name,"Bienvenue, voyageuse ! Un lit, un bol de soupe ?",['Se reposer (soins, soldats blessés, sauvegarde)','Tableau des primes','Voyager','Au revoir']);
    if(c===0){S.hp=stats().hp;S.mp=100;S.rest=[P.x,P.z];S.army.forEach(a=>a.ko=0);syncArmy();jingle();toast('Reposée ! Partie sauvegardée.');save();}
    else if(c===1){if(S.q){await say(n.name,"Termine d'abord ta quête en cours, les primes attendront.");return;}const vi=NPCD[n.id][3],bi=biome(VIL[vi].x,VIL[vi].z),kinds=BIO[bi].mobs,kind=kinds[(Math.random()*kinds.length)|0],cnt=5+((Math.random()*4)|0);
      const k=await say(n.name,"Prime du jour : "+cnt+" × "+ET[kind].n+", dans la région ("+BIO[bi].n+"). Récompense selon ton niveau, et l'estime du "+CLAN[VIL[vi].clan].n+".",['Accepter la prime','Non merci']);
      if(k===0){S.q={id:'bounty',step:0,c:0,dyn:{n:'Prime : '+cnt+' × '+ET[kind].n,g:n.id,lv:BIO[bi].lv,kind,cnt}};setupStep();toast('Prime acceptée');save();}}
    else if(c===2){const dest=NPCS.filter(o=>o.role==='inn'&&S.inns[o.id]&&o!==n).map(o=>({n:'🏠 '+(VIL[NPCD[o.id][3]]?VIL[NPCD[o.id][3]].n:o.name),x:o.x+2,z:o.z+3})).concat(Object.keys(FORT).filter(owned).map(id=>({n:'⚑ '+FORT[id][0],x:FORT[id][1],z:FORT[id][2]+9})));
      if(!dest.length){await say(n.name,"Tu ne connais encore aucune autre auberge, et tu ne tiens aucun avant-poste.");return;}
      const k=await say(n.name,"Où veux-tu aller ?",dest.map(o=>o.n).concat('Nulle part'));if(k<dest.length){const o=dest[k];fadeTo(()=>{[P.x,P.z]=nearWalk(o.x,o.z);syncArmy();save();});}}
    return;}
  if(n.role==='smith'){const cost=40+25*S.lvl,c=await say(n.name,"Un coffre du forgeron ? Dedans, une pièce d'équipement au hasard. "+cost+" pièces d'or. Tu en as "+S.gold+".",['Acheter un coffre ('+cost+' or)','Non merci']);
    if(c===0){if(S.gold<cost){await say(n.name,"Reviens quand ta bourse sera plus lourde.");return;}S.gold-=cost;jingle();await say('',loot(Math.max(0,Math.min(14,Math.round(S.lvl/2.2)-1)))+'.');save();}return;}
  if(n.role==='recruit'){await recruit(n);return;}
  await say(n.name,n.idle||'Bon vent, Plume !');}finally{busy=false;}}
function pzNear(){for(const id in PZR){const r=PZR[id],p=PUZ[id];if((p.dun||'world')!==area)continue;if(Math.hypot(r.x-P.x,r.z-P.z)>15)continue;if(Math.hypot(r.x-P.x,r.z-P.z)<4.2)return{t:'pzs',id,txt:'Lire la stèle : '+p.n};
    for(let i=0;i<r.runes.length;i++)if(Math.hypot(r.runes[i].x-P.x,r.runes[i].z-P.z)<3.3)return{t:'pzr',id,i,txt:'Toucher la rune « '+p.runes[i]+' »'};}return null;}
function nearInteract(){if(area==='world'){let b=null,bd=5.5;for(const n of NPCS){if(hiddenNPC(n.id))continue;const d=Math.hypot(n.x-P.x,n.z-P.z);if(d<bd){bd=d;b={t:'npc',n,txt:'Parler à '+n.name};}}if(b)return b;
    const pz=pzNear();if(pz)return pz;for(const s of SECR){if(s.type==='boss'||(s.type==='ghost'&&dayF>.45))continue;if(Math.hypot(s.x-P.x,s.z-P.z)<(s.type==='duck'?13:5.5))return{t:'sec',s,txt:(S.sec[s.id]?'Revoir : ':'Examiner : ')+s.name};}
    for(const id in DUN){const d=DUN[id];if(Math.hypot(d[1]-P.x,d[2]-P.z)<7)return{t:'dun',id,txt:'Entrer : '+d[0]};}return null;}
  if(DG&&!DG.opened&&Math.hypot(P.x,P.z+DG.len-5)<4.5)return{t:'chest',txt:'Ouvrir le coffre'};return pzNear();}
const LOCK={d7:"Une porte de glace noire scelle la forge. Il faut la clé de givre.",d8:"La garde du Baron tient la porte. Seule, tu n'entreras pas.",d9:"Des racines épaisses barrent l'entrée. Les Crocs-Roux ne laissent passer personne.",d10:"La garde de Nid-Noir est intacte. Il faut d'abord la briser avec les clans."};
async function interact(){const it=nearInteract();if(!it||busy||DLG)return false;
  if(it.t==='npc')talk(it.n);else if(it.t==='chest'){busy=true;await openChest();busy=false;}
  else if(it.t==='pzs')await pzStele(it.id);else if(it.t==='pzr')pzTouch(it.id,it.i);else if(it.t==='sec')await secretAct(it.s);
  else{const d=DUN[it.id];busy=true;if(d[8]&&!S.qd[d[8]]){await say('',LOCK[it.id]||"L'entrée est scellée.");busy=false;return true;}
    const c=await say('',d[0]+' — niveau conseillé '+d[3]+' (tu es niveau '+S.lvl+').',['Entrer','Rester dehors']);busy=false;if(c===0)enterDungeon(it.id);}
  return true;}
function ending(){S.won=1;save();state='end';const m=Math.floor(S.time/60),qd=QL.filter(q=>!q.m&&S.qd[q.id]).length;$('endstats').innerHTML="Le Roi Mâchefer est tombé et la brume s'est levée. La Graine d'Aube a retrouvé le cœur du Gland d'Or.<br>"+(S.fl.colvert===0?"Maître Colvert, épargné, enseigne de nouveau à Cancan-les-Bains, sous l'œil de la Doyenne. ":"Maître Colvert a été jugé par les clans. ")+(S.fl.scorie===0?"Scorie forge désormais pour l'alliance.":"Scorie a pris la route de l'exil.")+"<br>Secrets : <b>"+Object.keys(S.sec).length+"/"+(SECRETS.length+2)+"</b> · Énigmes : <b>"+Object.keys(S.pz).length+"/"+Object.keys(PUZ).length+"</b><br>Temps de jeu : <b>"+Math.floor(m/60)+" h "+(m%60)+" min</b> · Niveau <b>"+S.lvl+"</b> · Ennemis vaincus : <b>"+S.kills+"</b><br>Quêtes annexes : <b>"+qd+"/"+QL.filter(q=>!q.m).length+"</b> · Territoires : <b>"+nForts()+"/"+Object.keys(FORT).length+"</b> · Clans alliés : <b>"+nAllies()+"/"+Object.keys(CLAN).length+"</b><br>Merci d'avoir joué !";$('end').style.display='flex';fanfare();}
let tab='q',mapBase=null;
function toggleMenu(){if(state!=='play'||DLG||fade)return;menuOpen=!menuOpen;$('menu').style.display=menuOpen?'flex':'none';if(menuOpen)renderMenu();}
function renderMenu(){document.querySelectorAll('#tabs .btn[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));const B=$('mbody');
  if(tab==='q'){const q=curQ();let h='<div style="flex:1"><h3>Quête en cours</h3>';h+=q?'<div class="q"><b>'+q.n+(q.m?' (principale)':'')+'</b><small>'+stepText()+' — niveau conseillé '+q.lv+'</small></div>':'<div class="q"><small>Aucune. Cherche les villageois avec une étoile dorée au-dessus de la tête, ou demande une prime à l\'auberge.</small></div>';
    h+='<h3>Disponibles</h3>';const av=QL.filter(x=>!S.qd[x.id]&&(!x.pre||S.qd[x.pre])&&!(S.q&&S.q.id===x.id));h+=av.map(x=>'<div class="q"><b>'+x.n+(x.m?' (principale)':'')+'</b><small>Auprès de '+NPCD[x.g][0]+(NPCD[x.g][3]>=0?' — '+VIL[NPCD[x.g][3]].n:'')+' · niveau conseillé '+x.lv+'</small></div>').join('')||'<div class="q"><small>Rien pour le moment.</small></div>';
    h+='</div><div style="flex:1"><h3>Découvertes</h3><div class="q"><small>✦ Secrets : '+Object.keys(S.sec).length+'/'+(SECRETS.length+2)+' · Énigmes résolues : '+Object.keys(S.pz).length+'/'+Object.keys(PUZ).length+'<br>Le royaume cache des choses que personne ne t\'indiquera. Fouille les recoins, essaie des touches, sors la nuit.</small></div><h3>Terminées ('+Object.keys(S.qd).length+'/'+QL.length+')</h3>'+QL.filter(x=>S.qd[x.id]).map(x=>'<div class="q done"><b>'+x.n+'</b></div>').join('')+'</div>';B.innerHTML=h;}
  else if(tab==='e'){const st=stats();let h='<div style="flex:1"><h3>Plume — niveau '+S.lvl+'</h3><div class="q"><small>Vie '+Math.round(S.hp)+' / '+st.hp+'<br>Attaque '+Math.round(st.atk)+' · Défense '+Math.round(st.def)+' · Magie '+Math.round(st.mag)+'<br>XP '+S.xp+' / '+need(S.lvl)+' · Or '+S.gold+'</small></div><h3>Sorts</h3>'+SPELLS.map((s,i)=>'<div class="q'+(S.sp[i]?'':' done')+'"><b>'+s[1]+' '+s[0]+'</b><small>'+(S.sp[i]?'Touche '+(i+1)+' · coût '+s[2]+' magie':'Pas encore appris')+'</small></div>').join('')+'</div><div style="flex:1.3">';
    for(const s in SLOT){h+='<h3>'+SLOT[s]+'</h3>';const ids=Object.keys(S.inv).filter(k=>IT[k]&&IT[k][1]===s).sort((a,b)=>score(b)-score(a));h+=ids.map(k=>{const I=IT[k],p=[];if(I[3])p.push('Att +'+Math.round(itemStat(k,3)));if(I[4])p.push('Déf +'+Math.round(itemStat(k,4)));if(I[5])p.push('Vie +'+Math.round(itemStat(k,5)));if(I[6])p.push('Mag +'+Math.round(itemStat(k,6)));
      return'<div class="it'+(S.eq[s]===k?' eq':'')+'" data-i="'+k+'"><span>'+I[0]+' <small>niv. '+S.inv[k]+'</small></span><small>'+p.join(' · ')+'</small></div>';}).join('')||'<div class="q"><small>Rien.</small></div>';}
    B.innerHTML=h+'</div>';B.querySelectorAll('.it').forEach(el=>el.onclick=()=>{const k=el.dataset.i;S.eq[IT[k][1]]=k;S.hp=Math.min(S.hp,stats().hp);sfx(700,.06,'triangle',.05);renderMenu();});}
  else if(tab==='a'){let h='<div style="flex:1"><h3>Ta troupe ('+S.army.length+'/'+armyCap()+')</h3>'+(S.army.map((a,i)=>'<div class="it" data-d="'+i+'"><span><b style="color:'+CLAN[UNIT[a.u].clan].c+'">■</b> '+a.n+' <small>'+UNIT[a.u].n+(a.ko?' — blessé(e), repos à l\'auberge':'')+'</small></span><small>renvoyer ✕</small></div>').join('')||'<div class="q"><small>Personne. Deviens Amie d\'un clan (réputation 20), puis parle à son sergent recruteur. Les soldats tombés au combat se remettent à l\'auberge.</small></div>');
    h+='<h3>Guerre — territoires '+nForts()+'/'+Object.keys(FORT).length+'</h3>'+Object.keys(FORT).map(id=>{const f=FORT[id],o=owned(id);return'<div class="q'+(o?' done':'')+'"><b>'+(o?'⚑ ':'')+f[0]+'</b><small>'+(o?'Territoire allié · revenu '+(4+f[3])+' or/min':FACTION[f[4]].n+' · niveau '+f[3])+(S.raid&&S.raid.id===id?' · ⚔ RAID EN COURS':'')+'</small></div>';}).join('')+'</div><div style="flex:1"><h3>Clans</h3>';
    for(const c in CLAN){const C=CLAN[c],r=repOf(c);h+='<div class="q" style="border-color:'+C.c+'"><b>'+C.n+'</b> — '+RANKS[rank(c)]+'<div class="bar" style="height:.6em;margin:.3em 0"><i style="width:'+r+'%;background:'+C.c+'"></i></div><small>Réputation '+r+'/100 · '+C.home+'<br>Soldat : '+UNIT[C.unit].n+(r>=20?'':' (à 20)')+' · Alliance (à 50) : '+C.bonus+', renforts en bataille</small></div>';}
    B.innerHTML=h+'</div>';B.querySelectorAll('.it[data-d]').forEach(el=>el.onclick=()=>{S.army.splice(+el.dataset.d,1);syncArmy();renderMenu();save();});}
  else if(tab==='m'){B.innerHTML='<canvas id="mapc" width="520" height="520"></canvas><div style="flex:1;line-height:1.7"><h3>Carte du royaume</h3><span style="color:#ff4757">●</span> Plume · <span style="color:#ffd24a">●</span> objectif · <span style="color:#fff">■</span> village · <span style="color:#c77dff">▲</span> donjon · ⚑ avant-poste<br><br>'+BIO.map(b=>b.n+' — niveaux '+b.lv+' à '+(b.lv+3)).join('<br>')+'</div>';
    const c=$('mapc').getContext('2d'),N=150,SP=1240,K=520;if(!mapBase){mapBase=document.createElement('canvas');mapBase.width=mapBase.height=N;const x=mapBase.getContext('2d');for(let j=0;j<N;j++)for(let i=0;i<N;i++){const wx=(i/N-.5)*SP,wz=(j/N-.5)*SP,h=height(wx,wz),b=BIO[biome(wx,wz)].c;x.fillStyle=h<.3?'#2f7fc0':h<.9?'#e6d69e':'rgb('+(b[0]*255|0)+','+(b[1]*255|0)+','+(b[2]*255|0)+')';x.fillRect(i,j,1,1);}}
    c.imageSmoothingEnabled=false;c.drawImage(mapBase,0,0,K,K);const mp=(x,z)=>[(x/SP+.5)*K,(z/SP+.5)*K];c.font='bold 12px sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#000';
    for(const id in FORT){const f=FORT[id],[x,y]=mp(f[1],f[2]),o=owned(id);c.fillStyle='#000';c.fillRect(x-1,y-9,2,14);c.fillStyle=o?'#4f9fff':FACTION[f[4]].c;c.strokeRect(x,y-9,9,7);c.fillRect(x,y-9,9,7);if(S.raid&&S.raid.id===id){c.strokeStyle='#ff4757';c.beginPath();c.arc(x,y-3,11,0,7);c.stroke();c.strokeStyle='#000';}}
    for(const id in DUN){const d=DUN[id],[x,y]=mp(d[1],d[2]);c.fillStyle='#c77dff';c.beginPath();c.moveTo(x,y-7);c.lineTo(x+6,y+5);c.lineTo(x-6,y+5);c.fill();c.fillStyle='#fff';c.strokeText(d[3],x,y+17);c.fillText(d[3],x,y+17);}
    VIL.forEach(v=>{const[x,y]=mp(v.x,v.z);c.fillStyle='#000';c.fillRect(x-5,y-5,10,10);c.fillStyle=CLAN[v.clan].c;c.fillRect(x-4,y-4,8,8);c.fillStyle='#fff';c.strokeText(v.n,x,y-9);c.fillText(v.n,x,y-9);});
    const t=qTarget();if(t){const[x,y]=mp(t.x,t.z);c.fillStyle='#ffd24a';c.beginPath();c.arc(x,y,7,0,7);c.fill();c.stroke();}
    const pp=area==='world'?[P.x,P.z]:[DUN[area][1],DUN[area][2]],[x,y]=mp(pp[0],pp[1]);c.fillStyle='#ff4757';c.beginPath();c.arc(x,y,6,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();}
  else{B.innerHTML='<div style="flex:1"><h3>Graphismes</h3>'+['Légère (pas d\'effets, herbe clairsemée)','Équilibrée','Maximale (herbe dense, haute résolution)'].map((n,i)=>'<div class="it'+(quality===i?' eq':'')+'" data-q="'+i+'"><span>'+n+'</span></div>').join('')+'<div class="q"><small>Si le jeu saccade, choisis « Légère ». La qualité baisse toute seule si ta machine peine.</small></div><h3>Difficulté</h3>'+DIFF.map((d,i)=>'<div class="it'+(S.diff===i?' eq':'')+'" data-df="'+i+'"><span>'+d[0]+'</span><small>'+['ennemis plus fragiles, attaques plus lentes','le jeu tel qu\'il est pensé','ennemis redoutables, peu de temps pour esquiver'][i]+'</small></div>').join('')+'<h3>Son</h3><div class="it" id="oSnd"><span>Son : '+(muted?'coupé':'activé')+'</span></div></div><div style="flex:1"><h3>Commandes</h3><div class="q"><small style="line-height:1.8">ZQSD / WASD / flèches : se déplacer<br>Espace ou clic : attaquer, parler<br>Maj : roulade (esquive les cercles rouges)<br>1 à 4, 6, 7 : sorts · 5 : cri de guerre · H : cacarder<br>E : interagir · M : menu · molette : zoom</small></div></div>';
    B.querySelectorAll('.it[data-q]').forEach(el=>el.onclick=()=>{quality=+el.dataset.q;autoQ=false;try{localStorage.setItem(QKEY,quality);}catch(e){}applyQuality();renderMenu();});$('oSnd').onclick=()=>{muted=!muted;renderMenu();};B.querySelectorAll('.it[data-df]').forEach(el=>el.onclick=()=>{S.diff=+el.dataset.df;renderMenu();save();});}}
document.querySelectorAll('#tabs .btn[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;renderMenu();});
$('bResume').onclick=toggleMenu;$('bSave').onclick=()=>{save();$('bSave').textContent='Sauvegardé ✔';setTimeout(()=>$('bSave').textContent='Sauvegarder',1500);};
function buildSpellBar(){$('spells').innerHTML=SPELLS.map((s,i)=>'<div class="sp" data-i="'+i+'"><kbd>'+(i+1)+'</kbd><span>'+s[1]+'</span><small>'+s[2]+'</small></div>').join('');document.querySelectorAll('.sp').forEach(el=>el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(state==='play'&&!DLG&&!menuOpen)cast(+el.dataset.i);}));}
let hudK='',tod=.32;
function hud(){const st=stats();if(S.hp>st.hp)S.hp=st.hp;const k=[S.lvl,Math.round(S.hp),st.hp,Math.round(S.mp),S.xp,S.gold,S.sp.join(''),S.army.length,ALLY.length,nForts(),dayF>.5].join('|');if(k!==hudK){hudK=k;$('lvl').textContent='Nv '+S.lvl;$('hpb').firstChild.style.width=S.hp/st.hp*100+'%';$('hpb').lastChild.textContent=Math.round(S.hp)+' / '+st.hp;$('mpb').firstChild.style.width=S.mp+'%';$('mpb').lastChild.textContent=Math.round(S.mp);$('xpb').firstChild.style.width=S.xp/need(S.lvl)*100+'%';
    $('gold').innerHTML='<span class="chip">🪙 '+S.gold+'</span><span class="chip">🛡 '+ALLY.filter(a=>!a.temp).length+'/'+armyCap()+'</span><span class="chip">⚑ '+nForts()+'/'+Object.keys(FORT).length+'</span><span class="chip">'+(dayF>.5?'☀':'🌙')+'</span>';
    document.querySelectorAll('.sp').forEach((el,i)=>{el.classList.toggle('off',!S.sp[i]);el.classList.toggle('low',!!S.sp[i]&&S.mp<SPELLS[i][2]);});}
  const q=curQ(),t=qTarget();let h='';const arrow=(x,z)=>{const dx=x-P.x,dz=z-P.z;return Math.round(Math.hypot(dx,dz))+' m <span class="qarrow" style="transform:rotate('+Math.atan2(dz,dx).toFixed(2)+'rad)">➤</span>';};
  if(q){h='<b>'+q.n+'</b><br>'+stepText();if(t&&area==='world')h+='<br>'+arrow(t.x,t.z);}else h=S.intro?'<b>Aucune quête en cours</b><br>Parle aux villageois marqués d\'une étoile':'';
  if(S.raid){const f=FORT[S.raid.id],s=Math.max(0,Math.ceil(S.raid.t));h+='<br><b style="color:#ff8a8a">⚔ Raid : '+f[0]+'</b><br>'+(RR.spawned?'Repousse les assaillants !':Math.floor(s/60)+':'+('0'+s%60).slice(-2)+' · '+(area==='world'?arrow(f[1],f[2]):''));}
  if($('qt').innerHTML!==h)$('qt').innerHTML=h;
  const it=!DLG&&!busy&&!menuOpen?nearInteract():null,hi=$('hint');if(it&&!threat()){hi.style.display='block';hi.firstChild.textContent=(isTouch?'⚔ : ':'E / Espace : ')+it.txt;}else hi.style.display='none';
  if(NOTES.length&&time>noteT&&!DLG){toast(NOTES.shift());noteT=time+2.4;}}
const threat=()=>ENT.some(e=>e.aggro&&Math.hypot(e.x-P.x,e.z-P.z)<16);

/* ───────── COMMANDES ───────── */
const keys={},joy={on:false,id:null,x:0,y:0},KSEQ=[],KONAMI='ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA';let zoom=1;
function moveInput(){let ax=0,az=0;if(keys.ArrowLeft||keys.KeyA)ax--;if(keys.ArrowRight||keys.KeyD)ax++;if(keys.ArrowUp||keys.KeyW)az--;if(keys.ArrowDown||keys.KeyS)az++;if(joy.on){ax=joy.x;az=joy.y;}if(PADV.on){ax=PADV.x;az=PADV.y;}return[ax,az];}
function actionKey(){if(busy||P.dead)return;if(nearInteract()&&!threat()){interact();return;}attack();}
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].includes(e.key))e.preventDefault();if(state!=='play')return;keys[e.code]=true;if(e.repeat)return;
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(DLG){if(DLG.choices&&DLG.i===DLG.lines.length-1){const n=DLG.choices.length;if(e.code==='ArrowUp'||e.code==='KeyW'){DLG.sel=(DLG.sel+n-1)%n;renderDlg();return;}if(e.code==='ArrowDown'||e.code==='KeyS'){DLG.sel=(DLG.sel+1)%n;renderDlg();return;}}
    if(k===' '||k==='Enter'||k==='e'||k==='j')advDlg();return;}
  KSEQ.push(e.code==='KeyQ'&&k==='a'?'KeyA':e.code);if(KSEQ.length>10)KSEQ.shift();if(KSEQ.join()===KONAMI&&!S.fl.gold){S.fl.gold=1;goldify();addGold(500);fanfare();foundSecret('konami',0);toast('✦ Oie dorée ! ✦');}
  if(k==='m'||k==='Tab'||k==='Escape'){toggleMenu();return;}if(menuOpen||fade)return;if(k==='h'){honk();return;}
  if(k===' '||k==='j')actionKey();else if(k==='e'||k==='Enter')interact();else if(k==='Shift'||k==='k')roll();else if(/^Digit[1-7]$/.test(e.code))cast(+e.code[5]-1);});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
addEventListener('wheel',e=>{if(state==='play'&&!menuOpen)zoom=clamp(zoom+Math.sign(e.deltaY)*.08,.6,1.5);},{passive:true});
const isTouch=('ontouchstart'in window)||navigator.maxTouchPoints>0;
$('cv').addEventListener('pointerdown',e=>{if(state==='play'&&!isTouch&&!DLG&&!menuOpen&&!fade)actionKey();});
(function(){const j=$('tjoy'),kn=$('tknob'),dot=kn.firstElementChild;let ox=0,oy=0,rad=1;const setK=()=>{dot.style.transform='translate('+joy.x*3+'em,'+joy.y*3+'em)';};
  const mv=e=>{if(!joy.on||e.pointerId!==joy.id)return;let dx=(e.clientX-ox)/rad,dy=(e.clientY-oy)/rad;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}if(l<.2){dx=0;dy=0;}joy.x=dx;joy.y=dy;setK();};
  j.addEventListener('pointerdown',e=>{joy.on=true;joy.id=e.pointerId;const r=kn.getBoundingClientRect();ox=r.left+r.width/2;oy=r.top+r.height/2;rad=r.width/2;mv(e);try{j.setPointerCapture(e.pointerId);}catch(_){}});
  j.addEventListener('pointermove',mv);const up=e=>{if(e.pointerId!==joy.id)return;joy.on=false;joy.x=joy.y=0;setK();};j.addEventListener('pointerup',up);j.addEventListener('pointercancel',up);
  const b=(id,fn)=>$(id).addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='play')return;if(DLG){advDlg();return;}if(menuOpen&&id!=='tM')return;fn();});b('tA',actionKey);b('tR',roll);b('tM',toggleMenu);})();

/* ───────── BOUCLE PRINCIPALE ───────── */
let curBio=-1,spT=0,saveT=0,camX=0,camZ=0,camY=0,autoQ=true,fpsN=0,fpsT=0;const V3=new THREE.Vector3();
function buildSpawns(){const r=rng(4242);let tries=0;while(SPAWNS.length<330&&tries++<20000){const x=(r()-.5)*1150,z=(r()-.5)*1150;if(height(x,z)<1.2)continue;if(VIL.some(v=>Math.hypot(x-v.x,z-v.z)<42))continue;if(Object.keys(FORT).some(id=>Math.hypot(x-FORT[id][1],z-FORT[id][2])<48))continue;if(SPAWNS.some(s=>Math.hypot(x-s.x,z-s.z)<24))continue;
  const b=biome(x,z),B=BIO[b];SPAWNS.push({x,z,kind:B.mobs[(r()*B.mobs.length)|0],lvl:B.lv+((r()*4)|0),n:1+((r()*2.4)|0),ent:null,ents:[],dead:0});}}
function spawnTick(){if(area!=='world')return;for(const s of SPAWNS){const d=Math.hypot(s.x-P.x,s.z-P.z);if(d<85&&d>38&&!s.ent&&time>s.dead&&!s.ents.some(e=>!e.dead)){s.ents=[];for(let i=0;i<s.n;i++){const[x,z]=nearWalk(s.x+rnd(-5,5),s.z+rnd(-5,5));s.ents.push(mkEnemy(s.kind,s.lvl,x,z,{spawn:s}));}s.ent=s.ents[0];}}
  for(const e of ENT.slice())if(!e.quest&&!e.aggro&&Math.hypot(e.x-P.x,e.z-P.z)>125){const s=e.spawn;rmEnemy(e);if(s)s.dead=0;}ENT=ENT.filter(e=>!e.dead);}
function animChar(o,dt,atk){const m=o.m,w=o.moving?Math.sin(o.t*11):0;m.position.y=o.moving?Math.abs(w)*.3:0;m.rotation.z=w*.1;const u=m.userData;if(u.tail)u.tail.rotation.x=Math.sin(o.t*3)*.15+(o.moving?.2:0);if(u.neck)u.neck.rotation.x=atk?.6:Math.sin(o.t*2)*.05;if(u.legs)for(let i=0;i<4;i++)u.legs[i].rotation.x=o.moving?Math.sin(o.t*11+(i%3?0:3.14))*.6:0;if(u.legL){u.legL.rotation.x=w*.75;u.legR.rotation.x=-w*.75;}if(u.wl){const f=atk?.55:o.moving?.1+Math.abs(w)*.12:.03+Math.sin(o.t*2.2)*.03;u.wl.rotation.z=-f;u.wr.rotation.z=f;}}
function update(dt){time+=dt;
  if(fade){fade.t+=dt*2.6*fade.dir;if(fade.dir>0&&fade.t>=1){fade.t=1;fade.dir=-1;fade.cb();camX=P.x;camZ=P.z;}else if(fade.dir<0&&fade.t<=0)fade=null;$('fade').style.opacity=fade?clamp(fade.t,0,1):0;if(fade&&fade.dir>0)return;}
  if(menuOpen)return;const frozen=!!DLG;
  if(!frozen){S.time+=dt;saveT+=dt;if(saveT>15){saveT=0;if(!threat())save();}if(warT>0)warT-=dt;
    if(P.cd>0)P.cd-=dt;if(P.atkT>0)P.atkT-=dt;if(P.rollCd>0)P.rollCd-=dt;if(P.inv>0)P.inv-=dt;
    if(!P.dead&&!busy){let mx=0,mz=0,sp=13.5;if(P.roll>0){P.roll-=dt;mx=P.rdx;mz=P.rdz;sp=36;}else{[mx,mz]=moveInput();const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l;}if(l>.15&&P.atkT<=0)P.ang=Math.atan2(mx,mz);if(P.atkT>0)sp=5;}
      P.swim=area==='world'&&!P.fly&&height(P.x,P.z)<.3;if(P.fly)sp=20;else if(P.swim&&P.roll<=0)sp=8.5;WMODE=P.fly?2:S.ab.swim?1:0;
      if(mx||mz){const nx=P.x+mx*sp*dt,nz=P.z+mz*sp*dt;if(walkable(nx,P.z))P.x=nx;if(walkable(P.x,nz))P.z=nz;P.walk+=dt*12;}else P.walk=0;WMODE=0;}
    S.mp=Math.min(100,S.mp+dt*(allied('brumes')?2.4:1.2));
    for(const e of ENT.slice())ai(e,dt);ALLY.forEach((a,i)=>{if(!a.dead)allyAI(a,dt,i);});
    const all=ENT.concat(ALLY);for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),m=1.5*(a.sc+b.sc)/2;if(d<m&&d>.01){const p=(m-d)/2/d;if(!a.boss){a.x-=dx*p;a.z-=dz*p;}if(!b.boss){b.x+=dx*p;b.z+=dz*p;}}}
    ENT=ENT.filter(e=>!e.dead);ALLY=ALLY.filter(a=>!a.dead);
    for(const t of TEL){t.t+=dt;const k=clamp(t.t/t.dur,0,1);t.a.scale.setScalar(Math.max(.01,t.r*k));if(t.src&&t.src.dead&&!t.done){t.done=true;t.gone=true;}
      if(k>=1&&!t.done){t.done=true;t.gone=true;if(t.cb)t.cb();if(t.src){const y=ground(t.x,t.z);if(t.leap&&!t.src.dead&&walkable(t.x,t.z,.8)){t.src.x=t.x;t.src.z=t.z;}burst(t.x,y+.5,t.z,'#ff6b3d',t.r>6?12:6,2.6);sfx(110,.15,'square',.05,-50);if(Math.hypot(P.x-t.x,P.z-t.z)<t.r+.6)hurtPlayer(t.dmg);for(const a of ALLY.slice())if(Math.hypot(a.x-t.x,a.z-t.z)<t.r+.6)hurtAlly(a,t.dmg);}}}
    TEL=TEL.filter(t=>{if(t.gone){scene.remove(t.g);return false;}return true;});
    for(const p of PROJ){p.t+=dt*4.5;const g=p.tgt,k=Math.min(1,p.t);p.m.position.set(lerp(p.sx,g.x,k),lerp(p.sy,ground(g.x,g.z)+2,k)+Math.sin(k*3.14)*2,lerp(p.sz,g.z,k));if(k>=1){scene.remove(p.m);p.onHit();p.done=1;}}PROJ=PROJ.filter(p=>!p.done);
    for(const p of PICK){if(!p.got&&Math.hypot(p.x-P.x,p.z-P.z)<2.8){p.got=true;p.g.parent&&p.g.parent.remove(p.g);p.onGet();}}PICK=PICK.filter(p=>!p.got);QR.picks=QR.picks.filter(p=>!p.got);
    if(stormT>0){stormT-=dt;stormN-=dt;if(stormN<=0){stormN=.42;const c=ENT.filter(e=>Math.hypot(e.x-P.x,e.z-P.z)<18);if(c.length){const e=c[(Math.random()*c.length)|0],y=ground(e.x,e.z);bolt(e.x+rnd(-3,3),y+30,e.z+rnd(-3,3),e.x,y+2,e.z);burst(e.x,y+2,e.z,'#cfe0ff',6,4);sfx(700+rnd(0,300),.12,'square',.04,-500);hurtEnemy(e,stats().mag*1.25,false,'#cfe0ff');}}}
    if(honkCd>0)honkCd-=dt;secretTick();questTick();dungeonTick();warTick(dt);spT+=dt;if(spT>.5){spT=0;spawnTick();}}
  // visuels
  const py=(P.swim?-1.15:ground(P.x,P.z))+(P.alt||0);P.g.position.set(P.x,py,P.z);let da=P.ang-P.g.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));P.g.rotation.y+=da*Math.min(1,dt*18);
  const U=P.m.userData;P.m.position.y=(P.walk?Math.abs(Math.sin(P.walk))*.35:0)+(P.roll>0?1.2:0);P.m.rotation.z=P.walk?Math.sin(P.walk)*.12:0;P.m.rotation.x=P.roll>0?(1-P.roll/.32)*6.283:0;
  U.neck.rotation.x=P.atkT>0?.7:Math.sin(time*2)*.04;U.sword.rotation.y=P.atkT>0?(-1.4+(1-P.atkT/.2)*2.8):-.3;P.swing.material.opacity=P.atkT>0?P.atkT/.2:0;P.swing.rotation.z=-Math.PI/2+(P.atkT>0?(1-P.atkT/.2)*.9-.45:0);U.cape.rotation.x=(P.walk?.55:.1)+Math.sin(time*5)*.06;
  {const f=P.atkT>0?.7:P.walk?.14+Math.abs(Math.sin(P.walk))*.14:.03+Math.sin(time*2.4)*.035,w=P.walk&&P.roll<=0?Math.sin(P.walk):0;U.wl.rotation.z=-f;U.wr.rotation.z=f;U.legL.rotation.x=w*.85;U.legR.rotation.x=-w*.85;P.m.scale.y=(P.sc||1)*(1+Math.sin(time*2.4)*.025);if(P.atkT>0&&P.roll<=0)P.m.rotation.x=.2;flashChar(P.m,P.hurtT>.33&&!P.dead);}P.m.visible=!(P.inv>0&&Math.floor(time*20)%2)||P.dead;P.fall=P.dead?Math.min(1.5,(P.fall||0)+dt*5):0;if(P.fall){P.m.rotation.z=P.fall;P.m.position.y=-P.fall*.25;}if(P.alt>.5){U.wl.rotation.z=-.9-Math.sin(time*14)*.5;U.wr.rotation.z=.9+Math.sin(time*14)*.5;P.m.position.y=Math.sin(time*5)*.25;}
  for(const e of ENT){e.g.position.set(e.x,ground(e.x,e.z),e.z);e.fg.scale.x=Math.max(.01,4*e.hp/e.maxhp);e.fg.center.x=2/e.fg.scale.x;animChar(e,dt,e.wind>0);e.m.scale.setScalar(e.sc*(e.hit>0?1.18:1)*(e.wind>0?1+Math.sin(time*30)*.04:1));e.m.scale.y*=1+Math.sin(e.t*2.6)*.035;flashChar(e.m,e.hit>.05);}
  for(const a of ALLY){a.g.position.set(a.x,ground(a.x,a.z),a.z);a.fg.scale.x=Math.max(.01,4*a.hp/a.maxhp);a.fg.center.x=2/a.fg.scale.x;animChar(a,dt,a.atk>0);a.m.position.z=a.atk>0?.8:0;a.m.scale.setScalar(warT>0?1.1:1);a.m.scale.y*=1+Math.sin(a.t*2.6)*.035;}
  for(const n of NPCS){const u=n.m.userData;if(u.tail)u.tail.rotation.x=Math.sin(time*2+n.x)*.12;if(u.neck)u.neck.rotation.x=Math.sin(time*1.5+n.x)*.06;if(n.mark){n.mark.position.y=7.8+Math.abs(Math.sin(time*3+n.x))*.7;const k=3.6*(1+Math.sin(time*6+n.x)*.06);n.mark.scale.set(k,k,1);}n.m.scale.y=1+Math.sin(time*2.4+n.z)*.03;}
  for(const p of PICK){p.g.children[0].rotation.y=time*3;p.g.children[0].position.y=1.4+Math.sin(time*4+p.x)*.3;}
  if(QR.beam&&QR.beam.visible){QR.beam.userData.k.position.y=9+Math.sin(time*4);QR.beam.userData.k.rotation.y=time*2;}
  for(const p of PART){p.t+=dt;if(!p.still){if(!p.nograv)p.vy-=28*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;}p.m.material.opacity=1-p.t/p.life;if(p.t>=p.life){scene.remove(p.m);if(p.still)p.m.geometry.dispose();}}PART=PART.filter(p=>p.t<p.life);
  for(const id in DUNV)DUNV[id].ring.rotation.z=time*.5;
  if(shake>0)shake-=dt;const sx=shake>0?rnd(-1,1)*Math.min(.45,.1+shake*1.4):0,k=Math.min(1,dt*7);camX=lerp(camX,P.x,k);camZ=lerp(camZ,P.z,k);camY=lerp(camY,py,k);cam.position.set(camX+sx,camY+37*zoom,camZ+30*zoom+sx);cam.lookAt(camX,camY+1.5,camZ);
  let bi=0;if(area==='world'){bi=biome(P.x,P.z);if(bi!==curBio){curBio=bi;$('zone').textContent=BIO[bi].n+' · niveaux '+BIO[bi].lv+'–'+(BIO[bi].lv+3);}}
  tod=(S.time/600+.32)%1;gfxTick(dt,P.x,py,P.z,tod,bi);if(P.hurtT>0)P.hurtT-=dt;if(gradePass)gradePass.uniforms.uHurt.value=Math.max(0,P.hurtT/.45)+(S.hp<stats().hp*.25?.25+.1*Math.sin(time*5):0);
  const w=innerWidth,h=innerHeight;for(const f of FT){f.t+=dt;V3.set(f.x,f.y+f.t*3,f.z).project(cam);{const e=1-(1-f.t)*(1-f.t),sc=f.t<.09?.4+f.t*15:f.t<.2?1.75-(f.t-.09)*6.8:1;f.d.style.left=((V3.x*.5+.5)*w+f.jx*e)+'px';f.d.style.top=((-V3.y*.5+.5)*h-e*26)+'px';f.d.style.opacity=f.t<.62?1:1-(f.t-.62)/.38;f.d.style.transform='translate(-50%,-50%) scale('+sc.toFixed(2)+') rotate('+(f.big?(Math.sin(f.t*34)*7*(1-f.t)).toFixed(1):0)+'deg)';}if(f.t>=1)f.d.remove();}FT=FT.filter(f=>f.t<1);
  hud();}
let last=0,titleT=0;
function loop(ts){const raw=(ts-last)/1000||0,dt=Math.min(.05,raw);last=ts;
  if(state==='play'){update(dt);frame();if(autoQ&&!menuOpen&&!DLG&&raw<.5){fpsN++;fpsT+=raw;if(fpsT>4){const fps=fpsN/fpsT;fpsN=fpsT=0;if(fps<26&&quality>0){quality--;applyQuality();note('Qualité graphique réduite pour garder un jeu fluide (réglable dans le menu, onglet Options).');}else if(fps>45)autoQ=false;}}}
  else if(state==='title'){titleT+=dt;const a=titleT*.07;cam.position.set(Math.cos(a)*95,46,40+Math.sin(a)*95);cam.lookAt(0,5,40);gfxTick(dt,0,height(0,40),40,.3+titleT*.004,0);frame();}
  requestAnimationFrame(loop);}

/* ───────── DÉMARRAGE ───────── */
function start(saved){S=saved||newState();state='play';busy=false;DLG=null;renderDlg();menuOpen=false;$('menu').style.display='none';$('title').style.display='none';$('end').style.display='none';
  ['hud','qt'].forEach(i=>$(i).style.display='block');$('spells').style.display='flex';if(isTouch)$('touch').style.display='block';
  evoRefresh();npcVis();for(const id in PZR)pzLook(id);YETI=null;
  [P.x,P.z]=nearWalk(S.x,S.z);camX=P.x;camZ=P.z;camY=ground(P.x,P.z);P.dead=false;if(S.hp>stats().hp||S.hp<=0)S.hp=stats().hp;hudK='';for(const id in FORT)setFortLook(id);setupStep();syncArmy();
  if(!S.intro)setTimeout(async()=>{if(state!=='play'||DLG)return;busy=true;await say('',["Le royaume de Cancan-les-Bains : un lac pour les oies, une forêt pour les écureuils, et entre les deux, le Gland d'Or, gardé en commun depuis toujours.","Tu es Plume, jeune oie du village. Ce matin, un vacarme te tire du nid…","Va parler à la Doyenne Cacarde, juste au nord : elle a une étoile dorée au-dessus de la tête."]);S.intro=1;busy=false;save();},700);}
