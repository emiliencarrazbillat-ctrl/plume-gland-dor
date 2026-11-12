'use strict';
/* Données étendues : régions, clans, unités, avant-postes, actes II à V */
const BIO=[
 {n:'Plaine de Cancan-les-Bains',x:0,z:40,c:[.36,.66,.23],t:[.45,.78,.26],g:1,sky:0x9fd4f2,lv:1,mobs:['brigand','oie','renard']},
 {n:'Forêt des Glands',x:-190,z:0,c:[.20,.44,.17],t:[.27,.56,.21],g:.85,sky:0x8fc9b6,lv:3,mobs:['brigand','frondeur','renard','frondeur','chaman']},
 {n:'Collines Dorées',x:-80,z:210,c:[.70,.60,.22],t:[.86,.74,.27],g:.9,sky:0xf2d7a2,lv:6,mobs:['sanglier','frondeur','oie','jars','brigand']},
 {n:'Marais Brumeux',x:200,z:110,c:[.24,.36,.27],t:[.33,.48,.33],g:.7,sky:0x86a09c,lv:9,mobs:['chaman','oie','brigand','jars','frondeur']},
 {n:'Monts Givrés',x:-40,z:-210,c:[.66,.72,.84],t:[.9,.95,1],g:0,sky:0xd9e8f6,lv:12,mobs:['oie','frondeur','sanglier','chaman','jars']},
 {n:'Terres de Cendre',x:175,z:-150,c:[.27,.21,.21],t:[.3,.24,.24],g:0,sky:0x6e4f4a,lv:15,mobs:['jars','chaman','brigand','sanglier','frondeur']},
 {n:'Bois Roux',x:120,z:300,c:[.55,.36,.16],t:[.86,.50,.18],g:.85,sky:0xe9b98a,lv:18,mobs:['renard','renard','sanglier','frondeur','chaman']},
 {n:'Pics Noirs',x:-270,z:-190,c:[.30,.32,.40],t:[.42,.47,.55],g:.2,sky:0x59607a,lv:22,mobs:['jars','oiearc','oiemage','oie','jars']}];
const FUR=['#b5651d','#8a4b22','#c98a2b','#5d6b4a','#cfd6dc','#4a2f2f','#a8482a','#3a3a44'],FEA=['#d9d2c2','#cfc8b0','#e6d9a8','#6f7a6a','#f4f8ff','#5a4040','#e0c8a8','#2e2e38'];
const VIL=[{n:'Cancan-les-Bains',x:0,z:40,clan:'lac',st:'cot',w:'#f4efe6',r:'#3f7fd0'},{n:'Saint-Gland-des-Prés',x:-190,z:0,clan:'glands',st:'tree',w:'#a5713c',r:'#3f7a34'},{n:'Pain-Perdu',x:-80,z:205,clan:'dore',st:'farm',w:'#f0dca0',r:'#c9762b'},{n:'La Grande-Gadoue',x:195,z:105,clan:'brumes',st:'stilt',w:'#6f7f6a',r:'#2f6a6a'},{n:'Refuge du Glagla',x:-40,z:-205,clan:'givre',st:'igloo',w:'#e4eef6',r:'#9fc4e0'},{n:'Camp des Pieds-Palmés',x:150,z:-115,clan:'lac',st:'tent',w:'#8a6f5a',r:'#3f7fd0',small:1},{n:'Goupil-la-Combine',x:120,z:300,clan:'roux',st:'den',w:'#8a4a2a',r:'#d9542b'},{n:'Bivouac des Becs-Givrés',x:-205,z:-150,clan:'givre',st:'tent',w:'#6a7080',r:'#9fc4e0',small:1}];
const CLAN={
 lac:{n:'Clan du Lac',c:'#3f7fd0',unit:'garde',bonus:'+10 % de vie',home:'Cancan-les-Bains'},
 glands:{n:'Clan des Glands',c:'#4c9a3a',unit:'archer',bonus:"+10 % d'attaque",home:'Saint-Gland-des-Prés'},
 dore:{n:'Clan Doré',c:'#e0a020',unit:'lancier',bonus:"+25 % d'or gagné",home:'Pain-Perdu'},
 brumes:{n:'Clan des Brumes',c:'#2fa39a',unit:'soigneur',bonus:'magie régénérée deux fois plus vite',home:'La Grande-Gadoue'},
 givre:{n:'Clan du Givre',c:'#9fd4ff',unit:'sauteur',bonus:'+15 % de défense',home:'Refuge du Glagla'},
 roux:{n:'Clan des Crocs-Roux',c:'#d9542b',unit:'rodeur',bonus:'coups critiques deux fois plus fréquents',home:'Goupil-la-Combine'}};
