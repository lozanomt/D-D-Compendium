'use strict';
// Presentation only. Imported text is rendered as text, never executable HTML.
module.exports.mount=function(plugin,root,data,rerender,sheet) {
  const R=plugin.characterRules,doc=root.ownerDocument,char=data.char,scores=data.stats,m=R.metrics(char,scores);
  const q=(s,e=root)=>e.querySelector(s),all=(s,e=root)=>[...e.querySelectorAll(s)];
  const el=(tag,parent,text,cls)=>{const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent?.append(e);return e;};
  const change=fn=>{const local=plugin.localSession(data);plugin.trackerUndo(data,local);fn(local);plugin.saveLocalSession(data,local);};
  const notify=()=>plugin.notifySessionViews(char.id);
  const btn=(parent,label,fn)=>{const b=el('button',parent,label,'dndcustom-session-button');b.type='button';b.addEventListener('click',e=>{e.stopPropagation();try{fn();}catch(error){plugin.showTrackerNotice(error.message);}});return b;};
  const section=(parent,title)=>{const s=el('section',parent,undefined,'dndcustom-cs-section');el('div',s,title,'dndcustom-cs-section-hdr');return s;};
  const detail=(parent,title,description)=>{const d=el('details',parent,undefined,'dndcustom-reference-detail');el('summary',d,title);if(description)el('div',d,description,'dndcustom-reference-description');return d;};
  const link=(parent,label,url)=>{const a=el('a',parent,label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
  const pill=(label,value)=>{const p=all('.dndcustom-cs-pill').find(p=>q('.dndcustom-cs-pill-label',p)?.textContent===label);if(p)q('.dndcustom-cs-pill-value',p).textContent=value;};
  pill('AC',String(m.ac));pill('Speed',m.speed+' ft.');
  const local=plugin.localSession(data),state=local.state,profile=local.profile;
  // Passive senses and spellcasting numbers are derived from the same active modifiers.
  const skillBonus=name=>{const row=all('.dndcustom-cs-skill-row').find(r=>q('.dndcustom-cs-skill-lbl',r)?.textContent===name);return Number(q('.dndcustom-cs-roll-btn',row||root)?.textContent)||0;};
  const overview=el('div',null,undefined,'dndcustom-character-overview');
  const passives=el('div',overview,undefined,'dndcustom-session-line');el('span',passives,'Passive Perception '+(10+skillBonus('Perception'))+' · Investigation '+(10+skillBonus('Investigation'))+' · Insight '+(10+skillBonus('Insight')));
  const hasDarkvision=Object.values(char.modifiers||{}).flat().find(v=>v.subType==='darkvision'&&v.value);
  if(hasDarkvision)el('div',overview,'Darkvision '+hasDarkvision.value+' ft.','dndcustom-session-status');
  const inspiration=el('label',overview,undefined,'dndcustom-inspiration');const inspire=el('input',inspiration);inspire.type='checkbox';inspire.checked=state.inspiration??!!char.inspiration;inspiration.append(' Heroic Inspiration');inspire.addEventListener('change',()=>{change(l=>{l.state.inspiration=inspire.checked;});notify();});
  const conditions=detail(overview,'Conditions & Exhaustion');
  const selected=state.conditions??(char.conditions||[]).map(c=>c.name).filter(Boolean);
  el('p',conditions,'Local condition reminders; their rules effects are not applied automatically.','dndcustom-session-status');
  for(const name of ['Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious']){const label=el('label',conditions,undefined,'dndcustom-condition-option'),c=el('input',label);c.type='checkbox';c.checked=selected.includes(name);label.append(name);c.addEventListener('change',()=>{change(l=>{const values=new Set(l.state.conditions||selected);c.checked?values.add(name):values.delete(name);l.state.conditions=[...values];});});}
  const ex=el('label',conditions,'Exhaustion '),exInput=el('input',ex);exInput.type='number';exInput.min='0';exInput.max='6';exInput.value=String(state.exhaustion??0);exInput.setAttribute('aria-label','Exhaustion level');exInput.addEventListener('change',()=>{const n=Number(exInput.value);if(Number.isInteger(n)&&n>=0&&n<=6)change(l=>{l.state.exhaustion=n;});});
  const coreStats=all('.dndcustom-cs-section').find(s=>q('.dndcustom-cs-core-row',s));if(coreStats)coreStats.after(overview);
  const flow=q('.dndcustom-mm-flow');
  const oldSections=all('.dndcustom-cs-section');const byTitle=t=>oldSections.find(s=>q('.dndcustom-cs-section-hdr',s)?.textContent===t);
  const oldActions=byTitle('Actions'),spells=byTitle('Spellcasting'),rests=q('.dndcustom-session-rests'),inventory=byTitle('Equipment'),currency=byTitle('Currency');
  const oldTraits=byTitle('Traits'),oldClasses=byTitle('Class Features'),oldNotes=all('.dndcustom-mm-details').find(d=>q('summary',d)?.textContent==='Session Notes'),rollLog=all('.dndcustom-mm-details').find(d=>q('summary',d)?.textContent==='Roll Log');
  const footer=q('.dndcustom-mm-tools');
  const nav=el('div',flow,undefined,'dndcustom-character-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Character sheet sections');
  const views=el('div',flow,undefined,'dndcustom-character-panels'),seq=++plugin.sheetSequence|| (plugin.sheetSequence=1),tabs=[];
  const addTab=(key,label)=>{const button=el('button',nav,label,'dndcustom-character-tab');button.type='button';button.setAttribute('role','tab');button.id='dnd-tab-'+seq+'-'+key;const panel=el('div',views,undefined,'dndcustom-character-panel');panel.id='dnd-panel-'+seq+'-'+key;panel.dataset.section=key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);button.setAttribute('aria-controls',panel.id);tabs.push({key,button,panel});return panel;};
  const actionPanel=addTab('actions','Actions'),spellPanel=addTab('spells','Spells'),restPanel=addTab('rests','Rests'),inventoryPanel=addTab('inventory','Inventory'),featurePanel=addTab('features','Features & Traits'),backgroundPanel=addTab('background','Background'),notePanel=addTab('notes','Notes'),extraPanel=addTab('extras','Extras');
  // Actions mirror the character's action economy and never turn save-based spells into attacks.
  const actions=section(actionPanel,'Actions');let actionFilter=state.actionFilter||'All';const actionControls=el('div',actions,undefined,'dndcustom-filter-row');
  const actionBody=el('div',actions);const actionRows=[];
  for(const label of ['All','Action','Bonus Action','Reaction','Other'])btn(actionControls,label,()=>{actionFilter=label;for(const row of actionRows)row.hidden=label!=='All'&&row.dataset.group!==label;});
  for(const action of R.actionList(char,scores)) {
    const card=el('div',actionBody,undefined,'dndcustom-action-card');card.dataset.group=action.group;actionRows.push(card);card.hidden=actionFilter!=='All'&&action.group!==actionFilter;
    const line=el('div',card,undefined,'dndcustom-session-line');el('strong',line,action.name);el('span',line,action.group+(action.range?' · '+action.range:''),'dndcustom-session-status');
    if(action.attack!==null&&action.attack!==undefined)btn(line,'ATK '+R.signed(action.attack),()=>sheet.rollD20(action.attack,action.name+' Attack'));
    const roll=(label)=>{if(action.dice)sheet.rollDamage(action.dice,action.bonus,action.name+' '+label);else plugin.showTrackerNotice(action.name+': '+action.bonus+' '+label);};
    if(action.dice||action.kind==='damage')btn(line,(action.kind==='healing'?'Heal ':action.kind==='reduction'?'Reduce ':'DMG ')+(action.dice?action.dice+(action.bonus?R.signed(action.bonus):''):String(action.bonus)),()=>roll(action.kind));
    if(action.cost)btn(line,'Use · '+action.cost+' Ki',()=>{change(l=>{const r=l.state.resources.monk;if(!r||r.max-r.used<action.cost)throw Error('Not enough Ki remains.');r.used+=action.cost;l.state.lastAction='Used '+action.name;});notify();});
    if(action.limitedUse?.maxUses>0){const resourceKey=action.name==='Ki Points'?'monk':'action:'+action.id;const resource=state.resources[resourceKey];if(resource){el('span',line,Math.max(0,resource.max-resource.used)+'/'+resource.max+' available','dndcustom-session-status');btn(line,'Use',()=>{change(l=>{const r=l.state.resources[resourceKey];if(r.used>=r.max)throw Error('No uses remain.');r.used++;});notify();});}}
    if(action.description)detail(card,'Details',action.description);
  }
  if(spells)for(const item of profile.spells){const s=item.spell,d=s.definition,level=d.level||0,ready=s.alwaysPrepared||level===0||(state.prepared[item.key]??(s.prepared||item.source!=='class'));if(!ready||!d.requiresAttackRoll)continue;const info=R.spellInfo(char,item,scores);const row=el('div',actionBody,undefined,'dndcustom-action-card');row.dataset.group='Action';actionRows.push(row);const line=el('div',row,undefined,'dndcustom-session-line');el('strong',line,d.name);btn(line,'ATK '+R.signed(info.attack),()=>sheet.rollD20(info.attack,d.name+' Spell Attack'));if(info.dice)btn(line,'DMG '+info.dice+(info.bonus?R.signed(info.bonus):''),()=>sheet.rollDamage(info.dice,info.bonus,d.name));}
  detail(actions,'Actions in Combat','Attack · Dash · Disengage · Dodge · Grapple · Help · Hide · Improvise · Influence · Magic · Ready · Search · Shove · Study · Utilize. Reactions include Opportunity Attack; other activities include interacting with an object.');
  if(rollLog)actionPanel.append(rollLog);
  oldActions?.remove();
  // Spells retain their original expansion/fallback handlers and new preparation/casting controls.
  if(spells){spellPanel.append(spells);const header=q('.dndcustom-cs-section-hdr',spells);if(header)header.textContent='Spellcasting';
    const castingClasses=(char.classes||[]).filter(c=>c.definition?.canCastSpells||c.subclassDefinition?.canCastSpells);
    for(const c of castingClasses){const ability=c.definition.spellCastingAbilityId||c.subclassDefinition?.spellCastingAbilityId||5,bonus=R.mod(scores[R.ABILITIES[ability-1]]),line=el('p',null,c.definition.name+': '+R.ABILITIES[ability-1].toUpperCase()+' '+R.signed(bonus)+' · Spell attack '+R.signed(bonus+m.pb)+' · Save DC '+(8+m.pb+bonus),'dndcustom-spellcasting-summary');header.after(line);}
    const controls=el('div',null,undefined,'dndcustom-filter-row');header.after(controls);const search=el('input',controls);search.type='search';search.placeholder='Find a spell';search.setAttribute('aria-label','Find a spell');const manageLabel=el('label',controls),manage=el('input',manageLabel);manage.type='checkbox';manage.checked=state.manageSpells||false;manageLabel.append(' Manage preparation');
    if(char._customSupplement?.status==='partial'||!char._customSupplement?.classes?.length)el('p',controls,'Refresh from D&D Beyond to load any additional class/domain spells. Cached spells remain usable.','dndcustom-session-status');
    const rows=all('.dndcustom-cs-spell-row',spells);
    const filter=()=>{for(const [i,row]of rows.entries()){const item=profile.spells[i];if(!item)continue;const s=item.spell,ready=s.alwaysPrepared||s.definition.level===0||(state.prepared[item.key]??(s.prepared||item.source!=='class'));row.hidden=(!manage.checked&&!ready)||!s.definition.name.toLowerCase().includes(search.value.toLowerCase());const desc=row.nextElementSibling;if(desc?.classList.contains('dndcustom-cs-spell-desc'))desc.hidden=row.hidden;}};
    search.addEventListener('input',filter);manage.addEventListener('change',()=>{change(l=>{l.state.manageSpells=manage.checked;});filter();});
    for(const [i,row]of rows.entries()){
      const item=profile.spells[i];if(!item)continue;const s=item.spell,d=s.definition,info=R.spellInfo(char,item,scores);row.dataset.spell=d.name;row.dataset.spellKey=item.key;
      const time=d.activation?.activationType===3?'Bonus action':d.activation?.activationType===4?'Reaction':(d.activation?.activationTime||1)+' '+(d.activation?.activationType===6?'minute':d.activation?.activationType===7?'hour':'action');
      const range=d.range?.origin==='Touch'?'Touch':d.range?.rangeValue?d.range.rangeValue+' ft.':d.range?.origin||'—';
      const source=item.source==='class'?(char.classes||[]).find(c=>c.id===item.sourceId)?.definition.name:item.source;
      const meta=el('div',row,(d.isLegacy?'Legacy · ':'')+source+' · '+time+' · '+range+(d.ritual?' · Ritual':''),'dndcustom-spell-metadata');
      const outcome=el('div',row,undefined,'dndcustom-session-line');outcome.addEventListener('click',e=>e.stopPropagation());
      if(info.requiresAttack)btn(outcome,'ATK '+R.signed(info.attack),()=>sheet.rollD20(info.attack,d.name+' Spell Attack'));
      else if(info.requiresSave)el('span',outcome,(info.save||'Save')+' DC '+info.dc);
      if(info.dice){const castSource=q('.dndcustom-spell-controls select',row);let selectedInfo=info;const rollButton=btn(outcome,'',()=>sheet.rollDamage(selectedInfo.dice,selectedInfo.bonus,d.name+' '+selectedInfo.kind));const updateRoll=()=>{const n=Number(castSource?.value?.split(':')[1]);selectedInfo=R.spellInfo(char,item,scores,n||d.level);rollButton.textContent=(selectedInfo.kind==='healing'?'Heal ':'DMG ')+selectedInfo.dice+(selectedInfo.bonus?R.signed(selectedInfo.bonus):'');};castSource?.addEventListener('change',updateRoll);updateRoll();}
      const duration=d.duration?.durationType==='Instantaneous'?'Instantaneous':d.duration?.durationInterval?d.duration.durationInterval+' '+d.duration.durationUnit:d.duration?.durationType||'';
      if(duration)meta.append(' · '+duration);
      const components=(d.components||[]).map(n=>({1:'V',2:'S',3:'M'})[n]).filter(Boolean).join(', ');if(components){meta.append(' · '+components);meta.title='Components: '+components+(d.componentsDescription?' ('+d.componentsDescription+')':'');}
      const prep=q('input[type=checkbox]',row);if(prep)prep.addEventListener('change',filter);
    }
    filter();
  }else el('p',spellPanel,'No spells are present in the imported character.');
  if(rests)restPanel.append(rests);
  // Inventory edits affect the effective character, including AC, movement and weapon actions.
  const inv=section(inventoryPanel,'Inventory'),equip=plugin.readTracker('dnd-custom-eq-'+char.id,{}),rawInventory=(data.raw||char).inventory||[];
  const count=el('p',inv,undefined,'dndcustom-session-status');const weight=char.inventory.reduce((n,i)=>n+(i.definition?.weight||0)*Number(state.quantities?.[i.id]??i.quantity??1),0);count.textContent='Weight carried: '+weight.toFixed(1)+' lb.';
  const invSearch=el('input',inv);invSearch.type='search';invSearch.placeholder='Find an item';invSearch.setAttribute('aria-label','Find an inventory item');const invRows=[];
  for(const [index,item]of char.inventory.entries()){
    const d=item.definition||{},card=el('div',inv,undefined,'dndcustom-inventory-card');invRows.push(card);card.dataset.name=(d.name||'').toLowerCase();
    const line=el('div',card,undefined,'dndcustom-session-line');el('strong',line,d.name||'Unnamed item');
    if(d.canEquip!==false)btn(line,item.equipped?'Equipped':'Equip',()=>{const values=plugin.readTracker('dnd-custom-eq-'+char.id,{});values[item.id]=!item.equipped;plugin.pluginState.set('dnd-custom-eq-'+char.id,JSON.stringify(values));notify();});
    const qtyLabel=el('label',line,'Qty '),quantity=el('input',qtyLabel);quantity.type='number';quantity.min='0';quantity.max='99999';quantity.value=String(state.quantities?.[item.id]??item.quantity??1);quantity.setAttribute('aria-label',(d.name||'Item')+' quantity');quantity.addEventListener('change',()=>{const n=Number(quantity.value);if(!Number.isInteger(n)||n<0||n>99999)return;change(l=>{l.state.quantities||={};l.state.quantities[item.id]=n;});notify();});
    if(d.canAttune)btn(line,item.isAttuned?'Attuned':'Attune',()=>{const current=char.inventory.filter(i=>i.isAttuned).length;if(!item.isAttuned&&current>=3)throw Error('Three items are already attuned.');change(l=>{l.state.attuned||={};l.state.attuned[item.id]=!item.isAttuned;});notify();});
    el('span',line,(d.weight||0)+' lb. each','dndcustom-session-status');
    const source=rawInventory.find(i=>i.id===item.containerEntityId);if(source)el('div',card,'Container: '+source.definition.name,'dndcustom-session-status');
    if(d.description)detail(card,'Details',R.text(d.description));
    const lookup=inventory&&all('.dndcustom-cs-eq-row',inventory)[index]?.querySelector('.dndcustom-cs-info-btn');if(lookup)line.append(lookup);
  }
  invSearch.addEventListener('input',()=>{for(const row of invRows)row.hidden=!row.dataset.name.includes(invSearch.value.toLowerCase());});
  const coins=section(inventoryPanel,'Currency');for(const unit of ['cp','sp','ep','gp','pp']){const label=el('label',coins,unit.toUpperCase()+' ','dndcustom-coin-edit'),input=el('input',label);input.type='number';input.min='0';input.value=String(state.currency?.[unit]??char.currencies?.[unit]??0);input.setAttribute('aria-label',unit.toUpperCase());input.addEventListener('change',()=>{const n=Number(input.value);if(Number.isInteger(n)&&n>=0)change(l=>{l.state.currency||={};l.state.currency[unit]=n;});});}
  inventory?.remove();currency?.remove();
  // Full current-level class features; future-level entries are never presented as granted.
  const features=section(featurePanel,'Features & Traits');
  for(const c of char.classes||[]){const group=section(features,c.definition.name+' '+c.level+(c.subclassDefinition?.name?' · '+c.subclassDefinition.name:''));for(const f of R.activeFeatures(char).filter(f=>f.classId===c.id)){const description=f.definition.name==='Proficiencies'&&c.isStartingClass===false?f.definition.multiClassDescription||f.definition.description:f.definition.description;detail(group,f.definition.name,R.resolvedDescription(description,char,scores,f));}}
  const raceGroup=section(features,'Species Traits');const featGroup=section(features,'Feats');
  const cards=oldTraits?all('.dndcustom-cs-feat-card',oldTraits):[];
  for(const card of cards){const name=q('.dndcustom-cs-feat-hdr-name',card)?.textContent;(char.feats||[]).some(f=>f.definition.name===name)?featGroup.append(card):raceGroup.append(card);}
  oldTraits?.remove();oldClasses?.closest('.dndcustom-mm-details')?.remove();q('.dndcustom-cs-cls-hdr')?.closest('.dndcustom-mm-details')?.remove();
  // Background and notes preserve imported data and keep local edits separate.
  const bg=section(backgroundPanel,char.background?.definition?.name||char.background?.customBackground?.name||'Background');
  if(char.background?.definition?.description)el('div',bg,R.text(char.background.definition.description),'dndcustom-reference-description');
  if(char.background?.definition?.featureName)detail(bg,char.background.definition.featureName,R.text(char.background.definition.featureDescription));
  for(const [key,label] of [['personalityTraits','Personality'],['ideals','Ideals'],['bonds','Bonds'],['flaws','Flaws'],['appearance','Appearance']])if(char.traits?.[key])detail(bg,label,R.text(char.traits[key]));
  const identity=['alignmentId','faith','lifestyle','hair','skin','eyes','height','weight','age','gender'].filter(k=>char[k]!==undefined&&char[k]!==null&&typeof char[k]!=='object');
  for(const key of identity.filter(k=>k!=='alignmentId'))el('p',bg,key.charAt(0).toUpperCase()+key.slice(1)+': '+char[key]);
  const notes=section(notePanel,'Notes');el('p',notes,'Imported notes are the starting point. Edits here are saved locally.','dndcustom-session-status');
  for(const key of ['backstory','allies','organizations','enemies','personalPossessions','otherHoldings','otherNotes']){const d=detail(notes,key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()));const area=el('textarea',d);area.value=state.noteEdits?.[key]??R.text(char.notes?.[key]);area.setAttribute('aria-label',key+' notes');area.rows=5;area.addEventListener('input',()=>{const l=plugin.localSession(data);l.state.noteEdits||={};l.state.noteEdits[key]=area.value;plugin.saveLocalSession(data,l);});}
  if(oldNotes){oldNotes.open=true;notePanel.append(oldNotes);}
  const extras=section(extraPanel,'Extras');const importedCreatures=char.creatures||[];
  if(!importedCreatures.length)el('p',extras,'No companions or other extras are present in the imported sheet.','dndcustom-session-status');
  for(const creature of importedCreatures){const d=creature.definition||creature;detail(extras,d.name||creature.name||'Companion',R.text(d.description||creature.description));}
  for(const [id,extra]of Object.entries(state.extras||{})){const card=detail(extras,extra.name+' · HP '+extra.current+'/'+extra.max,extra.notes);const line=el('div',card,undefined,'dndcustom-session-line');for(const [label,n]of [['−1 HP',-1],['+1 HP',1]])btn(line,label,()=>{change(l=>{l.state.extras[id].current=Math.max(0,Math.min(extra.max,extra.current+n));});notify();});btn(line,'Remove local extra',()=>{change(l=>{delete l.state.extras[id];});notify();});}
  const extraForm=detail(extras,'Add local companion');const extraName=el('input',extraForm);extraName.placeholder='Name';extraName.setAttribute('aria-label','Companion name');const hp=el('input',extraForm);hp.type='number';hp.min='1';hp.value='1';hp.setAttribute('aria-label','Companion maximum HP');btn(extraForm,'Add companion',()=>{const n=Number(hp.value);if(!extraName.value.trim()||!Number.isInteger(n)||n<1)throw Error('Enter a name and positive maximum HP.');change(l=>{l.state.extras||={};l.state.extras['extra-'+Date.now()]={name:extraName.value.trim(),max:n,current:n,notes:''};});notify();});
  link(extras,'Open D&D Beyond sheet','https://www.dndbeyond.com/characters/'+char.id);
  if(footer)flow.append(footer);
  function activate(key,focus=false){const selected=tabs.find(t=>t.key===key)||tabs[0];for(const tab of tabs){const on=tab===selected;tab.panel.hidden=!on;tab.button.setAttribute('aria-selected',String(on));tab.button.tabIndex=on?0:-1;}if(focus)selected.button.focus();plugin.pluginState.set('dnd-custom-tab-'+char.id,selected.key);}
  for(const [index,tab]of tabs.entries()){tab.button.addEventListener('click',()=>activate(tab.key));tab.button.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(index+1)%tabs.length;if(e.key==='ArrowLeft')n=(index+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();activate(tabs[n].key,true);}});}
  activate(plugin.pluginState.get('dnd-custom-tab-'+char.id)||'actions');
  return ()=>{};
};
