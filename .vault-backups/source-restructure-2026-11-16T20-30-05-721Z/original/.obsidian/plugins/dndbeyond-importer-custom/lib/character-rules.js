'use strict';
const ABILITIES=['str','dex','con','int','wis','cha'];
const ABILITY_NAMES=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
const mod=n=>Math.floor((Number(n)-10)/2);
const signed=n=>Number(n)>=0?'+'+n:String(n);
const text=html=>String(html||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|li|tr|h[1-6])>/gi,'\n').replace(/<\/(?:td|th)>/gi,'  ').replace(/<li[^>]*>/gi,'• ').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/\[\/?(?:action|condition|spell|skill|sense|rule|item|weapon|monster)\]/gi,'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
const slug=s=>String(s||'unknown').toLowerCase().replace(/\s+/g,'-');
function legacy(char) {
  const classes=char.classes||[];
  return classes.length>0 && classes.every(c=>(c.definition?.sources||[]).some(s=>[1,2].includes(s.sourceId)) || c.definition?.isLegacy===true);
}
function halfHitDiceRecovery(char) {
  if(char.preferences?.longRestType===1)return true;
  if(char.preferences?.longRestType===2)return false;
  return legacy(char);
}
function activeFeatures(char) {
  return (char.classes||[]).flatMap(c=>(c.classFeatures||[]).filter(f=>f.definition && !f.definition.hideInSheet && (f.definition.requiredLevel||0)<=c.level).map(f=>({...f,classId:c.id,className:c.definition?.name,subclass:c.subclassDefinition?.name,level:c.level})));
}
function effectiveCharacter(raw,equipment={},state={}) {
  const char={...raw};const features=activeFeatures(raw),active=new Set(features.map(f=>f.definition.id));
  const future=new Set((raw.classes||[]).flatMap(c=>(c.classFeatures||[]).filter(f=>(f.definition?.requiredLevel||0)>c.level).map(f=>f.definition.id)));
  const secondaryProf=new Set((raw.classes||[]).filter(c=>c.isStartingClass===false).flatMap(c=>(c.classFeatures||[]).filter(f=>f.definition?.name==='Proficiencies').map(f=>f.definition.id)));
  char.inventory=(raw.inventory||[]).filter(Boolean).map(item=>({...item,equipped:equipment[item.id]??equipment[slug(item.definition?.name)]??item.equipped,isAttuned:state.attuned?.[item.id]??item.isAttuned,quantity:state.quantities?.[item.id]??item.quantity}));
  const activeItems=new Set(char.inventory.filter(i=>i.equipped&&(!i.definition?.canAttune||i.isAttuned)).map(i=>i.id));
  char.modifiers=Object.fromEntries(Object.entries(raw.modifiers||{}).map(([source,list])=>[source,(list||[]).filter(m=>{
    if(!m)return false;
    if(source==='class' && future.has(m.componentId)&&!active.has(m.componentId))return false;
    if(source==='class' && secondaryProf.has(m.componentId)&&m.availableToMulticlass===false)return false;
    if(source==='item' && m.componentTypeId===1439493548 && !activeItems.has(m.componentId))return false;
    return true;
  })]));
  char.feats=(raw.feats||[]).filter(f=>f?.definition && !(f.definition.categories||[]).some(t=>t.tagName==='__DISGUISE_FEAT'));
  char.classSpells=(raw.classSpells||[]).map(group=>({...group,spells:(group.spells||[]).filter(s=>s?.definition).map(s=>({...s}))}));
  for(const supplement of raw._customSupplement?.classes||[]) {
    const c=(raw.classes||[]).find(c=>c.id===supplement.characterClassId);if(!c||c.level!==supplement.level)continue;
    let group=char.classSpells.find(g=>g.characterClassId===c.id);if(!group){group={characterClassId:c.id,spells:[]};char.classSpells.push(group);}
    const present=new Map(group.spells.map(s=>[s.definition.id,s]));
    for(const s of [...(supplement.prepared||[]),...(supplement.known||[])]) {
      if(!s?.definition)continue;const existing=present.get(s.definition.id);
      if(existing){if(s.alwaysPrepared)existing.alwaysPrepared=true;continue;}
      const incoming={...s,prepared:false};group.spells.push(incoming);present.set(s.definition.id,incoming);
    }
  }
  char.spells=Object.fromEntries(Object.entries(raw.spells||{}).map(([k,v])=>[k,(v||[]).filter(s=>s?.definition)]));
  char.actions=Object.fromEntries(Object.entries(raw.actions||{}).map(([source,list])=>[source,(list||[]).filter(a=>{
    if(!a)return false;
    if(source==='class'&&a.componentId&&a.componentTypeId===12168134&&!active.has(a.componentId))return false;
    return true;
  })]));
  char.classFeatures=features;
  return char;
}
function modifiers(char){return Object.values(char.modifiers||{}).flat().filter(Boolean);}
function stats(char) {
  const all=modifiers(char);return Object.fromEntries(ABILITIES.map((key,i)=>{
    const override=char.overrideStats?.find(s=>s.id===i+1)?.value;
    const base=char.stats?.find(s=>s.id===i+1)?.value??10;
    const bonus=(char.bonusStats||[]).filter(s=>s.id===i+1).reduce((n,s)=>n+Number(s.value||0),0)+all.filter(m=>m.type==='bonus'&&m.subType===ABILITY_NAMES[i].toLowerCase()+'-score').reduce((n,m)=>n+Number(m.value||0),0);
    return [key,override??base+bonus];
  }));
}
function metrics(char,scores=stats(char)) {
  const all=modifiers(char),dex=mod(scores.dex),wis=mod(scores.wis);
  const armor=char.inventory.filter(i=>i.equipped&&i.definition?.armorClass&&i.definition.armorTypeId!==4),shields=char.inventory.filter(i=>i.equipped&&i.definition?.armorTypeId===4);
  let ac=10+dex;
  if(armor.length)ac=Math.max(...armor.map(i=>{const d=i.definition;return d.armorClass+(d.armorTypeId===3?0:d.armorTypeId===2?Math.min(2,dex):dex);}));
  else for(const m of all){
    if(m.subType==='unarmored-armor-class'&&m.type==='set'&&m.statId && (!shields.length || !(char.classes||[]).some(c=>c.definition?.name==='Monk')))ac=Math.max(ac,10+dex+mod(scores[ABILITIES[m.statId-1]]));
    if(m.subType==='unarmored-defense-wisdom'&&!shields.length)ac=Math.max(ac,10+dex+wis);
    if(m.subType==='unarmored-defense-constitution')ac=Math.max(ac,10+dex+mod(scores.con));
    if(m.type==='set'&&m.subType==='unarmored-armor-class'&&m.value>0)ac=Math.max(ac,m.value+dex);
  }
  ac+=shields.length?Math.max(...shields.map(i=>i.definition.armorClass||0)):0;
  ac+=all.filter(m=>m.type==='bonus'&&m.subType==='armor-class').reduce((n,m)=>n+Number(m.value||0),0);
  let speed=char.race?.weightSpeeds?.normal?.walk??30;
  speed+=all.filter(m=>m.type==='bonus'&&(m.subType==='speed'||m.subType==='speed-walking'||m.subType==='walking-speed'||(!armor.length&&!shields.length&&m.subType==='unarmored-movement'))).reduce((n,m)=>n+Number(m.value||0),0);
  const level=(char.classes||[]).reduce((n,c)=>n+c.level,0),pb=Math.ceil(level/4)+1;
  const saves=Object.fromEntries(ABILITIES.map((key,i)=>{const sub=ABILITY_NAMES[i].toLowerCase()+'-saving-throws';return[key,mod(scores[key])+(all.some(m=>m.type==='proficiency'&&m.subType===sub)?pb:0)+all.filter(m=>m.type==='bonus'&&[sub,'saving-throws'].includes(m.subType)).reduce((n,m)=>n+Number(m.value||0),0)];}));
  const martial=activeFeatures(char).find(f=>f.definition.name==='Martial Arts');
  const canMartial=!!martial&&!armor.length&&!shields.length&&char.inventory.filter(i=>i.equipped&&i.definition?.categoryId===1).every(i=>i.definition.isMonkWeapon===true);
  const martialDie=martial?.levelScale?.dice?.diceString || (martial?(legacy(char)?'1d4':'1d6'):null);
  return {ac,speed,pb,level,saves,canMartial,martialDie,unarmedAttack:(canMartial?Math.max(mod(scores.str),dex):mod(scores.str))+pb,unarmedBonus:canMartial?Math.max(mod(scores.str),dex):mod(scores.str)};
}
function spellInfo(char,item,scores=stats(char),castLevel) {
  const s=item.spell,d=s.definition||{},c=(char.classes||[]).find(c=>c.id===item.sourceId);
  const ability=s.spellCastingAbilityId||c?.definition?.spellCastingAbilityId||c?.subclassDefinition?.spellCastingAbilityId||5;
  const pb=Math.ceil((char.classes||[]).reduce((n,c)=>n+c.level,0)/4)+1,abilityMod=mod(scores[ABILITIES[ability-1]]??10),level=castLevel??d.level??0;
  const attack=abilityMod+pb,dc=s.overrideSaveDc||8+pb+abilityMod;
  let dice=null,bonus=0,kind='effect';
  const damage=(d.modifiers||[]).find(m=>m.type==='damage');
  if(damage?.die?.diceString){dice=damage.die.diceString;kind='damage';
    if(d.scaleType==='characterlevel'){const total=(char.classes||[]).reduce((n,c)=>n+c.level,0);const higher=(damage.atHigherLevels?.higherLevelDefinitions||[]).filter(h=>h.level<=total&&h.dice).sort((a,b)=>b.level-a.level)[0];if(higher?.dice?.diceString)dice=higher.dice.diceString;}
    else if(level>(d.level||0)){const up=(damage.atHigherLevels?.higherLevelDefinitions||[]).find(h=>h.dice?.diceString);if(up&&/^(\d+)d(\d+)$/.test(dice)){const match=dice.match(/^(\d+)d(\d+)$/),increase=Number(up.dice.diceCount||1)*(level-d.level);dice=(Number(match[1])+increase)+'d'+match[2];}}
  }
  const heal=(d.healingDice||[])[0];
  if(heal){dice=heal.diceString||heal.dice?.diceString;bonus=abilityMod;kind='healing';}
  if(!dice && /\b(restores?|regains?)\b/i.test(text(d.description)) && /\b\d+d\d+/.test(text(d.description))){dice=text(d.description).match(/\b\d+d\d+/)[0];bonus=abilityMod;kind='healing';}
  if(kind==='healing' && dice && level>(d.level||0) && /additional.*(?:1d|die)|increases? by.*1d/i.test(text(d.description))){const match=dice.match(/^(\d+)d(\d+)$/),increase=text(d.description).match(/healing increases by (\d+)d(\d+)/i);if(match)dice=(Number(match[1])+(level-d.level)*Number(increase?.[1]||1))+'d'+match[2];}
  if(kind==='healing'&&level>0&&activeFeatures(char).some(f=>f.definition.name==='Disciple of Life'))bonus+=2+level;
  return {ability,abilityMod,attack,dc,save:d.saveDcAbilityId?ABILITIES[d.saveDcAbilityId-1]?.toUpperCase():null,requiresAttack:!!d.requiresAttackRoll,requiresSave:!!d.requiresSavingThrow,dice,bonus,kind};
}
function actionList(char,scores=stats(char)) {
  const m=metrics(char,scores),out=[];
  out.push({id:'basic-unarmed',name:'Unarmed Strike',group:'Action',attack:m.unarmedAttack,dice:m.canMartial?m.martialDie:null,bonus:m.canMartial?m.unarmedBonus:1+mod(scores.str),range:'5 ft.',description:'Make one unarmed strike.',kind:'damage'});
  for(const item of char.inventory.filter(i=>i.equipped&&i.definition?.categoryId===1)) {
    const d=item.definition,properties=d.properties||[],canDex=m.canMartial&&d.isMonkWeapon||properties.some(p=>p.name==='Finesse'),ranged=d.attackType===2||d.weaponTypeRange===2;
    const bonus=ranged?mod(scores.dex):canDex?Math.max(mod(scores.str),mod(scores.dex)):mod(scores.str);
    out.push({id:'weapon-'+item.id,name:d.name,group:'Action',attack:bonus+m.pb,dice:d.damage?.diceString,bonus,range:(d.range||5)+(d.longRange>d.range?'/'+d.longRange:'')+' ft.',description:text(d.description),richDescription:d.description,kind:'damage'});
  }
  const labels={1:'Action',3:'Bonus Action',4:'Reaction',8:'Other'};
  for(const [source,list]of Object.entries(char.actions||{}))for(const a of list){
    const ownFeature=activeFeatures(char).find(f=>f.definition.id===a.componentId),baseDice=a.dice?.diceString||ownFeature?.levelScale?.dice?.diceString;
    let dice=baseDice,bonus=a.abilityModifierStatId?mod(scores[ABILITIES[a.abilityModifierStatId-1]]):0,attack=null,kind='effect';
    if(a.isMartialArts&&m.canMartial){dice=m.martialDie;bonus=m.unarmedBonus;if(a.displayAsAttack)attack=m.unarmedAttack;kind='damage';}
    else if(a.displayAsAttack){if(!/when you hit|extra .*damage/i.test(text(a.description)))attack=a.fixedToHit??bonus+(a.isProficient?m.pb:0);kind='damage';}
    if(a.name==='Deflect Missiles'){dice='1d10';bonus=mod(scores.dex)+(char.classes.find(c=>c.definition.name==='Monk')?.level||0);kind='reduction';attack=null;}
    if(a.name==='Hand of Healing'){dice=m.martialDie;bonus=mod(scores.wis);kind='healing';attack=null;}
    if(a.name==='Hand of Harm'){dice=m.martialDie;bonus=mod(scores.wis);kind='damage';attack=null;}
    let cost=0;if(/spend (?:1|one) ki point/i.test(text(a.description))&&!/Deflect Missiles$/.test(a.name))cost=1;
    out.push({id:source+':'+a.id,name:a.name,group:labels[a.activation?.activationType]||'Other',attack,dice,bonus,range:a.range?.range?String(a.range.range)+' ft.':a.attackTypeRange===1?'5 ft.':'',description:resolvedDescription(a.description||a.snippet,char,scores,ownFeature),kind,cost,limitedUse:a.limitedUse,source:a});
  }
  return out;
}
function resolvedRichDescription(value,char,scores,feature) {
  const scale=feature?.levelScale?.dice?.diceString||metrics(char,scores).martialDie||'';
  return String(value||'').replace(/\{\{modifier:(str|dex|con|int|wis|cha)(?:#signed)?\}\}/g,(_,a)=>signed(mod(scores[a]))).replace(/\{\{scalevalue\}\}/g,scale).replace(/\{\{classlevel\}\}/g,String(feature?.level||''));
}
function resolvedDescription(value,char,scores,feature) {return text(resolvedRichDescription(value,char,scores,feature));}

module.exports={ABILITIES,ABILITY_NAMES,mod,signed,text,slug,legacy,halfHitDiceRecovery,activeFeatures,effectiveCharacter,stats,metrics,spellInfo,actionList,resolvedDescription,resolvedRichDescription};