const FACTION={casse:{n:'Horde Casse-Noix',c:'#7a3fb0',mobs:['brigand','frondeur','chaman','jars','brigand']},roux:{n:'Renégats des Crocs',c:'#a02a1a',mobs:['renard','renard','frondeur','sanglier']},noires:{n:'Légion des Plumes Noires',c:'#1c1c24',mobs:['jars','oiearc','oiemage','oie','jars']}};
const UNIT={
 garde:{n:'Garde-jars',clan:'lac',m:'go',ai:'melee',hp:1.8,dm:.8,sp:12,o:{armor:1,shield:1}},
 archer:{n:'Archer-écureuil',clan:'glands',m:'sq',ai:'ranged',hp:.85,dm:1,sp:12,o:{bow:1}},
 lancier:{n:'Lancière dorée',clan:'dore',m:'go',ai:'melee',hp:1.15,dm:1.25,sp:12.5,o:{spear:1}},
 soigneur:{n:'Guérisseur des brumes',clan:'brumes',m:'sq',ai:'heal',hp:.85,dm:.5,sp:12,o:{staff:1}},
 sauteur:{n:'Oie des neiges',clan:'givre',m:'go',ai:'leap',hp:1,dm:1.3,sp:13,o:{}},
 rodeur:{n:'Rôdeur roux',clan:'roux',m:'qd',ai:'melee',hp:.95,dm:1.5,sp:15,o:{fox:1}}};
const NAMES=['Barnabé','Colette','Firmin','Odette','Anselme','Perrine','Gustave','Léonie','Achille','Suzon','Baptiste','Margot','Théodule','Ninon','Hector','Bertille','Octave','Rosalie','Mathurin','Zélie','Fulbert','Agathe','Isidore','Clotilde'];
const FORT={ // nom, x, z, niveau, faction
 f1:['Tour du Gué',95,20,4,'casse'],f2:['Palissade des Chênes',-150,-70,6,'casse'],f3:['Fortin des Moissons',-20,255,9,'casse'],f4:['Bastion des Roseaux',255,160,12,'casse'],f5:['Redoute du Col',40,-170,15,'casse'],
 f6:['Fort des Braises',225,-90,18,'casse'],f7:['Camp des Crocs',60,330,20,'roux'],f8:['Poste de la Ravine',190,260,21,'roux'],f9:['Aire des Vautours',-225,-140,23,'noires'],f10:['Bastion des Tempêtes',-300,-150,25,'noires']};
Object.assign(IT,{croc:['Croc-de-Sève','w',9,88,0,0,8],tempete:['Lance des tempêtes','w',10,98,0,0,16],aube:["Lame de l'Aube",'w',11,116,0,0,26],
 ecorce:["Armure d'écorce rousse",'a',9,0,38,260,0],legion:['Cuirasse des Plumes Noires','a',10,0,46,320,8],
 coiffecroc:['Coiffe du Vieux Croc','h',9,8,18,180,6],aigrette:['Aigrette impériale','h',11,10,22,230,18]});
