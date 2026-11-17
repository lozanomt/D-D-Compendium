'use strict';
const assert=require('node:assert/strict'),R=require('./lib/character-rules.js'),fixture=require('./tests/legacy-monk-cleric.json');
const raw=JSON.parse(JSON.stringify(fixture)),char=R.effectiveCharacter(raw),stats=R.stats(char),m=R.metrics(char,stats);
assert.equal(stats.dex,17,'Selected lineage bonus applies even with isGranted=false');assert.equal(m.ac,15);assert.equal(m.speed,40);assert.equal(m.saves.wis,2);assert.equal(m.saves.cha,-1);assert.equal(m.saves.str,1);assert.equal(m.saves.dex,5);
assert.equal(m.unarmedAttack,5);assert.equal(m.martialDie,'1d4');assert.equal(m.unarmedBonus,3);
assert(R.activeFeatures(char).some(f=>f.definition.name==='Hand of Healing'));assert(!R.activeFeatures(char).some(f=>f.definition.name==='Hand of Ultimate Mercy'));assert(!R.activeFeatures(char).some(f=>f.definition.name==='Channel Divinity'));
assert.equal(char.feats.length,1);assert.equal(char.classSpells[0].spells.filter(s=>s.definition.name==='Bless').length,1);assert(char.classSpells[0].spells.find(s=>s.definition.name==='Cure Wounds').alwaysPrepared);
assert.equal(raw.classSpells.length,0,'Deriving a view does not mutate the source spell array');
const armoredRaw=JSON.parse(JSON.stringify(raw));armoredRaw.inventory=[{id:50,equipped:false,quantity:1,definition:{name:'Leather',canEquip:true,armorTypeId:1,armorClass:11}}];
let armored=R.effectiveCharacter(armoredRaw,{'50':true});assert.equal(R.metrics(armored).ac,14);assert.equal(R.metrics(armored).speed,30);assert.equal(R.metrics(armored).canMartial,false);
assert.equal(R.metrics(R.effectiveCharacter(armoredRaw,{'50':false})).ac,15);
const unarmed=R.actionList(char).find(a=>a.id==='basic-unarmed');assert.equal(unarmed.attack,5);assert.equal(unarmed.dice,'1d4');assert.equal(unarmed.bonus,3);
const saveSpell={source:'class',sourceId:raw.classes[1].id,spell:{definition:{name:'Word of Radiance',level:0,requiresSavingThrow:true,saveDcAbilityId:3,requiresAttackRoll:false}}};const info=R.spellInfo(char,saveSpell);assert.equal(info.dc,12);assert.equal(info.save,'CON');assert.equal(info.requiresAttack,false);
const healing={source:'class',sourceId:raw.classes[1].id,spell:{definition:{name:'Cure Wounds',level:1,description:'A creature regains 1d8 hit points. At higher levels, healing increases by 1d8 per slot level.'}}};assert.equal(R.spellInfo(char,healing).bonus,5);assert.equal(R.spellInfo(char,healing,stats,2).dice,'2d8');assert.equal(R.spellInfo(char,healing,stats,2).bonus,6);
assert.equal(R.legacy(char),true);console.log('PASS: live-matching AC/speed/saves/Martial Arts; armor transitions; class levels; domain-spell merging; save DCs; healing/upcasting; source immutability; placeholder filtering.');

assert.equal(R.halfHitDiceRecovery(char),true);assert.equal(R.halfHitDiceRecovery({...char,preferences:{longRestType:2}}),false);assert.equal(R.halfHitDiceRecovery({...char,preferences:{longRestType:1}}),true);console.log('PASS: explicit DDB rest preference takes precedence over class edition.');
