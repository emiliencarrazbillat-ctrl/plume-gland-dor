'use strict';
/* Acte libre : îles, plateaux, village à bâtir, nouveaux donjons, quêtes de capacités, quêtes cachées */
const PAL=[[.40,.76,.20],[.22,.60,.22],[.93,.78,.24],[.30,.60,.44],[.86,.93,1],[.56,.42,.38],[.93,.56,.20],[.46,.52,.72],[.24,.54,.48],[.36,.24,.24],[.44,.50,.42]];
BIO.forEach((b,i)=>{b.c=PAL[i];b.t=PAL[i].map(v=>Math.min(1,v*1.06));});
const ISL=[[-610,120,'Îlot du Vieux Phare'],[-250,610,'Île aux Tortues'],[610,330,'Récif des Épaves'],[330,600,'Île du Bout-du-Monde']];
const BAR=[[-150,300,24,'Plateau des Vents'],[-330,-100,22,'Aire du Ciel'],[190,-255,22,'Cratère suspendu']];
const RLINK=[[0,1],[0,2],[0,3],[0,4],[0,5],[3,6],[1,7],[2,8],[5,9],[4,10]];
const clone=(a,b)=>Object.assign({},a,b);
Object.assign(ET,{b_epave:clone(ET.b_oienoire,{n:'Capitaine Bec-Crochu',col:'#20242c',o:{crow:1,scarf:'#c0392b'}}),b_gardien:clone(ET.b_bernache,{n:'Le Gardien sans nom',hp:34,col:'#e8e2ff',o:{armor:1,crownG:1}}),
 b_vent:clone(ET.b_givre,{n:'Sylphe-Jars',col:'#e6f0d0',o:{scarf:'#9fe0c0'}}),b_roc:clone(ET.b_bernache,{n:'Le Grand Roc',hp:20,col:'#4a3a2a',o:{crow:1}}),b_coeur:clone(ET.b_magma,{n:'Cœur-de-Braise',col:'#5a1a0a'})});
Object.assign(DUN,{
 d16:['Épave du Léviathan',610,335,22,110,[['naufrageur',6],['corbeau',5],['corbmage',3]],'b_epave','#22343a'],
 d17:['Grotte aux Coraux',-250,612,16,100,[['oie',5],['chaman',4],['jars',3]],null,'#3a5a5a'],
 d18:['Caves du Vieux Phare',-610,124,12,90,[['brigand',5],['frondeur',4],['chaman',3]],null,'#3a3a44'],
 d19:['Sanctuaire du Bout-du-Monde',330,604,37,150,[['molosse',5],['aboyeur',5],['corbmage',5],['limier',4]],'b_gardien','#2a2238'],
 d20:['Temple des Vents',-150,294,18,100,[['oie',6],['oiemage',4],['frondeur',4]],'b_vent','#6a6a50'],
 d21:['Nid du Roc',-330,-104,26,110,[['oiearc',6],['oiemage',5],['jars',4]],'b_roc','#3a3d4a'],
 d22:['Cœur du Cratère',190,-259,31,120,[['fouine',6],['blaireau',6],['sanglier',3]],'b_coeur','#3a1a12'],
 d23:['Cave à cidre hantée',-140,172,9,80,[['brigand',5],['chaman',4]],null,'#5a4a30'],
 d24:['Mine abandonnée',-250,92,5,80,[['brigand',5],['frondeur',3],['renard',3]],null,'#4a4438'],
 d25:['Égouts de la Roselière',130,96,11,90,[['chaman',4],['brigand',5],['jars',2]],null,'#34423a']});