Object.assign(ET,{
 oiearc:{n:'Arbalétrière noire',m:'go',ai:'ranged',hp:.85,dm:1,sp:9,o:{bow:1,scarf:'#7a1f2a'}},
 oiemage:{n:'Sorcière des tempêtes',m:'go',ai:'mage',hp:.85,dm:1.35,sp:8,o:{scarf:'#7d3cff',staffG:1}},
 b_croc:{n:'Griffe-Mère, la Bête des Racines',m:'qd',ai:'boss',hp:16,dm:1.5,sp:12,sc:2.5,pat:['leap','melee','leap','triple','nova'],sum:'renard',col:'#7a2a14',o:{fox:1}},
 b_bernache:{n:'Générale Bernache',m:'go',ai:'boss',hp:22,dm:1.6,sp:10,sc:2.4,pat:['triple','leap','rain','nova','leap','melee','rain'],sum:'oiearc',col:'#1c1c24',o:{armor:1,scarf:'#c0392b',crownG:1}}});
Object.assign(NPCD,{
 rec0:['Sergente Aigrette (recrutement)','go','#f0f0f0',0,-12,-5,'recruit',{armor:1,tab:'#3f7fd0'}],
 rec1:['Caporal Faîne (recrutement)','sq','#8a4b22',1,-11,5,'recruit',{bandana:'#4c9a3a',bow:1}],
 rec2:['Adjudante Chaume (recrutement)','go','#f4e2b0',2,10,5,'recruit',{spear:1,tab:'#e0a020'}],
 rec3:['Veilleur Sphaigne (recrutement)','sq','#6b7a5a',3,-10,-5,'recruit',{staff:1,bandana:'#2fa39a'}],
 rec4:['Cheffe de cordée Névé (recrutement)','go','#f4f8ff',4,9,-5,'recruit',{scarf:'#9fd4ff'}],
 vieuxcroc:['Vieux Croc','qd','#b8522a',6,0,-8,0,{fox:1,tab:'#ffd24a'},"La meute se souvient de ceux qui tiennent parole."],
 braise:['Renarde Braise','qd','#d9702b',6,8,0,0,{fox:1},"Tu marches bruyamment, pour une chasseuse."],
 petitroux:['Petit Roux','qd','#e88a3a',6,-8,2,0,{fox:1},"Un jour, j'aurai des ailes moi aussi !"],
 aub7:['Mère Fougère (tanière-auberge)','qd','#c9602b',6,-5,9,'inn',{fox:1}],forge7:['Rogne-Fer (forgeron)','qd','#7a3a1a',6,7,8,'smith',{fox:1}],
 rec6:['Meneuse Fauve (recrutement)','qd','#d9542b',6,-11,-4,'recruit',{fox:1,tab:'#d9542b'}],
 harfang:['Capitaine Harfang','go','#f4f8ff',7,0,-4,0,{armor:1,scarf:'#9fd4ff'},"Le vent des Pics porte l'odeur de la poudre. Tiens-toi prête."],
 aub8:['Cantinière Givrelle (bivouac)','go','#e8f0ff',7,5,4,'inn',{}]});
Object.assign(DUN,{
 d9:['Terrier des Mille Racines',75,275,21,120,[['renard',6],['sanglier',4],['chaman',3],['frondeur',3]],'b_croc','#5a3520','m11'],
 d10:['Nid-Noir',-275,-225,25,140,[['jars',6],['oiearc',5],['oiemage',5],['oie',3]],'b_bernache','#1e1e2a','m14'],
 d11:['Crypte des Cristaux',-245,-95,23,110,[['oiemage',5],['jars',4],['oiearc',4]],null,'#2a3350']});
