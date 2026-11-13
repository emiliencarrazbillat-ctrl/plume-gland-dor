'use strict';
/* Démarrage par étapes : entre deux étapes, le navigateur affiche la progression (écran de chargement). */
(async()=>{const ch=$('charge'),barre=ch&&ch.querySelector('i'),txt=ch&&ch.querySelector('p');
const etape=async(t,k,f)=>{if(barre){barre.style.width=Math.round(k*100)+'%';txt.textContent=t;}await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));f();};
await etape('Façonnage des terres…',.08,()=>bakeMaps());
await etape('Le lac se remplit…',.25,()=>buildTerrain());
await etape('Construction des villages…',.42,()=>buildStructures());
await etape('Les arbres poussent…',.6,()=>buildDecor());
await etape('Le ciel se dégage…',.72,()=>{buildClouds();rendu2Init();applyQuality();});
await etape('Les villageois se réveillent…',.84,()=>{buildExtras();buildPlayer();buildNPCs();pnjVieInit();buildSpawns();buildSpellBar();buildSecretsAndPuzzles();efxInit();});
// on attend les textures (8 secondes au plus : le jeu reste jouable sans elles)
{const t0=performance.now();while(UTEX.value<1&&performance.now()-t0<8000){if(barre){barre.style.width=Math.round((.88+.12*(texAttendues?texPretes/texAttendues:1))*100)+'%';txt.textContent='Dernières couleurs…';}await new Promise(r=>setTimeout(r,60));}}
if(ch){barre.style.width='100%';ch.classList.add('fin');setTimeout(()=>ch.remove(),600);}
$('bNew').onclick=()=>{sfx(660,.1,'triangle',.06);renderSlots('new');};$('bCont').onclick=()=>{sfx(660,.1,'triangle',.06);renderSlots('cont');};
$('bFree').onclick=()=>{$('end').style.display='none';state='play';};
if(anySave())$('bCont').style.display='';$('title').style.display='flex';P.g.visible=true;P.g.position.set(-1,height(-1,59),59);
requestAnimationFrame(loop);
window.__dbg={PUZ,get PZR(){return PZR;},pzTouch,get SECR(){return SECR;},EVENTS,honk,get S(){return S;},P,get ENT(){return ENT;},get ALLY(){return ALLY;},QL,DUN,FORT,NPCS,VIL,walkable,height,biome,nearWalk,enterDungeon,leaveDungeon,get area(){return area;},get DG(){return DG;},startQuest,QBY,stats,cast,attack,get DLG(){return DLG;},advDlg,SPAWNS,toggleMenu,setTab:t=>{tab=t;renderMenu();},syncArmy,addRep,FR,get q(){return quality;},setQ:q=>{quality=q;autoQ=false;applyQuality();},get composer(){return !!composer;},get hdr(){return hdr;},
 /* crochets pour les tests automatiques (aucun effet en jeu) */
 update:dt=>update(dt),frame:()=>frame(),save:()=>save(),get state(){return state;},renderer,cam,ET,get keys(){return keys;},vBuild:id=>vBuild(id),vCan:id=>vCan(id),toggleFly:()=>toggleFly(),get WMODE(){return WMODE;},roll:()=>roll(),get CURSLOT(){return CURSLOT;},toTitle:()=>toTitle(),get PADV(){return PADV;},get COL(){return COL;},get MIR(){return MIR;},modeles:{mGoose,mSquirrel,mQuad,mBulldog},scene,pnjMaison:()=>pnjMaison(),PNJV,get dayF(){return dayF;},roadDist,
 adv:s=>{const n=Math.max(1,Math.round(s/.033));for(let i=0;i<n;i++)update(.033);}};
})();
