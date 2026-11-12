'use strict';
buildWorld();buildExtras();buildPlayer();buildNPCs();buildSpawns();buildSpellBar();buildSecretsAndPuzzles();
$('bNew').onclick=()=>{sfx(660,.1,'triangle',.06);renderSlots('new');};$('bCont').onclick=()=>{sfx(660,.1,'triangle',.06);renderSlots('cont');};
$('bFree').onclick=()=>{$('end').style.display='none';state='play';};
if(anySave())$('bCont').style.display='';$('title').style.display='flex';P.g.visible=true;P.g.position.set(-1,height(-1,59),59);
requestAnimationFrame(loop);
window.__dbg={PUZ,get PZR(){return PZR;},pzTouch,get SECR(){return SECR;},EVENTS,honk,get S(){return S;},P,get ENT(){return ENT;},get ALLY(){return ALLY;},QL,DUN,FORT,NPCS,VIL,walkable,height,biome,nearWalk,enterDungeon,leaveDungeon,get area(){return area;},get DG(){return DG;},startQuest,QBY,stats,cast,attack,get DLG(){return DLG;},advDlg,SPAWNS,toggleMenu,setTab:t=>{tab=t;renderMenu();},syncArmy,addRep,FR,get q(){return quality;},setQ:q=>{quality=q;autoQ=false;applyQuality();},get composer(){return !!composer;},get hdr(){return hdr;},
 /* crochets pour les tests automatiques (aucun effet en jeu) */
 update:dt=>update(dt),frame:()=>frame(),save:()=>save(),get state(){return state;},renderer,cam,ET,get keys(){return keys;},vBuild:id=>vBuild(id),vCan:id=>vCan(id),toggleFly:()=>toggleFly(),get WMODE(){return WMODE;},roll:()=>roll(),get CURSLOT(){return CURSLOT;},toTitle:()=>toTitle(),get PADV(){return PADV;},get COL(){return COL;},get MIR(){return MIR;},roadDist,
 adv:s=>{const n=Math.max(1,Math.round(s/.033));for(let i=0;i<n;i++)update(.033);}};
