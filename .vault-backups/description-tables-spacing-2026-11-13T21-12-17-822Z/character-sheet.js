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
  const subfilters=(parent,key,choices,onChange)=>{
    const bar=el('div',parent,undefined,'dndcustom-filter-row');bar.setAttribute('aria-label',key.replace(/^dnd-custom-/,'').split('-filter-')[0]+' filters');
    let selected=plugin.pluginState.get(key)||choices[0][0];if(!choices.some(([value])=>value===selected))selected=choices[0][0];
    const buttons=[];const paint=()=>buttons.forEach(b=>b.button.setAttribute('aria-pressed',String(b.value===selected)));
    for(const [value,label]of choices){const button=btn(bar,label,()=>{selected=value;plugin.pluginState.set(key,value);paint();onChange(value);});button.classList.add('dndcustom-subtab');buttons.push({value,button});}
    paint();return {bar,value:()=>selected};
  };
  const pill=(label,value)=>{const p=all('.dndcustom-cs-pill').find(p=>q('.dndcustom-cs-pill-label',p)?.textContent===label);if(p)q('.dndcustom-cs-pill-value',p).textContent=value;};
  pill('AC',String(m.ac));pill('Speed',m.speed+' ft.');
  const local=plugin.localSession(data),state=local.state,profile=local.profile;
  // Passive senses and spellcasting numbers are derived from the same active modifiers.
  const skillBonus=name=>{const row=all('.dndcustom-cs-skill-row').find(r=>q('.dndcustom-cs-skill-lbl',r)?.textContent===name);return Number(q('.dndcustom-cs-roll-btn',row||root)?.textContent)||0;};
  const overview=el('div',null,undefined,'dndcustom-character-overview');
  const restTools=el('div',overview,undefined,'dndcustom-rest-tools');btn(restTools,'Short Rest',()=>plugin.openRestDialog('short',data));btn(restTools,'Long Rest',()=>plugin.openRestDialog('long',data));
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
  const oldActions=byTitle('Actions'),spells=byTitle('Spellcasting'),inventory=byTitle('Equipment'),currency=byTitle('Currency');
  const oldTraits=byTitle('Traits'),oldClasses=byTitle('Class Features'),oldNotes=all('.dndcustom-mm-details').find(d=>q('summary',d)?.textContent==='Session Notes'),rollLog=all('.dndcustom-mm-details').find(d=>q('summary',d)?.textContent==='Roll Log');
  const footer=q('.dndcustom-mm-tools');
  const nav=el('div',flow,undefined,'dndcustom-character-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Character sheet sections');
  const views=el('div',flow,undefined,'dndcustom-character-panels'),seq=++plugin.sheetSequence|| (plugin.sheetSequence=1),tabs=[];
  const addTab=(key,label)=>{const button=el('button',nav,label,'dndcustom-character-tab');button.type='button';button.setAttribute('role','tab');button.id='dnd-tab-'+seq+'-'+key;const panel=el('div',views,undefined,'dndcustom-character-panel');panel.id='dnd-panel-'+seq+'-'+key;panel.dataset.section=key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);button.setAttribute('aria-controls',panel.id);tabs.push({key,button,panel});return panel;};
  const actionPanel=addTab('actions','Actions'),spellPanel=addTab('spells','Spells'),inventoryPanel=addTab('inventory','Inventory'),featurePanel=addTab('features','Features & Traits'),backgroundPanel=addTab('background','Background'),notePanel=addTab('notes','Notes'),extraPanel=addTab('extras','Extras');
  // The same action-economy groups and filters used by D&D Beyond.
  const actions=section(actionPanel,'Actions');
  const filterKey='dnd-custom-actions-filter-'+char.id;
  let actionFilter=plugin.pluginState.get(filterKey)||'All';
  const actionControls=el('div',actions,undefined,'dndcustom-filter-row');actionControls.setAttribute('aria-label','Action filters');
  const actionBody=el('div',actions),actionRows=[],groups=new Map(),filterButtons=[];let combat;
  for(const [group,title] of [['Action','Actions'],['Bonus Action','Bonus Actions'],['Reaction','Reactions'],['Other','Other']]){
    const container=el('section',actionBody,undefined,'dndcustom-action-group');container.dataset.group=group;
    el('div',container,title+(group==='Action'?' · Attacks per Action: '+(R.activeFeatures(char).some(f=>f.definition.name==='Extra Attack')?2:1):''),'dndcustom-cs-section-hdr');
    groups.set(group,container);
  }
  const matches=(row)=>actionFilter==='All'||actionFilter==='Attack'&&row.dataset.attack==='true'||actionFilter==='Limited Use'&&row.dataset.limited==='true'||row.dataset.group===actionFilter;
  const filterActions=()=>{for(const row of actionRows)row.hidden=!matches(row);for(const container of groups.values())container.hidden=![...container.querySelectorAll('.dndcustom-action-card')].some(r=>!r.hidden);for(const {label,button}of filterButtons)button.setAttribute('aria-pressed',String(actionFilter===label));if(combat)combat.hidden=['Attack','Limited Use'].includes(actionFilter);};
  for(const label of ['All','Attack','Action','Bonus Action','Reaction','Other','Limited Use']){
    const button=btn(actionControls,label,()=>{actionFilter=label;plugin.pluginState.set(filterKey,label);filterActions();});button.classList.add('dndcustom-subtab');filterButtons.push({label,button});
  }
  for(const action of R.actionList(char,scores)) {
    const card=el('div',groups.get(action.group)||groups.get('Other'),undefined,'dndcustom-action-card');card.dataset.group=action.group;card.dataset.attack=String(action.attack!==null&&action.attack!==undefined||!!action.source?.displayAsAttack);card.dataset.limited=String(action.limitedUse?.maxUses>0);actionRows.push(card);
    const line=el('div',card,undefined,'dndcustom-session-line');el('strong',line,action.name);if(action.range)el('span',line,action.range,'dndcustom-session-status');
    if(action.attack!==null&&action.attack!==undefined)btn(line,'ATK '+R.signed(action.attack),()=>sheet.rollD20(action.attack,action.name+' Attack'));
    const roll=(label)=>{if(action.dice)sheet.rollDamage(action.dice,action.bonus,action.name+' '+label);else plugin.showTrackerNotice(action.name+': '+action.bonus+' '+label);};
    if(action.dice||action.kind==='damage')btn(line,(action.kind==='healing'?'Heal ':action.kind==='reduction'?'Reduce ':'DMG ')+(action.dice?action.dice+(action.bonus?R.signed(action.bonus):''):String(action.bonus)),()=>roll(action.kind));
    if(action.cost)btn(line,'Use · '+action.cost+' '+(state.resources.monk?.name||'Ki'),()=>{change(l=>{const r=l.state.resources.monk;if(!r||r.max-r.used<action.cost)throw Error('Not enough '+(r?.name||'Ki')+' remains.');r.used+=action.cost;l.state.lastAction='Used '+action.name;});notify();});
    if(action.limitedUse?.maxUses>0){const resourceKey=action.name==='Ki Points'?'monk':'action:'+action.id;const resource=state.resources[resourceKey];if(resource){
      const count=el('span',card,Math.max(0,resource.max-resource.used)+'/'+resource.max+' available · '+(resource.reset==='short'?'Short Rest':resource.reset==='long'?'Long Rest':'Manual recovery'),'dndcustom-session-status');
      const pips=el('div',card,undefined,'dndcustom-session-line');for(let i=0;i<resource.max;i++){const spent=i<resource.used;const p=btn(pips,spent?'●':'○',()=>{change(l=>{const r=l.state.resources[resourceKey];r.used=Math.max(0,Math.min(r.max,r.used+(spent?-1:1)));});notify();});p.setAttribute('aria-label',(spent?'Recover':'Spend')+' one '+resource.name+' use');}
    }}
    if(action.description)detail(card,'Details',action.description);
  }
  // Spell attacks and limited-use granted spells sit in their casting-time group.
  for(const item of profile.spells){const s=item.spell,d=s.definition,level=d.level||0,ready=s.alwaysPrepared||level===0||(state.prepared[item.key]??(s.prepared||item.source!=='class')),limited=s.limitedUse?.maxUses>0;if(!ready||!d.requiresAttackRoll&&!limited)continue;
    const group=({1:'Action',3:'Bonus Action',4:'Reaction'})[d.activation?.activationType]||'Other';
    const row=el('div',groups.get(group),undefined,'dndcustom-action-card');row.dataset.group=group;row.dataset.attack=String(!!d.requiresAttackRoll);row.dataset.limited=String(limited);row.dataset.spell=d.name;actionRows.push(row);
    const line=el('div',row,undefined,'dndcustom-session-line');el('strong',line,d.name);el('span',line,'Spell · '+(d.level||'Cantrip'),'dndcustom-session-status');const info=R.spellInfo(char,item,scores);
    if(info.requiresAttack)btn(line,'ATK '+R.signed(info.attack),()=>sheet.rollD20(info.attack,d.name+' Spell Attack'));
    if(info.dice)btn(line,(info.kind==='healing'?'Heal ':'DMG ')+info.dice+(info.bonus?R.signed(info.bonus):''),()=>sheet.rollDamage(info.dice,info.bonus,d.name));
    if(limited){const maximum=s.limitedUse.maxUses,spent=state.freeUsed[item.key]??s.limitedUse.numberUsed??0;
      el('span',row,Math.max(0,maximum-spent)+'/'+maximum+' free uses · '+(s.limitedUse.resetType===1?'Short Rest':s.limitedUse.resetType===2?'Long Rest':'Manual recovery'),'dndcustom-session-status');
      const cast=btn(line,'Use',()=>{plugin.castLocalSpell(data,item.key,'free');notify();});cast.disabled=spent>=maximum;
    }
    if(d.description)detail(row,'Details',R.text(d.description));
  }
  filterActions();
  combat=detail(actions,'Actions in Combat','Attack · Dash · Disengage · Dodge · Grapple · Help · Hide · Improvise · Influence · Magic · Ready · Search · Shove · Study · Utilize. Reactions include Opportunity Attack; other activities include interacting with an object.');
  filterActions();
  if(rollLog)actionPanel.append(rollLog);
  oldActions?.remove();
  // Spells retain their original expansion/fallback handlers and new preparation/casting controls.
  if(spells){spellPanel.append(spells);const header=q('.dndcustom-cs-section-hdr',spells);if(header)header.textContent='Spellcasting';
    const castingClasses=(char.classes||[]).filter(c=>c.definition?.canCastSpells||c.subclassDefinition?.canCastSpells);
    for(const c of castingClasses){const ability=c.definition.spellCastingAbilityId||c.subclassDefinition?.spellCastingAbilityId||5,bonus=R.mod(scores[R.ABILITIES[ability-1]]),line=el('p',null,c.definition.name+': '+R.ABILITIES[ability-1].toUpperCase()+' '+R.signed(bonus)+' · Spell attack '+R.signed(bonus+m.pb)+' · Save DC '+(8+m.pb+bonus),'dndcustom-spellcasting-summary');header.after(line);}
    const controls=el('div',null,undefined,'dndcustom-filter-row');header.after(controls);const search=el('input',controls);search.type='search';search.placeholder='Find a spell';search.setAttribute('aria-label','Find a spell');const manageLabel=el('label',controls),manage=el('input',manageLabel);manage.type='checkbox';manage.checked=state.manageSpells||false;manageLabel.append(' Manage preparation');manageLabel.hidden=true;const manageButton=btn(controls,'Manage Spells',()=>{manage.checked=!manage.checked;manage.dispatchEvent(new doc.defaultView.Event('change'));manageButton.setAttribute('aria-pressed',String(manage.checked));});manageButton.classList.add('dndcustom-subtab');manageButton.setAttribute('aria-pressed',String(manage.checked));manageButton.title='Show or hide available class spells for preparation';
    if(char._customSupplement?.status==='partial'||!char._customSupplement?.classes?.length)el('p',controls,'Refresh from D&D Beyond to load any additional class/domain spells. Cached spells remain usable.','dndcustom-session-status');
    const levels=[...new Set(profile.spells.map(s=>Number(s.spell.definition.level||0)))].sort((a,b)=>a-b);
    const ordinal=n=>n===1?'1st':n===2?'2nd':n===3?'3rd':n+'th';let spellLevel='all';
    const levelFilters=subfilters(spells,'dnd-custom-spells-filter-'+char.id,[['all','All'],...levels.map(n=>[String(n),n===0?'Cantrip':ordinal(n)])],value=>{spellLevel=value;filter();});controls.after(levelFilters.bar);spellLevel=levelFilters.value();
    const rows=all('.dndcustom-cs-spell-row',spells);
    const filter=()=>{for(const [i,row]of rows.entries()){const item=profile.spells[i];if(!item)continue;const s=item.spell,ready=s.alwaysPrepared||s.definition.level===0||(state.prepared[item.key]??(s.prepared||item.source!=='class'));row.hidden=(!manage.checked&&!ready)||(spellLevel!=='all'&&String(s.definition.level||0)!==spellLevel)||!s.definition.name.toLowerCase().includes(search.value.toLowerCase());const desc=row.nextElementSibling;if(desc?.classList.contains('dndcustom-cs-spell-desc'))desc.hidden=row.hidden;}for(const heading of all('.dndcustom-cs-spell-lvl-hdr',spells)){let node=heading.nextElementSibling,visible=false;while(node&&!node.classList.contains('dndcustom-cs-spell-lvl-hdr')){if(node.classList.contains('dndcustom-cs-spell-row')&&!node.hidden)visible=true;node=node.nextElementSibling;}heading.hidden=!visible;}};
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
  // Inventory edits affect the effective character, including AC, movement and weapon actions.
  const inv=section(inventoryPanel,'Inventory'),equip=plugin.readTracker('dnd-custom-eq-'+char.id,{}),rawInventory=(data.raw||char).inventory||[];
  const count=el('p',inv,undefined,'dndcustom-session-status');const weight=char.inventory.reduce((n,i)=>n+(i.definition?.weight||0)*Number(state.quantities?.[i.id]??i.quantity??1),0);count.textContent='Weight carried: '+weight.toFixed(1)+' lb.';
  const invSearch=el('input',inv);invSearch.type='search';invSearch.placeholder='Find an item';invSearch.setAttribute('aria-label','Find an inventory item');const invRows=[];
  let inventoryFilter='all';const containers=char.inventory.filter(i=>i.definition?.isContainer);
  const invFilters=subfilters(inv,'dnd-custom-inventory-filter-'+char.id,[['all','All'],['equipment','Equipment'],...containers.map(i=>['container:'+i.id,i.definition.name]),['attunement','Attunement']],value=>{inventoryFilter=value;filterInventory();});inventoryFilter=invFilters.value();invSearch.after(invFilters.bar);
  const emptyInventory=el('p',inv,'No items match this view.','dndcustom-session-status');
  for(const [index,item]of char.inventory.entries()){
    const d=item.definition||{},card=el('div',inv,undefined,'dndcustom-inventory-card');invRows.push(card);card.dataset.name=(d.name||'').toLowerCase();card.dataset.itemId=String(item.id);card.dataset.containerId=String(item.containerEntityId||char.id);card.dataset.isContainer=String(!!d.isContainer);card.dataset.canAttune=String(!!d.canAttune);
    const line=el('div',card,undefined,'dndcustom-session-line');el('strong',line,d.name||'Unnamed item');
    if(d.canEquip!==false)btn(line,item.equipped?'Equipped':'Equip',()=>{const values=plugin.readTracker('dnd-custom-eq-'+char.id,{});values[item.id]=!item.equipped;plugin.pluginState.set('dnd-custom-eq-'+char.id,JSON.stringify(values));notify();});
    const qtyLabel=el('label',line,'Qty '),quantity=el('input',qtyLabel);quantity.type='number';quantity.min='0';quantity.max='99999';quantity.value=String(state.quantities?.[item.id]??item.quantity??1);quantity.setAttribute('aria-label',(d.name||'Item')+' quantity');quantity.addEventListener('change',()=>{const n=Number(quantity.value);if(!Number.isInteger(n)||n<0||n>99999)return;change(l=>{l.state.quantities||={};l.state.quantities[item.id]=n;});notify();});
    if(d.canAttune)btn(line,item.isAttuned?'Attuned':'Attune',()=>{const current=char.inventory.filter(i=>i.isAttuned).length;if(!item.isAttuned&&current>=3)throw Error('Three items are already attuned.');change(l=>{l.state.attuned||={};l.state.attuned[item.id]=!item.isAttuned;});notify();});
    el('span',line,(d.weight||0)+' lb. each','dndcustom-session-status');
    const source=rawInventory.find(i=>i.id===item.containerEntityId);if(source)el('div',card,'Container: '+source.definition.name,'dndcustom-session-status');
    if(d.description)detail(card,'Details',R.text(d.description));
    const lookup=inventory&&all('.dndcustom-cs-eq-row',inventory)[index]?.querySelector('.dndcustom-cs-info-btn');if(lookup)line.append(lookup);
  }
  function filterInventory(){for(const row of invRows){const match=inventoryFilter==='all'||inventoryFilter==='equipment'&&row.dataset.isContainer!=='true'&&row.dataset.containerId===String(char.id)||inventoryFilter==='attunement'&&row.dataset.canAttune==='true'||inventoryFilter.startsWith('container:')&&row.dataset.containerId===inventoryFilter.slice(10);row.hidden=!match||!row.dataset.name.includes(invSearch.value.toLowerCase());}emptyInventory.hidden=invRows.some(r=>!r.hidden);emptyInventory.textContent=inventoryFilter==='attunement'?'No items requiring attunement.':inventoryFilter.startsWith('container:')?'This container is empty.':'No items match this view.';}
  invSearch.addEventListener('input',filterInventory);filterInventory();
  const coins=section(inventoryPanel,'Currency');for(const unit of ['cp','sp','ep','gp','pp']){const label=el('label',coins,unit.toUpperCase()+' ','dndcustom-coin-edit'),input=el('input',label);input.type='number';input.min='0';input.value=String(state.currency?.[unit]??char.currencies?.[unit]??0);input.setAttribute('aria-label',unit.toUpperCase());input.addEventListener('change',()=>{const n=Number(input.value);if(Number.isInteger(n)&&n>=0)change(l=>{l.state.currency||={};l.state.currency[unit]=n;});});}
  inventory?.remove();currency?.remove();
  // Full current-level class features; future-level entries are never presented as granted.
  const features=section(featurePanel,'Features & Traits');
  let featureFilter='all';const featureGroups=[];const featureFilters=subfilters(features,'dnd-custom-features-filter-'+char.id,[['all','All'],['class','Class Features'],['species','Species Traits'],['feats','Feats']],value=>{featureFilter=value;filterFeatures();});featureFilter=featureFilters.value();
  function filterFeatures(){for(const group of featureGroups)group.hidden=featureFilter!=='all'&&group.dataset.featureKind!==featureFilter;}

  for(const c of char.classes||[]){const group=section(features,c.definition.name+' '+c.level+(c.subclassDefinition?.name?' · '+c.subclassDefinition.name:''));group.dataset.featureKind='class';featureGroups.push(group);for(const f of R.activeFeatures(char).filter(f=>f.classId===c.id)){const description=f.definition.name==='Proficiencies'&&c.isStartingClass===false?f.definition.multiClassDescription||f.definition.description:f.definition.description;detail(group,f.definition.name,R.resolvedDescription(description,char,scores,f));}}
  const raceGroup=section(features,'Species Traits');raceGroup.dataset.featureKind='species';const featGroup=section(features,'Feats');featGroup.dataset.featureKind='feats';featureGroups.push(raceGroup,featGroup);filterFeatures();
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
  let noteFilter='all';const noteGroups=[];const noteFilters=subfilters(notes,'dnd-custom-notes-filter-'+char.id,[['all','All'],['organizations','Organizations'],['allies','Allies'],['enemies','Enemies'],['backstory','Backstory'],['other','Other']],value=>{noteFilter=value;filterNotes();});noteFilter=noteFilters.value();
  function filterNotes(){for(const group of noteGroups)group.hidden=noteFilter!=='all'&&group.dataset.noteKind!==noteFilter;}
  for(const key of ['backstory','allies','organizations','enemies','personalPossessions','otherHoldings','otherNotes']){const d=detail(notes,key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()));d.dataset.noteKind=['personalPossessions','otherHoldings','otherNotes'].includes(key)?'other':key;noteGroups.push(d);const area=el('textarea',d);area.value=state.noteEdits?.[key]??R.text(char.notes?.[key]);area.setAttribute('aria-label',key+' notes');area.rows=5;area.addEventListener('input',()=>{const l=plugin.localSession(data);l.state.noteEdits||={};l.state.noteEdits[key]=area.value;plugin.saveLocalSession(data,l);});}
  if(oldNotes){oldNotes.open=true;oldNotes.dataset.noteKind='other';noteGroups.push(oldNotes);notePanel.append(oldNotes);}filterNotes();
  const extras=section(extraPanel,'Extras');const importedCreatures=char.creatures||[],extraCards=[];
  const types=['Familiar','Mount','Pet','Summoned','Sidekick','Misc'];const groupNames={2:'Familiar',4:'Mount',5:'Pet',6:'Summoned',7:'Misc',11:'Sidekick'};
  let extraFilter='all';const extraFilters=subfilters(extras,'dnd-custom-extras-filter-'+char.id,[['all','All'],...types.map(t=>[t,t])],value=>{extraFilter=value;filterExtras();});extraFilter=extraFilters.value();
  const emptyExtras=el('p',extras,'No extras in this group.','dndcustom-session-status');
  for(const creature of importedCreatures){const d=creature.definition||creature,card=detail(extras,d.name||creature.name||'Companion',R.text(d.description||creature.description));card.dataset.extraType=groupNames[creature.groupId]||'Misc';extraCards.push(card);}
  for(const [id,extra]of Object.entries(state.extras||{})){const card=detail(extras,extra.name+' · HP '+extra.current+'/'+extra.max,extra.notes);card.dataset.extraType=extra.type||'Misc';extraCards.push(card);const line=el('div',card,undefined,'dndcustom-session-line');for(const [label,n]of [['−1 HP',-1],['+1 HP',1]])btn(line,label,()=>{change(l=>{l.state.extras[id].current=Math.max(0,Math.min(extra.max,extra.current+n));});notify();});btn(line,'Remove local extra',()=>{change(l=>{delete l.state.extras[id];});notify();});}
  function filterExtras(){for(const card of extraCards)card.hidden=extraFilter!=='all'&&card.dataset.extraType!==extraFilter;emptyExtras.hidden=extraCards.some(c=>!c.hidden);emptyExtras.textContent=extraCards.length?'No extras in this group.':'No companions or other extras are present in the imported sheet.';}
  filterExtras();
  const extraForm=el('div',extras,undefined,'dndcustom-extra-manager');extraForm.hidden=true;
  const manageExtras=btn(extras,'Manage Extras',()=>{extraForm.hidden=!extraForm.hidden;manageExtras.setAttribute('aria-expanded',String(!extraForm.hidden));});manageExtras.setAttribute('aria-expanded','false');extraForm.before(manageExtras);
  el('p',extraForm,'Create a local extra with basic HP tracking.','dndcustom-session-status');
  const nameLabel=el('label',extraForm,'Name '),extraName=el('input',nameLabel);extraName.placeholder='Name';extraName.setAttribute('aria-label','Companion name');
  const typeLabel=el('label',extraForm,'Type '),extraType=el('select',typeLabel);extraType.setAttribute('aria-label','Extra category');for(const type of types){const option=el('option',extraType,type);option.value=type;}
  const hpLabel=el('label',extraForm,'Maximum HP '),hp=el('input',hpLabel);hp.type='number';hp.min='1';hp.value='1';hp.setAttribute('aria-label','Companion maximum HP');
  btn(extraForm,'Add extra',()=>{const n=Number(hp.value);if(!extraName.value.trim()||!Number.isInteger(n)||n<1)throw Error('Enter a name and positive maximum HP.');change(l=>{l.state.extras||={};l.state.extras['extra-'+Date.now()]={name:extraName.value.trim(),type:extraType.value,max:n,current:n,notes:''};});plugin.pluginState.set('dnd-custom-extras-filter-'+char.id,'all');notify();});
  link(extras,'Open D&D Beyond sheet','https://www.dndbeyond.com/characters/'+char.id);
  if(footer)flow.append(footer);
  function activate(key,focus=false){const selected=tabs.find(t=>t.key===key)||tabs[0];for(const tab of tabs){const on=tab===selected;tab.panel.hidden=!on;tab.button.setAttribute('aria-selected',String(on));tab.button.tabIndex=on?0:-1;}if(focus)selected.button.focus();plugin.pluginState.set('dnd-custom-tab-'+char.id,selected.key);}
  for(const [index,tab]of tabs.entries()){tab.button.addEventListener('click',()=>activate(tab.key));tab.button.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(index+1)%tabs.length;if(e.key==='ArrowLeft')n=(index+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();activate(tabs[n].key,true);}});}
  activate(plugin.pluginState.get('dnd-custom-tab-'+char.id)||'actions');
  return ()=>{};
};