// l'histoire continue après le Baron
(function(){const m9=QL.find(q=>q.id==='m9'),m10=QL.find(q=>q.id==='m10'),m8=QL.find(q=>q.id==='m8');m9.pre='m8b';
 m8.e=["La forge est froide. Il ne reste que le donjon. Mais tu n'iras pas seule : la Doyenne Cacarde convoque un conseil de guerre."];
 m10.e=["Le Gland d'Or est de retour ! Oies et écureuils, unis.","Mais… regarde. Une fêlure court sur l'écorce d'or. Rapporte-le vite à la Doyenne Cacarde."];})();
QL.push(
 {id:'m8b',m:1,n:'Le Conseil de guerre',g:'cacarde',pre:'m8',lv:15,i:["Le Baron s'est retranché, et ses avant-postes tiennent les routes. On ne gagne pas une guerre seule, Plume.","Scelle des alliances : aide les clans jusqu'à devenir leur Alliée. Reprends des avant-postes à la Horde. Et lève une troupe : les sergents recruteurs des villages t'attendent."],
  s:[['cond','ally2',"Deviens Alliée (réputation 50) de 2 clans"],['cond','forts2',"Capture 2 avant-postes ennemis"],['cond','army4',"Rassemble une armée de 4 soldats"]],e:["Deux clans, deux forts, une troupe. Voilà une cheffe de guerre. Le conseil te suit."],it:'couronne'},
 {id:'m11',m:1,n:'Le Gland fêlé',g:'cacarde',pre:'m10',lv:19,ret:'vieuxcroc',i:["Le Gland est revenu… mais fêlé. Son cœur, la Graine d'Aube, a disparu. Sans elle, il se ternira avant l'hiver.","Un prisonnier jure que le Baron l'a vendue aux Crocs-Roux, les renards du Bois Roux, au sud-est. Ils n'aiment ni les oies ni les écureuils. Sois prudente."],
  s:[['goto',150,238,["La lisière du Bois Roux. Des yeux brillent entre les troncs… « Demi-tour, la volaille ! »"]],['spawn',150,238,[['renard',19,4],['frondeur',19,2]]],['talk','vieuxcroc',["Tu as rossé mes sentinelles. Bien. Ici, on n'écoute que ceux qui savent mordre.","La Graine ? Je l'ai eue entre les pattes. Mais on ne parle pas d'affaires avec une étrangère."]]],e:["Reste, si tu l'oses. La meute te jugera."]},
 {id:'m12',m:1,n:'La loi des Crocs',g:'vieuxcroc',pre:'m11',lv:20,i:["Deux épreuves. La première : bats Griffe-Vive, ma championne, dans la clairière à l'ouest.","La seconde : une bête a volé le totem de la meute et s'est terrée dans le Terrier des Mille Racines. Rapporte-le."],
  s:[['spawn',100,322,[['renard',21,1,1]]],['dungeon','d9']],e:["Le totem ! Et Griffe-Vive boite encore. Tu es de la meute, Plume. Les Crocs-Roux marcheront avec toi.","Prends ce croc. Il a mordu plus fort que toi… jusqu'à aujourd'hui."],it:'croc',rep:['roux',50]},
 {id:'m13',m:1,n:"La Graine d'Aube",g:'vieuxcroc',pre:'m12',lv:22,ret:'harfang',i:["La vérité, maintenant. La Graine, je l'ai revendue. À une oie noire, bardée de fer : la Générale Bernache, de la Légion des Plumes Noires.","Elle la garde à Nid-Noir, dans les Pics, tout au nord-ouest. C'est elle qui armait le Baron depuis le début. Le Clan du Givre tient un bivouac là-haut : trouve la Capitaine Harfang."],
  s:[['talk','harfang',["Plume ? On m'a parlé de toi jusqu'ici. La Légion tient deux bastions devant Nid-Noir. Tant qu'ils sont debout, personne ne passe."]]],e:["Installe-toi au bivouac. La dernière guerre commence ici."],it:'ecorce'},
 {id:'m14',m:1,n:'La marche des clans',g:'harfang',pre:'m13',lv:23,i:["Nid-Noir ne tombera que devant tout le royaume. Il nous faut des territoires, des alliés, des soldats.","Quand tout sera prêt, nous briserons la garde de la citadelle, au sud-ouest du bivouac."],
  s:[['cond','forts6',"Contrôle 6 avant-postes"],['cond','ally4',"Sois Alliée de 4 clans"],['cond','army6',"Rassemble une armée de 6 soldats"],['spawn',-262,-205,[['jars',24,3],['oiearc',24,3],['oiemage',24,2]]],['spawn',-262,-205,[['jars',25,2,1],['oie',25,3],['oiemage',25,2]]]],e:["La garde est brisée. Les clans tiennent la brèche. Il ne reste que la Générale."],it:'tempete'},
 {id:'m15',m:1,n:'Nid-Noir',g:'harfang',pre:'m14',lv:25,i:["La Générale Bernache t'attend au sommet de Nid-Noir, la Graine d'Aube à son cou. Finis-en, Plume. Pour le lac, la forêt, et tous les autres."],s:[['dungeon','d10']],e:["La Graine d'Aube ! Elle est tiède… et elle chante. Le Gland d'Or est sauvé, et le royaume avec lui."],it:'aube'},
 // ── Clan du Lac
 {id:'l1',n:'Manœuvres sur la rive',g:'rec0',lv:4,i:["Une cheffe sans troupe, c'est un bec sans oie. Dès que le Clan du Lac te fera confiance (réputation 20), recrute un soldat auprès de moi.","Puis emmène-le dérouiller les brigands qui campent à l'ouest du lac."],s:[['cond','army1',"Recrute un soldat (auprès d'un sergent recruteur)"],['spawn',-32,64,[['brigand',4,4]]]],e:["Pas mal ! Tes soldats suivent, frappent et encaissent. S'ils tombent, une nuit à l'auberge les remet sur pattes."]},
 {id:'l2',n:'Le monstre du lac',g:'gaspard',pre:'s3',lv:8,i:["Je l'ai vu ! Un jars énorme, sorti de la vase, au sud du lac. Il a avalé ma canne à pêche !"],s:[['spawn',40,140,[['jars',9,1,1],['oie',8,2]]]],e:["Ma canne ! Un peu mâchouillée, mais elle est là."]},
 {id:'l3',n:'La Tour du Gué',g:'cacarde',pre:'m3',lv:5,i:["La Horde a planté une tour au gué, à l'est. De là, elle rançonne toute la plaine. Reprends-la : ce sera notre premier territoire."],s:[['cond','f1',"Capture la Tour du Gué"]],e:["Notre bannière flotte sur le gué ! Chaque avant-poste repris rapporte de l'or… mais l'ennemi tentera de le reprendre."],it:'noix'},
 {id:'l4',n:'Le festin des clans',g:'brioche',pre:'s1',lv:10,i:["Je prépare un festin pour sceller l'amitié des clans. Il me faut la farine de la fermière Tournesol, les noisettes de Mamie Châtaigne et les herbes de Vieille Brume."],s:[['talk','fermiere',["De la farine pour Brioche ? Prends, et dis-lui que je viens !"]],['talk','mamie',["Mes meilleures noisettes. Ne les grignote pas en route."]],['talk','vieille',["Des herbes de brume. Elles donnent des rêves… intéressants."]]],e:["Tout y est ! Ce soir, oies, écureuils, tout le monde à la même table."]},
 // ── Clan des Glands
 {id:'g1',n:'Les racines du royaume',g:'reine',pre:'m4',lv:7,i:["La Horde a dressé une palissade au nord-est de la forêt. Mes patrouilles n'osent plus sortir. Rase-la."],s:[['cond','f2',"Capture la Palissade des Chênes"]],e:["La forêt respire. Saint-Gland-des-Prés te doit une fière chandelle."]},
 {id:'g2',n:'Patrouille mixte',g:'pignon',pre:'s9',lv:9,i:["Une troupe d'oies ET d'écureuils ? Je veux voir ça. Viens avec trois soldats et nettoie le bois de l'ouest."],s:[['cond','army3',"Rassemble 3 soldats"],['spawn',-228,-8,[['brigand',9,3],['frondeur',9,3]]],['spawn',-228,-8,[['chaman',10,2],['jars',10,1,1]]]],e:["Je retire tout ce que j'ai dit sur les palmipèdes."]},
 {id:'g3',n:"L'école des écureuils",g:'amande',pre:'s8',lv:8,i:["Les petits ont semé leurs ardoises en fuyant les brigands, au sud-est du village. Tu veux bien les ramasser ?"],s:[['collect',-170,45,6,'Ardoise'],['talk','mamie',["C'est moi la maîtresse, oui. Merci, ma grande. Ils n'ont plus d'excuse pour la dictée."]]],e:["Queue-Rousse dit qu'il préférait quand elles étaient perdues."]},
 {id:'g4',n:'La noisette géante',g:'mamie',pre:'s10',lv:11,i:["On raconte qu'une noisette grosse comme une maison a roulé au sud-ouest. Va voir si c'est vrai. Et si ça se mange."],s:[['goto',-255,62,["Ce n'est pas une noisette. C'est rond, c'est brun… et ça grogne."]],['spawn',-255,62,[['sanglier',12,1,1]]]],e:["Un sanglier roulé en boule ? Dommage. J'avais sorti le casse-noix."]},
 // ── Clan Doré
 {id:'o1',n:'Le Fortin des Moissons',g:'capitaine',pre:'m5',lv:9,i:["Ils ont fortifié nos greniers, au sud-est du bourg. Notre blé nourrit la Horde ! Reprends le fortin."],s:[['cond','f3',"Capture le Fortin des Moissons"]],e:["Le blé rentre à la maison. Tu as gagné l'estime du Clan Doré."]},
 {id:'o2',n:'Le moulin tourne',g:'meunier',pre:'s13',lv:10,i:["Pour relancer le vieux moulin, il me faut 5 engrenages. Ils traînent au nord du bourg, là où les frondeurs les ont jetés."],s:[['collect',-45,150,5,'Engrenage'],['spawn',-45,150,[['frondeur',10,4]]]],e:["Écoute-moi ce grincement. De la musique."]},
 {id:'o3',n:'La fête des moissons',g:'fermiere',pre:'s12',lv:11,i:["La fête, c'est demain ! Invite Pistache le marchand et la Reine Noisette. Sans eux, pas de stands ni de discours."],s:[['talk','pistache',["Une fête ? Avec des clients ? J'arrive."]],['talk','reine',["Une reine ne refuse pas une tarte aux pommes. Dis-lui que je viendrai."]]],e:["Ils viennent ? Tous ? Il va falloir plus de tartes."]},
 {id:'o4',n:'La charge dorée',g:'capitaine',pre:'o1',lv:14,i:["La Horde masse des troupes à l'est du bourg. Je veux une charge, une vraie : viens avec cinq soldats."],s:[['cond','army5',"Rassemble 5 soldats"],['spawn',-10,200,[['brigand',14,4],['frondeur',14,3]]],['spawn',-10,200,[['jars',15,2],['chaman',14,2],['sanglier',15,2]]]],e:["Quelle charge ! On en fera une chanson."],it:'cape'},
 // ── Clan des Brumes
 {id:'b1',n:'Le Bastion des Roseaux',g:'herbo',pre:'m6',lv:12,i:["Le bastion du sud-est empoisonne nos eaux. Tant qu'il tient, le marais se meurt."],s:[['cond','f4',"Capture le Bastion des Roseaux"]],e:["L'eau s'éclaircit déjà. Le Clan des Brumes n'oubliera pas."]},
 {id:'b2',n:'Contrebande',g:'passeur',pre:'s18',lv:13,i:["Des brigands font passer des armes par le nord du marais. Surprends-les."],s:[['goto',240,62,["Des caisses marquées du sceau du Baron… et des bruits de pas."]],['spawn',240,62,[['brigand',13,4],['jars',13,1]]]],e:["Leurs caisses feront un excellent ponton."]},
 {id:'b3',n:'Les esprits de la brume',g:'vieille',pre:'s17',lv:13,i:["Des esprits-lucioles se sont égarés au sud-ouest. Un chaman les retient. Libère-les."],s:[['collect',150,150,6,'Esprit-luciole'],['spawn',150,150,[['chaman',14,1,1],['chaman',13,2]]]],e:["Ils dansent de nouveau. Regarde."]},
 {id:'b4',n:'Remède de guerre',g:'herbo',pre:'b1',lv:15,i:["Une armée a besoin de remèdes. Cueille 5 racines amères à l'est, puis porte-les au Veilleur Sphaigne."],s:[['collect',240,112,5,'Racine amère'],['talk','rec3',["Des racines amères ! Nos guérisseurs vont pouvoir suivre ta troupe."]]],e:["Nos guérisseurs sont les meilleurs du royaume. Recrutes-en un."]},
 // ── Clan du Givre
 {id:'v1',n:'La Redoute du Col',g:'guide',pre:'m7',lv:15,i:["La redoute à l'est du refuge coupe la route des Cimes. Avec elle, nous tenons tout le nord."],s:[['cond','f5',"Capture la Redoute du Col"]],e:["Le col est libre ! Le Clan du Givre grimpera avec toi."]},
 {id:'v2',n:'La grande glissade',g:'gamin',pre:'s21',lv:15,i:["J'ai tracé une piste de glissade ! Passe par les trois fanions, et tu seras championne des Cimes."],s:[['goto',-70,-240,["Premier fanion ! Ça glisse…"]],['goto',-10,-262,["Deuxième fanion ! Encore plus vite !"]],['goto',20,-215,["Troisième fanion ! Atterrissage… approximatif."]]],e:["Championne des Cimes ! Enfin, après moi."]},
 {id:'v3',n:'Les cristaux chantants',g:'ermite',pre:'s20',lv:16,i:["Hmf. Mes cristaux chantants. Une oie géante couve dessus, tout à l'ouest. Elle chante faux, en plus."],s:[['spawn',-150,-250,[['oie',17,1,1],['oie',16,2]]],['collect',-150,-250,5,'Cristal chantant']],e:["Hmf. Ils sont accordés. Toi aussi, presque."]},
 {id:'v4',n:'Cordée de guerre',g:'guide',pre:'v1',lv:17,i:["Une colonne de la Horde monte par le versant est. Viens avec six soldats : on les cueille au sommet."],s:[['cond','army6',"Rassemble 6 soldats"],['spawn',62,-205,[['jars',17,3],['frondeur',17,3]]],['spawn',62,-205,[['chaman',18,3],['sanglier',18,2],['jars',18,1,1]]]],e:["Pas un n'est passé. Belle cordée."],it:'heaume'},
 // ── Cendres
 {id:'w1',n:'Le Fort des Braises',g:'eclaireur',pre:'s24',lv:18,i:["Le Fort des Braises, à l'est, est la dernière forteresse de la Horde. Fais-le tomber et le Baron n'aura plus d'arrière-garde."],s:[['cond','f6',"Capture le Fort des Braises"]],e:["La Horde n'a plus que son donjon. Bravo."]},
 {id:'w2',n:'Les restes de la horde',g:'eclaireur',pre:'m10',lv:19,i:["Le Baron est tombé, mais ses lieutenants pillent encore au nord-est du camp. Trois bandes."],s:[['spawn',200,-118,[['brigand',19,4],['frondeur',19,2]]],['spawn',200,-118,[['chaman',19,3],['jars',19,2]]],['spawn',200,-118,[['jars',20,1,1],['sanglier',20,2]]]],e:["Les cendres retombent enfin."]},
 // ── Crocs-Roux
 {id:'r1',n:'Chasse au clair de lune',g:'braise',pre:'m12',lv:21,i:["Un vieux sanglier terrorise le sud du bois. Il a encorné trois chasseurs. Montre-moi ce que vaut une oie."],s:[['spawn',160,335,[['sanglier',22,1,1],['sanglier',21,3]]]],e:["Hm. Pas mal. Pour une oie."]},
 {id:'r2',n:'La balle perdue',g:'petitroux',pre:'m12',lv:21,i:["J'ai perdu mes quatre balles en jouant à l'ouest de la tanière ! Maman va me tirer les oreilles."],s:[['collect',90,272,4,'Balle de cuir']],e:["Mes balles ! Tu veux jouer ? Tu fais le but."]},
 {id:'r3',n:'Les renégats',g:'braise',pre:'r1',lv:22,i:["Des renards ont refusé la paix. Ils tiennent le Camp des Crocs, à l'ouest. Ils font honte à la meute."],s:[['cond','f7',"Capture le Camp des Crocs"]],e:["La meute n'a qu'une parole. Maintenant, eux aussi."],it:'coiffecroc'},
 {id:'r4',n:'La Ravine',g:'vieuxcroc',pre:'m12',lv:22,i:["Le Poste de la Ravine, au nord-est, garde notre frontière… pour les renégats. Reprends-le pour la meute."],s:[['cond','f8',"Capture le Poste de la Ravine"]],e:["La frontière est sûre. Tu chasses bien, Plume."]},
 {id:'r5',n:'Meute et volée',g:'rec6',pre:'m12',lv:22,i:["Un rôdeur roux dans une troupe d'oies ? Essaie donc. Recrute-en un, puis lâche-le sur les pillards au nord du bois."],s:[['cond','unit:rodeur',"Recrute un Rôdeur roux"],['spawn',118,250,[['renard',22,4],['frondeur',22,3]]]],e:["Tu vois ? Rien ne mord comme un Croc-Roux."]},
 // ── Pics Noirs
 {id:'p1',n:"L'Aire des Vautours",g:'harfang',pre:'m13',lv:23,i:["Premier verrou : l'Aire des Vautours, juste à l'ouest du bivouac. Leurs arbalétrières nous clouent au sol."],s:[['cond','f9',"Capture l'Aire des Vautours"]],e:["Un verrou de moins."]},
 {id:'p2',n:'Le Bastion des Tempêtes',g:'harfang',pre:'p1',lv:25,i:["Second verrou : le Bastion des Tempêtes, plus à l'ouest. Le mieux gardé du royaume."],s:[['cond','f10',"Capture le Bastion des Tempêtes"]],e:["Les deux bastions sont à nous. Nid-Noir est nu."],it:'legion'},
 {id:'p3',n:'La Crypte des Cristaux',g:'harfang',pre:'m13',lv:23,i:["Les sorcières de la Légion tirent leur magie d'une crypte, au sud du bivouac. Tarir la source les affaiblirait."],s:[['dungeon','d11']],e:["Leurs éclairs faiblissent. Bien joué."],it:'aigrette'},
 {id:'p4',n:'Éclaireurs perdus',g:'harfang',pre:'m13',lv:24,i:["Deux de mes éclaireurs ne sont pas rentrés. Suis leurs traces, vers le nord."],s:[['goto',-235,-205,["Un sac abandonné, des plumes blanches… et des traces de lutte."]],['goto',-200,-235,["Des voix étouffées, derrière les rochers."]],['spawn',-200,-235,[['jars',24,3],['oiearc',24,2]]]],e:["Vivants, tous les deux ! Je te dois deux soldats."]});
const QBY={};QL.forEach(q=>QBY[q.id]=q);