// lieux-dits : id, type, nom, x, z, gardien, espèce, couleur, accessoires
const POIS=[
 ['p1','tour','Tour de guet du Levant',140,10,'Guetteur Roitelet','go','#e8e0d0',{armor:1}],['p2','ferme','Ferme des Trois-Saules',-60,112,'Fermier Pissenlit','go','#fff0c0',{scarf:'#7ab03a'}],
 ['p3','ruine','Ruines du Vieux Pont',62,162,'Archéologue Tamia','sq','#c9a070',{hat:'#7a5a3a'}],['p4','sanct','Sanctuaire du Chêne-Roi',-320,42,'Druide Glandon','sq','#7a6a4a',{staff:1,heal:1}],
 ['p5','camp','Camp des Bûcherons',-150,112,'Bûcheronne Écorce','sq','#a05a22',{bandana:'#c0392b'}],['p6','moulin','Moulin des Quatre-Vents',-10,152,'Meunière Bluette','go','#f4f0e6',{scarf:'#5a8fd0'}],
 ['p7','tour','Vigie des Blés',-190,252,'Vigie Chardon','sq','#c98a2b',{bow:1}],['p8','sanct','Autel des Brumes',290,42,'Prêtresse Nymphéa','go','#dfe8d8',{staffG:1}],
 ['p9','camp','Camp des Trappeurs',62,-112,'Trappeur Lynx','sq','#8a7a6a',{bandana:'#3a2a1a',dagger:1}],['p10','ruine','Ruines de Givrepierre',-100,-302,'Érudit Frimas','go','#f4f8ff',{scarf:'#7a5ab0'}],
 ['p11','tour','Tour des Cendres',262,-122,'Sentinelle Suie','go','#8a8078',{armor:1}],['p12','ferme','Verger des Crocs',202,332,'Vergère Reinette','qd','#d9702b',{fox:1}],
 ['p13','phare','Phare de la Pointe',-412,272,'Gardien Fanal','sq','#5a4636',{otter:1}],['p14','camp','Camp des Chercheurs d\'os',-72,-392,'Fouilleuse Vertèbre','sq','#6a6058',{hat:'#3a3632'}],
 ['p15','sanct','Autel de Lave',352,-342,'Forgemage Clinker','qd','#3a3632',{badger:1}],
 ['p16','phare','Vieux Phare',-602,112,'Gardien Bernique','sq','#6a5240',{otter:1}],['p17','hutte','Hutte des Tortues',-240,602,'Mamie Carapace','go','#d8e8c8',{scarf:'#3a8f5a'}],
 ['p18','camp','Bivouac des Épaves',600,322,'Rescapé Tribord','sq','#5a4636',{otter:1,bandana:'#c0392b'}],['p19','hutte','Ermitage du Bout-du-Monde',322,590,'Ermite Zénith','go','#f0e8ff',{scarf:'#b06aff'}],
 ['p20','hutte','Refuge des Vents',-142,308,'Planeuse Brise','go','#f4f8ff',{scarf:'#9fe0c0'}],['p21','tour','Vigie du Ciel',-322,-92,'Fauconnière Azur','go','#e0e8f4',{scarf:'#3f7fd0'}],
 ['p22','camp','Belvédère du Cratère',198,-246,'Vulcanologue Ponce','qd','#4a4440',{badger:1}]];
POIS.forEach(p=>{NPCD[p[0]]=[p[5],p[6],p[7],-1,p[3]+4,p[4]+4,0,p[8],"Ici, on n'a pas souvent de visite. Reste un peu."];});
Object.assign(NPCD,{ // donneurs de quêtes cachées
 h_col:['Le Collectionneur','sq','#9a8a7a',-1,-400,-230,0,{monocle:1,hat:'#3a2a3a'},"Chut. Je classe."],h_lune:['Pêcheuse de Lune','go','#cfe0ff',-1,90,102,0,{scarf:'#3a3a7a'},"La lune mord mieux que les poissons."],
 h_masq:['Marchand masqué','sq','#3a3a44',-1,22,-132,0,{bandana:'#111',hat:'#111'},"Je ne vends rien. Officiellement."],h_spect:['Spectre du Carrefour','go','#bfe0ff',-1,102,202,0,{},"Hou. Enfin, bonjour."],
 h_taupe:['Taupe cartographe','qd','#4a4038',-1,-232,182,0,{},"Je dessine ce que je ne vois pas. C'est tout un art."],h_pie:['La Pie voleuse','go','#22222a',-1,302,202,0,{crow:1,scarf:'#ffffff'},"C'est à moi. Tout est à moi. Sauf ça. Ça, c'est à moi aussi."]});
const VB={ // nom, icône, or de base, matériaux de base, niveau max, effet
 mairie:['Hôtel de ville','🏛',150,20,3,L=>"Débloque le niveau "+L+" des autres bâtiments, +2 habitants par niveau"],
 maisons:['Chaumières','🏠',90,25,3,L=>"+"+L*4+" habitants (chaque habitant rapporte de l'or)"],
 ferme:['Ferme','🌾',110,20,3,L=>"+"+L*6+" or et +"+L+" matériau par minute, +"+L*2+" habitants"],
 marche:['Marché','🛒',160,25,3,L=>"+"+L*15+" or par minute"],
 caserne:['Caserne','⚔',140,30,3,L=>L*2+" gardes défendent le village, "+L+" miliciens te rejoignent dans les batailles"],
 rempart:['Palissade','🧱',130,45,3,L=>"Les assaillants arrivent avec "+L*15+" % de vie en moins"],
 tour:['Tours de guet','🏹',120,35,3,L=>(L+1)+" tours tirent sur les assaillants"],
 forge:['Forge','🔨',170,35,3,L=>"Tes soldats frappent "+L*10+" % plus fort"],
 infirm:['Infirmerie','✚',130,25,3,L=>"Les soldats blessés reviennent seuls après "+[0,180,120,60][L]+" s"],
 magie:['Tour de magie','🔮',180,30,3,L=>"Sorts "+L*8+" % plus puissants, magie régénérée plus vite"]};
QL.push(
 // ── capacités
 {id:'a1',n:'Leçon de nage',g:'passeur',pre:'s16',lv:10,ab:'swim',i:["Une oie qui ne nage pas ? J'aurai tout vu. Deux épreuves : pêche-moi 3 poissons, puis rattrape mes 4 bouées qui dérivent le long de la rive.","Après ça, je t'apprends la brasse du passeur. Et les îles au large seront à toi."],s:[['fish',215,125,3],['chase',228,118,4,'Bouée à la dérive']],e:["Bien. Maintenant écoute : on rentre le cou, on pousse des palmes, et on ne boit pas la tasse. Voilà, tu nages ! Entre dans l'eau, tout simplement."]},
 {id:'a2',n:'Le premier vol',g:'guide',pre:'m7',lv:14,ab:'fly',i:["Dis-moi, Plume… tu sais que les oies volent ? Non ? Personne ne te l'a dit ? Ça alors.","Rattrape 5 plumes de vent avant qu'elles ne s'envolent, puis cours le long de la crête, fanion après fanion, pour sentir l'air te porter."],s:[['tcollect',-62,-240,5,'Plume de vent',22],['race',[[-22,-232],[8,-202],[-30,-182],[-70,-196]],36]],e:["Tu as décollé d'une patte sans t'en rendre compte ! Appuie sur V pour t'envoler. Ton souffle est court : pose-toi avant d'être à bout, et jamais sur la lave. Les plateaux cernés de rochers ne sont accessibles que par les airs."]},
 {id:'a3',n:'La traversée du lac',g:'gaspard',pre:'a1',lv:11,i:["Tu nages, maintenant ? Alors fais le tour de mes quatre bouées, au milieu du lac. Dans les temps !"],s:[['race',[[12,95],[45,95],[78,95],[45,62]],44]],e:["Même mes poissons t'ont applaudie."]},
 {id:'a4',n:'Par-dessus les rochers',g:'guide',pre:'a2',lv:16,i:["Trois plateaux du royaume sont cernés de rochers : on n'y entre qu'en volant. Le plus proche d'ici est l'Aire du Ciel, à l'ouest, dans les Pics. Va saluer la Fauconnière Azur de ma part."],s:[['talk','p21',["Une oie qui arrive par les airs ! Flocon t'a bien formée. Ici, on voit tout le royaume. Reviens quand tu veux, j'ai du travail pour des ailes comme les tiennes."]]],e:["Tu vois ? Le ciel est une route comme une autre."]},
 // ── bâtir Cancan-les-Bains
 {id:'vq1',n:'Un village à soi',g:'cacarde',pre:'m2',lv:3,i:["Cancan-les-Bains te doit beaucoup, et il a besoin de grandir. Je te confie son développement.","Ouvre le menu, onglet Village. Il te faudra de l'or et des matériaux : on en gagne en combattant, en ramassant les tas de bois et de pierre du royaume, et en tenant des avant-postes. Commence par l'Hôtel de ville."],s:[['cond','b:mairie:1',"Bâtis l'Hôtel de ville (menu → Village)"]],e:["Un vrai hôtel de ville ! Chaque bâtiment a trois niveaux. Et plus Cancan-les-Bains sera riche, plus il attirera les pillards : pense aux défenses."]},
 {id:'vq2',n:'Aux armes, villageoises',g:'rec0',pre:'vq1',lv:5,i:["Un village sans caserne, c'est un garde-manger sans porte. Bâtis-en une : j'y formerai des gardes, et ils te suivront à l'assaut des avant-postes."],s:[['cond','b:caserne:1',"Bâtis la Caserne"]],e:["Deux gardes à demeure, et un milicien pour tes batailles. C'est un début."]},
 {id:'vq3',n:'La palissade',g:'cacarde',pre:'vq2',lv:6,i:["Les éclaireurs parlent de bandes qui lorgnent sur Cancan-les-Bains. Dresse une palissade."],s:[['cond','b:rempart:1',"Bâtis la Palissade"]],e:["Qu'ils viennent. Ils laisseront des plumes sur les pieux."]},
 {id:'vq4',n:'Premier sang',g:'rec0',pre:'vq3',lv:7,i:["Ils viendront, tôt ou tard. Quand le cor sonnera, rentre défendre le village : menu, onglet Carte, « Rentrer à Cancan-les-Bains ». Si tu es trop loin, tes défenses se battront sans toi… et elles peuvent perdre."],s:[['cond','vraid1',"Repousse un raid contre Cancan-les-Bains"]],e:["Victoire ! Les habitants t'ont vue te battre pour eux. Ça compte."],it:'cotte'},
 {id:'vq5',n:'Du pain et des toits',g:'brioche',pre:'vq1',lv:6,i:["Des familles veulent s'installer, mais où ? Et que mangeront-elles ? Il nous faut des chaumières et une ferme."],s:[['cond','b:maisons:1',"Bâtis les Chaumières"],['cond','b:ferme:1',"Bâtis la Ferme"]],e:["Ça sent le pain chaud jusqu'au lac !"]},
 {id:'vq6',n:'Quinze âmes',g:'brioche',pre:'vq5',lv:9,i:["Cancan-les-Bains grandit. Quand nous serons quinze, on pourra enfin faire une vraie fête."],s:[['cond','pop15',"Atteins 15 habitants"]],e:["Quinze ! Je commence à ne plus connaître tout le monde."]},
 {id:'vq7',n:'Les tours de guet',g:'rec0',pre:'vq4',lv:11,i:["Mes gardes ne voient pas la nuit. Des tours, avec des arbalètes : voilà ce qu'il nous faut. Niveau 2."],s:[['cond','b:tour:2',"Tours de guet au niveau 2"]],e:["Trois tours. Rien n'approchera sans se faire trouer la couenne."]},
 {id:'vq8',n:'Le marché du lac',g:'pistache',pre:'vq1',lv:8,i:["Un marché ! Voilà ce qui manque. Je tiendrai le premier étal. Gratuitement. Enfin, presque."],s:[['cond','b:marche:1',"Bâtis le Marché"]],e:["Les affaires reprennent. Ta part tombera chaque minute."]},
 {id:'vq9',n:'La tour de magie',g:'hulotte',pre:'vq1',lv:12,i:["Le savoir a besoin de murs. Bâtis une tour de magie, et tes sorts y gagneront."],s:[['cond','b:magie:1',"Bâtis la Tour de magie"]],e:["Elle penche un peu. C'est voulu."]},
 {id:'vq10',n:'Cancan-les-Bains la Grande',g:'cacarde',pre:'vq6',lv:20,i:["Je rêve d'une capitale. Hôtel de ville au niveau 3, et cinq raids repoussés : alors tout le royaume saura que Cancan-les-Bains ne tombe pas."],s:[['cond','b:mairie:3',"Hôtel de ville au niveau 3"],['cond','vraid5',"Repousse 5 raids contre Cancan-les-Bains"]],e:["Cancan-les-Bains la Grande. Je ne pensais pas voir ça de mon vivant."],it:'couronne'},
 // ── îles, plateaux, nouveaux donjons
 {id:'i1',n:'Le phare des noyés',g:'p16',lv:12,i:["Des bruits montent des caves du phare. Moi, je n'y descends plus. Toi, tu as l'air d'aimer les ennuis."],s:[['dungeon','d18']],e:["Plus un bruit. Je vais enfin dormir."],loot:1},
 {id:'i2',n:'Les petits de Mamie Carapace',g:'p17',lv:16,i:["Mes bébés tortues se sont éparpillés ! Ils courent vite, pour des tortues. Ramène-m'en cinq, puis chasse ce qui les a effrayés, dans la Grotte aux Coraux."],s:[['chase',-262,592,5,'Bébé tortue'],['dungeon','d17']],e:["Tous là. Tu es une bonne oie, même si tu sens le poisson."],loot:1},
 {id:'i3',n:"L'Épave du Léviathan",g:'p18',lv:22,i:["Notre navire s'est brisé ici, et son capitaine a mal tourné. Il hante l'épave avec ses corbeaux. Délivre-nous de lui."],s:[['dungeon','d16']],e:["Le Léviathan peut couler en paix."],loot:1},
 {id:'i4',n:'Le Bout du Monde',g:'p19',lv:36,i:["Tu as vaincu des rois. Mais ici, tout au bout, dort quelque chose de plus ancien qu'eux. Je garde la porte depuis toujours. Si tu entres, tu entres seule face à lui."],s:[['dungeon','d19']],e:["Alors c'est fini. Je peux enfin regarder la mer sans compter les jours."],loot:1},
 {id:'k1',n:'Le Temple des Vents',g:'p20',lv:18,i:["Le vent ne chante plus sur le plateau. Quelque chose s'est installé dans le temple."],s:[['dungeon','d20']],e:["Écoute ! Il chante de nouveau."],loot:1},
 {id:'k2',n:'Le Nid du Roc',g:'p21',lv:26,i:["Un rapace énorme niche là-dessous. Mes faucons n'osent plus voler."],s:[['dungeon','d21']],e:["Le ciel est rendu aux petits."],loot:1},
 {id:'k3',n:'Le Cœur du Cratère',g:'p22',lv:31,i:["Le cratère bat comme un cœur. Ce n'est pas géologique, c'est vivant. Va voir, moi je prends des notes."],s:[['dungeon','d22']],e:["Fascinant. Terrifiant. Je vais en faire trois volumes."],loot:1},
 {id:'n1',n:'La cave à cidre hantée',g:'p2',lv:9,i:["Ma cave à cidre ! Des brigands s'y sont installés, et ils se font passer pour des fantômes."],s:[['dungeon','d23']],e:["Mon cidre est sauf. Enfin, ce qu'il en reste."],loot:1},
 {id:'n2',n:'La mine abandonnée',g:'p5',lv:5,i:["La vieille mine, au nord-ouest, n'est plus si abandonnée. On y entend des pioches la nuit."],s:[['dungeon','d24']],e:["Du bon bois d'étai, là-dedans. Je vais me servir."]},
 {id:'n3',n:'Les égouts de la Roselière',g:'vieille',pre:'s15',lv:11,i:["Ça grouille sous nos pilotis. Ça chuchote. Ça prépare un mauvais coup."],s:[['dungeon','d25']],e:["Le silence. Juste les grenouilles. Parfait."],loot:1},
 // ── quêtes cachées
 {id:'hq1',hid:1,n:'[Cachée] Les papillons rares',g:'h_col',lv:20,i:["Vous m'avez trouvé. Soit. Six papillons d'ardoise volettent par ici. Ils sont rapides. Moi pas."],s:[['chase',-388,-212,6,"Papillon d'ardoise"]],e:["Splendides. Je les relâcherai. Peut-être."],loot:1},
 {id:'hq2',hid:1,n:'[Cachée] La collection envolée',g:'h_col',pre:'hq1',lv:21,i:["Un coup de vent a emporté mes huit timbres anciens. Vous avez vingt-six secondes avant qu'ils ne finissent à la mer."],s:[['tcollect',-384,-244,8,'Timbre ancien',26]],e:["Pas un de corné. Remarquable."],loot:1},
 {id:'hq3',hid:1,n:'[Cachée] Pêche à la lune',g:'h_lune',lv:6,i:["La nuit, les poissons d'argent remontent. Cinq prises sans casser la ligne, et je te dis un secret."],s:[['fish',78,96,5]],e:["Le secret ? Il y a un canard géant sur ce lac. Personne n'en parle. Voilà."]},
 {id:'hq4',hid:1,n:'[Cachée] Le chant des piliers',g:'h_lune',pre:'hq3',lv:8,i:["Quatre piliers chantent, au sud du lac. Écoute leur air, et rejoue-le sans une fausse note."],s:[['simon',40,150,6]],e:["Tu as l'oreille. Les piliers t'aiment bien."],loot:1},
 {id:'hq5',hid:1,n:'[Cachée] Marchandise sensible',g:'h_masq',lv:13,i:["Un chariot. Ne demande pas ce qu'il contient. Empêche qu'on le casse, trois vagues, et on ne s'est jamais vus."],s:[['defend',40,-150,'Chariot bâché',[[['brigand',13,4]],[['frondeur',13,3],['chaman',13,2]],[['jars',14,2],['brigand',14,3]]]]],e:["Quel chariot ? Tiens, c'est tombé de… nulle part."],loot:1},
 {id:'hq6',hid:1,n:'[Cachée] Le concurrent',g:'h_masq',pre:'hq5',lv:15,i:["Un autre marchand masqué me fait de l'ombre, à l'est. Explique-lui."],s:[['spawn',70,-140,[['chaman',16,1,1],['brigand',15,3]]]],e:["Le commerce est une guerre. Tu la mènes bien."],loot:1},
 {id:'hq7',hid:1,n:'[Cachée] La ronde du spectre',g:'h_spect',lv:19,i:["Chaque nuit je fais ma ronde, depuis deux cents ans. Je suis fatigué. Fais-la pour moi, une fois. Quatre fanions, pas une seconde de trop."],s:[['race',[[130,180],[150,225],[105,250],[75,215]],34]],e:["Merci. Je crois que je vais enfin pouvoir m'asseoir."],loot:1},
 {id:'hq8',hid:1,n:'[Cachée] Ceux du carrefour',g:'h_spect',pre:'hq7',lv:20,i:["Ceux qui m'ont tué rôdent encore. Ils ne sont plus tout jeunes non plus."],s:[['spawn',118,214,[['jars',21,2,1],['chaman',20,2]]]],e:["Voilà. C'est fait. Hou… non, pardon. Merci."],loot:1},
 {id:'hq9',hid:1,n:'[Cachée] La carte des taupes',g:'h_taupe',lv:9,i:["Je dessine une carte, mais je ne vois rien. Va aux quatre repères et décris-moi ce que tu vois."],s:[['goto',-260,150,["Un grand arbre fendu par la foudre."]],['goto',-200,215,["Un rocher en forme de noisette. Évidemment."]],['goto',-250,235,["Une mare. Avec une grenouille très sûre d'elle."]],['goto',-290,200,["Rien. Vraiment rien. Tu le notes quand même."]]],e:["Arbre, noisette, mare, rien. Parfait, ça fait une carte."]},
 {id:'hq10',hid:1,n:'[Cachée] Les galeries secrètes',g:'h_taupe',pre:'hq9',lv:10,i:["Mes sept lanternes sont restées dans mes galeries effondrées. Vingt-quatre secondes avant qu'elles ne s'éteignent toutes."],s:[['tcollect',-246,196,7,'Lanterne de taupe',24]],e:["Je ne vois toujours rien, mais c'est joli, paraît-il."],loot:1},
 {id:'hq11',hid:1,n:'[Cachée] Tout ce qui brille',g:'h_pie',lv:14,i:["Cinq choses brillantes se promènent par ici. Elles sont à moi. Rapporte-les. Elles courent."],s:[['chase',318,188,5,'Chose brillante']],e:["À moi. Bien. Tu peux garder… non. Si. Tiens."],loot:1},
 {id:'hq12',hid:1,n:'[Cachée] Le trésor de la Pie',g:'h_pie',pre:'hq11',lv:16,i:["Mon coffre ne s'ouvre qu'avec un air à sept notes. Je l'ai oublié. Les piliers, là-bas, s'en souviennent."],s:[['simon',330,220,7]],e:["Il s'ouvre ! Tout est à moi. Sauf ça, pour toi. C'est cadeau. C'est rare."],it:'cape'});
QL.forEach(q=>QBY[q.id]=q);
