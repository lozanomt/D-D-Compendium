"use strict";

// Editable source. Run node build.cjs after JavaScript changes.
const { Notice, requestUrl, parseYaml, MarkdownRenderChild, Modal } = require("obsidian");
const CoreModule = require("./lib/importer.js");
const ImporterCore = CoreModule.default || CoreModule;
const CharacterAPI = CoreModule.customCore;
const Rules = require("./lib/character-rules.js");
const CharacterSheet = require("./lib/character-sheet.js");
const Descriptions = require("./lib/description-renderer.js");
const RUNTIME_KEY = "__customRuntime";

function formatPlayerNote(text) {
  const frontmatter = text.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0] || '';
  const body = text.slice(frontmatter.length);
  if (/^> > \[!player-reference\]/m.test(body)) return text;
  const block = body.match(/^> \[!player-character\][^\n]*\r?\n(?:>[^\n]*\r?\n)*?> \x60{3}[ \t]*(?=\r?\n|$)/m);
  if (!block) return text;
  const reference = (body.slice(0, block.index) + '\n' + body.slice(block.index + block[0].length)).trim();
  let result = block[0].trimEnd();
  if (reference) {
    result += '\n>\n> > [!player-reference]- Imported character reference\n';
    result += reference.split(/\r?\n/).map(line => '> > ' + line).join('\n');
  }
  return frontmatter + '\n' + result + '\n';
}

class CustomDnDBeyondImporter extends ImporterCore {
  constructor(...args) {
    super(...args);
    this.characterRules = Rules;
    this.descriptionRenderer = Descriptions;
    this.fullCharacterIds = new Set();
    this.widgetProcessors = new Map();
    this.pendingFetches = new Map();
    this.saveTimer = null;
    this.saveQueue = Promise.resolve();
  }

  async loadSettings() {
    await super.loadSettings();
    const runtime = this.pluginSettings[RUNTIME_KEY];
    delete this.pluginSettings[RUNTIME_KEY];
    if (!runtime || runtime.version !== 1) return;

    for (const [id, saved] of Object.entries(runtime.characters || {})) {
      const character = saved?.char;
      if (!character || String(character.id) !== id) continue;
      try {
        this.cacheFullCharacter(character);
      } catch (error) {
        console.warn("Custom importer: ignored an invalid saved character", error);
      }
    }
    for (const [key, value] of Object.entries(runtime.state || {})) {
      if (typeof value === "string" && key.startsWith("dnd-custom-")) {
        this.pluginState.set(key, value);
      }
    }
    if (Array.isArray(runtime.rollHistory)) {
      this.rollHistory = runtime.rollHistory.slice(0, 50);
    }
  }

  async saveSettings() {
    const characters = {};
    for (const id of this.fullCharacterIds) {
      const entry = this.charCache.get(id);
      if (entry?.char) characters[id] = { char: entry.char };
    }
    const data = {
      ...this.pluginSettings,
      [RUNTIME_KEY]: {
        version: 1,
        characters,
        state: Object.fromEntries(this.pluginState),
        rollHistory: this.rollHistory.slice(0, 50),
      },
    };
    this.saveQueue = this.saveQueue.catch(() => {}).then(() => this.saveData(data));
    return this.saveQueue;
  }

  queueSave() {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.saveSettings().catch(error => console.error("Custom importer: save failed", error));
    }, 300);
  }

  async onload() {
    await super.onload();

    this.registerMarkdownCodeBlockProcessor("dnd-player-character", (source, el, context) =>
      this.renderPlayerStatblock(source, el, context)
    );

    const originalActive = Boolean(
      this.app.plugins?.enabledPlugins?.has("dndbeyond-importer") ||
      this.app.plugins?.plugins?.["dndbeyond-importer"]
    );
    if (!originalActive) {
      const hpProcessor = this.widgetProcessors.get("dnd-custom-hp-tracker");
      super.registerMarkdownCodeBlockProcessor("dnd-hp-tracker", hpProcessor);
      super.registerMarkdownCodeBlockProcessor("dnd-sheet-launcher", (source, el, context) => {
        this.renderSheetLauncher(source, el, context, true);
      });
    }

    const originalSet = this.pluginState.set.bind(this.pluginState);
    this.pluginState.set = (key, value) => {
      const previous = this.pluginState.get(key);
      const result = originalSet(key, value);
      this.queueSave();
      if(key.startsWith('dnd-custom-hp-') && previous)try {
        const before=JSON.parse(previous),after=JSON.parse(value),id=key.slice('dnd-custom-hp-'.length);
        if(['current','temp','dsS','dsF','max'].some(k=>before[k]!==after[k])) {
          if(after.current<=0){const state=this.readTracker('dnd-custom-session-'+id,{});if(state.concentration){state.concentration=null;originalSet('dnd-custom-session-'+id,JSON.stringify(state));}}
          if(this.sessionViews?.get(id)?.size && !this.hpViewRefreshPending?.has(id)) {
            this.hpViewRefreshPending ||= new Set();this.hpViewRefreshPending.add(id);
            setTimeout(()=>{this.hpViewRefreshPending.delete(id);this.notifySessionViews(id);},0);
          }
        }
      }catch(error){console.warn('Custom importer: HP synchronization failed',error);}
      return result;
    };
    const wrapHistory = value => {
      const history = Array.isArray(value) ? value : [];
      Object.defineProperty(history, "unshift", {
        configurable: true,
        value: (...items) => {
          const result = Array.prototype.unshift.apply(history, items);
          if (history.length > 50) history.length = 50;
          this.queueSave();
          return result;
        },
      });
      return history;
    };
    let history = wrapHistory(this.rollHistory);
    Object.defineProperty(this, "rollHistory", {
      configurable: true,
      get: () => history,
      set: value => { history = wrapHistory(value); this.queueSave(); },
    });

    this.addCommand({
      id: "refresh-active-character-data",
      name: "Custom: Refresh active character sheet data",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        const fm = file && this.app.metadataCache.getFileCache(file)?.frontmatter;
        const id = fm?.dndbeyond_custom_id ?? fm?.dndbeyond_id ??
          (file && this.characterIdFromText(await this.readCharacterNote(file)));
        if (!id) return void new Notice("Open a D&D Beyond character note first.");
        try {
          await this.fetchCharacter(String(id), true);
          new Notice("Character sheet data refreshed. Your note was preserved.");
        } catch (error) {
          new Notice(error.message || "Character data could not be refreshed.");
        }
      },
    });
  }

  registerMarkdownCodeBlockProcessor(language, processor, ...rest) {
    let renderer = processor;
    if (language === "dnd-custom-sheet-launcher") {
      renderer = (source, el, context) => this.renderSheetLauncher(source, el, context, false);
    }
    this.widgetProcessors.set(language, renderer);
    return super.registerMarkdownCodeBlockProcessor(language, renderer, ...rest);
  }

  characterIdFromText(text, customOnly = false) {
    const ids = new Set();
    const blocks = /^[ \t]*\x60{3}(dnd-(?:(?:custom-)?(?:sheet-launcher|hp-tracker)|player-character))[ \t]*\r?\n([\s\S]*?)^[ \t]*\x60{3}[ \t]*$/gm;
    const unquoted = text.replace(/^(?:[ \t]*>[ \t]?)+/gm, "");
    for (const match of unquoted.matchAll(blocks)) {
      if (customOnly) {
        const ownedPlayerBlock = match[1] === "dnd-player-character" && /^\s*refreshMode\s*:\s*note\s*$/m.test(match[2]);
        if (!ownedPlayerBlock && !match[1].startsWith("dnd-custom-")) continue;
      }
      const id = match[2].match(/^\s*charId\s*:\s*(\d+)\s*$/m)?.[1];
      if (id && id !== "0") ids.add(id);
    }
    // A note with widgets for multiple characters is a dashboard, not an import target.
    return ids.size === 1 ? [...ids][0] : null;
  }

  async readCharacterNote(file) {
    const read = this.app.vault.cachedRead || this.app.vault.read;
    return read.call(this.app.vault, file);
  }

  async findImportedNote(id) {
    const files = this.app.vault.getMarkdownFiles();
    // Compatibility with older custom notes that still have an ID property.
    const older = files.find(file => {
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      return fm?.dndbeyond_custom_id != null && String(fm.dndbeyond_custom_id) === id;
    });
    if (older) return older;

    for (const file of files) {
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      let tags = fm?.tags;
      let text;
      if (tags === undefined) {
        text = await this.readCharacterNote(file);
        const yaml = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
        try { tags = yaml ? parseYaml(yaml)?.tags : []; } catch { tags = []; }
      }
      const list = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(/[ ,]+/) : [];
      const characterNote = list.some(tag => ["player-character", "dnd-character"].includes(String(tag).replace(/^#/, "")));
      if (!characterNote) continue;
      // Original widget names remain read-only compatibility views.
      text ??= await this.readCharacterNote(file);
      if (this.characterIdFromText(text, true) === id) return file;
    }
    return null;
  }

  formatImportedNote(text, character) {
    if(character) {
      const working=this.sheetData({char:character}),metrics=Rules.metrics(working.char,working.stats),lines=text.split('\n');
      const row=lines.findIndex(line=>line==='| HP | AC | Speed | Initiative | Proficiency Bonus |');
      if(row>=0 && lines[row+2]?.startsWith('|')) {
        const hp=lines[row+2].split('|')[1].trim();
        lines[row+2]='| '+hp+' | '+metrics.ac+' | '+metrics.speed+' ft | '+Rules.signed(Rules.mod(working.stats.dex))+' | +'+metrics.pb+' |';
        text=lines.join('\n');
      }
    }
    return formatPlayerNote(text);
  }

  cacheFullCharacter(character) {
    const id = String(character.id);
    const stats = Rules.stats(Rules.effectiveCharacter(character));
    const pb = CharacterAPI.proficiency(CharacterAPI.totalLevel(character.classes || []));
    const entry = { char: character, stats, pb };
    this.charCache.set(id, entry);
    this.fullCharacterIds.add(id);
    return entry;
  }


  async enrichCharacter(character, force = false) {
    const signature=(character.classes||[]).filter(c=>c.definition?.canCastSpells||c.subclassDefinition?.canCastSpells).map(c=>c.id+':'+c.level+':'+(c.subclassDefinition?.id||c.definition.id)).join('|');
    if(!signature)return character;
    if(!character._customSupplement && this.app?.vault?.adapter?.read)try {
      const folder=(this.app.vault.configDir||'.obsidian')+'/plugins/'+(this.manifest?.id||'dndbeyond-importer-custom');
      const cache=JSON.parse(await this.app.vault.adapter.read(folder+'/spell-cache.json'));
      const candidate=cache.characters?.[String(character.id)];
      if(candidate?.signature===signature)character._customSupplement=candidate;
    }catch{/* An optional bootstrap cache; online import remains available. */}
    if(!force && character._customSupplement?.signature===signature)return character;
    const old=character._customSupplement;
    const result={signature,classes:[],status:'complete',fetchedAt:new Date().toISOString()};
    const classes=(character.classes||[]).filter(c=>c.definition?.canCastSpells||c.subclassDefinition?.canCastSpells);
    for(const c of classes) {
      const classId=c.subclassDefinition?.id||c.definition.id;
      if(!classId)continue;
      const query='campaignId='+(character.campaign?.id||0)+'&sharingSetting='+(character.preferences?.sharingType||2)+'&classId='+classId+'&classLevel='+c.level;
      const group={characterClassId:c.id,level:c.level,prepared:[],known:[]};
      for(const [kind,key] of [['always-prepared-spells','prepared'],['always-known-spells','known']])try {
        const url='https://character-service.dndbeyond.com/character/v5/game-data/'+kind+'?'+query+(key==='known'?'&backgroundId='+(character.background?.definition?.id||0):'');
        const response=await requestUrl({url,headers:{Accept:'application/json'}});
        if(!Array.isArray(response.json?.data))throw Error('Spell list unavailable');
        group[key]=response.json.data.filter(s=>s?.definition);
      }catch(error){
        result.status='partial';group[key]=old?.classes?.find(v=>v.characterClassId===c.id&&v.level===c.level)?.[key]||[];
        console.warn('Custom importer: '+kind+' unavailable; retaining any cached spell list.',error.message);
      }
      result.classes.push(group);
    }
    character._customSupplement=result;
    return character;
  }

  sheetData(data) {
    const equipment=this.readTracker('dnd-custom-eq-'+data.char.id,{});
    const state=this.readTracker('dnd-custom-session-'+data.char.id,{});
    const effective=Rules.effectiveCharacter(data.char,equipment,state);
    return {...data,raw:data.char,char:effective,stats:Rules.stats(effective)};
  }

  async fetchCharacter(id, force = false) {
    if (!force && this.fullCharacterIds.has(id)) { const cached=this.charCache.get(id); await this.enrichCharacter(cached.char); return cached; }
    if (this.pendingFetches.has(id)) return this.pendingFetches.get(id);
    const pending = (async () => {
      const response = await requestUrl({
        url: "https://character-service.dndbeyond.com/character/v5/character/" + encodeURIComponent(id),
        headers: { Accept: "application/json" },
      });
      const character = response.json?.data;
      if (!character || String(character.id) !== id) throw new Error("Unexpected character response.");
      await this.enrichCharacter(character, force);
      const entry = this.cacheFullCharacter(character);
      await this.saveSettings();
      return entry;
    })();
    this.pendingFetches.set(id, pending);
    try {
      return await pending;
    } finally {
      this.pendingFetches.delete(id);
    }
  }




  showTrackerNotice(message) { new Notice(message); }

  readTracker(key, fallback) {
    try { const value = this.pluginState.get(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  }

  spellProfile(char) {
    char=Rules.effectiveCharacter(char);
    const spells = [];
    for (const group of char.classSpells || []) for (const spell of group.spells || []) spells.push({spell, source:'class', sourceId:group.characterClassId});
    for (const source of ['race','background','feat','class','item']) for (const spell of char.spells?.[source] || []) spells.push({spell, source, sourceId:spell.componentId});
    spells.sort((a,b)=>(a.spell.definition?.level||0)-(b.spell.definition?.level||0));
    const seen=new Map();spells.forEach(s=>{const base=[s.source,s.sourceId||'',s.spell.id||s.spell.definition?.id||s.spell.definition?.name].join(':');const n=seen.get(base)||0;seen.set(base,n+1);s.key=base+(n?':'+n:'');});
    const casters=(char.classes||[]).filter(c=>c.definition?.canCastSpells || c.subclassDefinition?.canCastSpells);
    const slotMax={};
    for(const slot of Object.values(char.spellSlots||{})) if(slot.max>0)slotMax[slot.level]=slot.max;
    // The class progression is authoritative for a single spellcasting class.
    // Noncasters such as Monk do not contribute spell slots.
    if(casters.length===1) {
      const c=casters[0],rules=c.subclassDefinition?.canCastSpells?c.subclassDefinition.spellRules:c.definition.spellRules;
      const progression=rules?.levelSpellSlots?.[c.level];
      if(c.definition.name!=='Warlock' && Array.isArray(progression)){for(const key of Object.keys(slotMax))delete slotMax[key];progression.forEach((n,i)=>{if(n>0)slotMax[i+1]=n;});}
    }
    const pactMax={};
    for(const slot of Object.values(char.pactMagic||{})) if(slot.max>0)pactMax[slot.level]=slot.max;
    const warlock=casters.find(c=>c.definition.name==='Warlock');
    if(warlock && !Object.keys(pactMax).length)(warlock.definition.spellRules?.levelSpellSlots?.[warlock.level]||[]).forEach((n,i)=>{if(n>0)pactMax[i+1]=n;});
    const hitDice=(char.classes||[]).map((c,i)=>({key:String(c.id||i),name:c.definition?.name||'Class',die:c.definition?.hitDice||8,max:c.level||0,used:c.hitDiceUsed||0}));
    return {spells,slotMax,pactMax,hitDice};
  }

  localSession(data) {
    const profile=this.spellProfile(data.char),id=data.char.id;
    const state=this.readTracker('dnd-custom-session-'+id,{});
    state.prepared ||= {}; state.freeUsed ||= {}; state.hitDice ||= {}; state.resources ||= {};
    // Ignore obsolete local capacity overrides; totals always come from class/import data.
    state.slotMax = {}; state.pactMax = {}; state.pactUsed ||= {};
    const monk=(data.char.classes||[]).find(c=>c.definition?.name==='Monk' && c.level>=2);
    if(monk)state.resources.monk={name:Rules.legacy(data.char)?'Ki':'Focus',max:monk.level,used:state.resources.monk?.used||0,reset:'short'};
    for(const [source,list] of Object.entries(data.char.actions||{}))for(const action of list||[]){
      const use=action?.limitedUse;if(!(use?.maxUses>0)||action.name==='Ki Points'&&monk)continue;
      const key='action:'+source+':'+action.id;
      if(!state.resources[key])state.resources[key]={name:action.name,max:use.maxUses,used:use.numberUsed||0,reset:use.resetType===1?'short':use.resetType===2?'long':'manual'};
    }
    return {profile,state,used:this.readTracker('dnd-custom-slots-'+id,{})};
  }

  saveLocalSession(data, local) {
    this.pluginState.set('dnd-custom-session-'+data.char.id,JSON.stringify(local.state));
    this.pluginState.set('dnd-custom-slots-'+data.char.id,JSON.stringify(local.used));
  }

  trackerUndo(data,local) {
    const snapshot=JSON.parse(JSON.stringify(local.state)); delete snapshot.undo;
    local.state.undo={state:snapshot,used:{...local.used},hp:this.pluginState.get('dnd-custom-hp-'+data.char.id)||null};
  }


  setLocalPrepared(data,key,value) {
    const local=this.localSession(data),item=local.profile.spells.find(x=>x.key===key);
    if(!item)throw Error('Spell is unavailable.');
    if(item.spell.alwaysPrepared || !item.spell.definition.level)throw Error('This spell is always available.');
    const c=(data.char.classes||[]).find(c=>c.id===item.sourceId);
    const known=local.profile.spells.filter(x=>x.sourceId===item.sourceId&&x.spell.definition.level>0&&!x.spell.alwaysPrepared&&(local.state.prepared[x.key]??x.spell.prepared));
    let limit=c?.definition?.spellRules?.levelPreparedSpellMaxes?.[c.level];
    if(!limit && c && Rules.legacy(data.char) && ['Cleric','Druid','Wizard','Paladin'].includes(c.definition.name)) {
      const ability=c.definition.spellCastingAbilityId||5;
      limit=Math.max(1,Rules.mod(data.stats[Rules.ABILITIES[ability-1]])+(c.definition.name==='Paladin'?Math.floor(c.level/2):c.level));
    }
    if(value && limit && !known.some(x=>x.key===key)&&known.length>=limit)throw Error('You can prepare '+limit+' '+c.definition.name+' spells, plus always-prepared spells. Unprepare one first.');
    this.trackerUndo(data,local);local.state.prepared[key]=value;this.saveLocalSession(data,local);
  }

  castLocalSpell(data,key,source) {
    const local=this.localSession(data),{profile,state,used}=local;
    const item=profile.spells.find(x=>x.key===key);if(!item)throw Error('Spell is no longer in the imported list.');
    const s=item.spell,d=s.definition||{},level=d.level||0;
    const prepared=s.alwaysPrepared||level===0||(state.prepared[key] ?? (s.prepared||item.source!=='class'));
    if(!prepared)throw Error('Prepare this spell before casting it.');
    const limit=Number(s.limitedUse?.maxUses)||0;
    if(source==='free') {
      if(limit<=0 || (state.freeUsed[key]??s.limitedUse.numberUsed??0)>=limit)throw Error('No free uses remain.');
    } else if(level>0) {
      const [pool,n]=source.split(':');const slot=Number(n),maxima=pool==='pact'?{...profile.pactMax,...state.pactMax}:{...profile.slotMax,...state.slotMax};
      const counts=pool==='pact'?state.pactUsed:used;
      if(!['slot','pact'].includes(pool)||slot<level||!(maxima[slot]>Number(counts[slot]||0)))throw Error('No slot of that level is available.');
    }
    this.trackerUndo(data,local);
    if(source==='free')state.freeUsed[key]=(state.freeUsed[key]??s.limitedUse.numberUsed??0)+1;
    else if(level>0){const [pool,n]=source.split(':');const counts=pool==='pact'?state.pactUsed:used;counts[n]=Number(counts[n]||0)+1;}
    if(d.concentration)state.concentration={key,name:d.name};
    state.lastAction='Cast '+d.name+(level>0?' ('+source+')':'');this.saveLocalSession(data,local);
  }


  openRestDialog(kind,data) {
    if(!['short','long'].includes(kind))return;
    const modal=new Modal(this.app),local=this.localSession(data);
    const hpKey='dnd-custom-hp-'+data.char.id,originalHP=this.readTracker(hpKey,{max:0,current:0,temp:0});
    const draft={hp:{...originalHP},hitDice:{...local.state.hitDice},rolls:[]};
    for(const die of local.profile.hitDice)draft.hitDice[die.key]??=die.used;
    modal.modalEl.addClass('dndcustom-rest-modal');modal.contentEl.addClass('dndcustom-rest-content','dnd-book');
    const render=()=>{
      const content=modal.contentEl;content.empty();
      content.createEl('h2',{text:kind==='short'?'Short Rest':'Long Rest'});
      content.createEl('p',{text:kind==='short'?'After at least 1 hour of rest, recover short-rest abilities. Spend Hit Dice below to preview healing.':'After completing a Long Rest, recover HP, spell slots and eligible abilities. Temporary HP and tracked concentration end.'});
      content.createEl('p',{text:'HP: '+draft.hp.current+' / '+draft.hp.max});
      if(kind==='long')content.createEl('p',{text:Rules.halfHitDiceRecovery(data.char)?'Hit Dice recovery: half your total (minimum one), per your D&D Beyond preference.':'Hit Dice recovery: all spent Hit Dice, per your D&D Beyond preference.'});
      if(kind==='short')for(const die of local.profile.hitDice){
        const row=content.createDiv({cls:'dndcustom-session-line'});
        row.createSpan({text:die.name+' d'+die.die+': '+Math.max(0,die.max-draft.hitDice[die.key])+'/'+die.max+' available'});
        const spend=row.createEl('button',{text:'Spend & heal',cls:'dndcustom-session-button'});spend.disabled=draft.hitDice[die.key]>=die.max||originalHP.current<=0;
        spend.addEventListener('click',()=>{const roll=1+Math.floor(Math.random()*die.die),healing=Math.max(1,roll+Rules.mod(data.stats.con));draft.hitDice[die.key]++;draft.hp.current=Math.min(draft.hp.max,draft.hp.current+healing);draft.rolls.push(die.name+' d'+die.die+': '+roll+' + CON → '+healing+' HP');render();});
      }
      for(const line of draft.rolls)content.createEl('p',{text:line,cls:'dndcustom-session-status'});
      for(const resource of Object.values(local.state.resources))if(resource.reset==='short'||kind==='long'&&resource.reset==='long')content.createEl('p',{text:resource.name+': recover to '+resource.max+'/'+resource.max});
      if(originalHP.current<=0)content.createEl('p',{text:'You need at least 1 HP to start a rest.'});
      content.createEl('p',{text:'Changes apply when you finish the rest. Cancel leaves your tracker unchanged.',cls:'dndcustom-session-status'});
      const controls=content.createDiv({cls:'dndcustom-session-line'});
      const finish=controls.createEl('button',{text:'Finish '+(kind==='short'?'Short':'Long')+' Rest',cls:'dndcustom-session-button mod-cta'});finish.disabled=originalHP.current<=0;
      finish.addEventListener('click',()=>{try{
        const currentHP=this.readTracker(hpKey,{}),current=this.localSession(data);
        if(['current','max','temp','dsS','dsF'].some(k=>currentHP[k]!==originalHP[k])||JSON.stringify(current.state.hitDice)!==JSON.stringify(local.state.hitDice))throw Error('HP or Hit Dice changed while this dialog was open. Reopen the rest to update its preview.');
        this.restLocalCharacter(data,kind,kind==='short'?draft:undefined);this.notifySessionViews(data.char.id);modal.close();
      }catch(error){new Notice(error.message);}});
      controls.createEl('button',{text:'Cancel',cls:'dndcustom-session-button'}).addEventListener('click',()=>modal.close());
    };
    modal.onOpen=render;modal.onClose=()=>modal.contentEl.empty();modal.open();return modal;
  }

  restLocalCharacter(data,kind,draft) {
    const local=this.localSession(data),{state,profile}=local;
    this.trackerUndo(data,local);
    if(kind==='short'&&draft){state.hitDice={...draft.hitDice};this.pluginState.set('dnd-custom-hp-'+data.char.id,JSON.stringify(draft.hp));}
    if(kind==='long') {
      local.used={};state.pactUsed={};state.concentration=null;state.exhaustion=Math.max(0,Number(state.exhaustion||0)-1);
      if(Rules.halfHitDiceRecovery(data.char)){let recover=Math.max(1,Math.floor(profile.hitDice.reduce((n,d)=>n+d.max,0)/2));for(const die of profile.hitDice){const used=state.hitDice[die.key]??die.used;const n=Math.min(used,recover);state.hitDice[die.key]=used-n;recover-=n;}}else for(const die of profile.hitDice)state.hitDice[die.key]=0;
      for(const item of profile.spells)if([1,2].includes(item.spell.limitedUse?.resetType))state.freeUsed[item.key]=0;
      const hp=this.readTracker('dnd-custom-hp-'+data.char.id,null);
      if(hp){hp.current=hp.max;hp.temp=0;hp.dsS=0;hp.dsF=0;this.pluginState.set('dnd-custom-hp-'+data.char.id,JSON.stringify(hp));}
    } else if(kind==='short') {
      state.pactUsed={};
      for(const item of profile.spells)if(item.spell.limitedUse?.resetType===1)state.freeUsed[item.key]=0;
    } else throw Error('Unknown rest type.');
    for(const r of Object.values(state.resources))if(r.reset==='short'||kind==='long'&&r.reset==='long')r.used=0;
    state.lastAction=(kind==='long'?'Long':'Short')+' Rest completed'+(draft?.rolls?.length?' · '+draft.rolls.join('; '):'');this.saveLocalSession(data,local);
  }

  spendLocalHitDie(data,dieKey) {
    const local=this.localSession(data),die=local.profile.hitDice.find(d=>d.key===dieKey);
    if(!die)throw Error('Unknown Hit Die.');const used=local.state.hitDice[dieKey]??die.used;
    if(used>=die.max)throw Error('No Hit Dice remain for this class.');
    const hp=this.readTracker('dnd-custom-hp-'+data.char.id,null);if(!hp||hp.current<=0)throw Error('You need at least 1 HP to take a Short Rest.');
    this.trackerUndo(data,local);const roll=1+Math.floor(Math.random()*die.die),heal=Math.max(1,roll+Math.floor((data.stats.con-10)/2));
    local.state.hitDice[dieKey]=used+1;hp.current=Math.min(hp.max,hp.current+heal);this.pluginState.set('dnd-custom-hp-'+data.char.id,JSON.stringify(hp));
    local.state.lastAction='Spent '+die.name+' d'+die.die+': '+roll+' + CON → '+heal+' healing';this.saveLocalSession(data,local);
  }

  enhanceSpellManagement(root,data,rerender) {
    const doc=root.ownerDocument,local=this.localSession(data),{state,profile,used}=local;
    const spellSection=[...root.querySelectorAll('.dndcustom-cs-section')].find(s=>s.querySelector('.dndcustom-cs-section-hdr')?.textContent==='Spellcasting');
    const host=spellSection || root.querySelector('.dndcustom-mm-flow');if(!host)return;
    const make=(tag,parent,text,cls)=>{const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent.append(e);return e;};
    const button=(parent,text,fn)=>{const b=make('button',parent,text,'dndcustom-session-button');b.type='button';b.addEventListener('click',e=>{e.stopPropagation();try{fn();this.notifySessionViews(data.char.id);}catch(err){new Notice(err.message);}});return b;};
    const change=fn=>{const fresh=this.localSession(data);this.trackerUndo(data,fresh);fn(fresh);this.saveLocalSession(data,fresh);};
    // Remove the old slot-only controls; the new controls use the same persisted slot counts.
    const oldSlot=root.querySelector('.dndcustom-cs-slot-row');if(oldSlot)oldSlot.parentElement.remove();
    const panel=make('div',host,undefined,'dndcustom-session-panel');if(spellSection)host.insertBefore(panel,host.children[1]||null);
    // Slot usage and concentration remain within Spellcasting; rest actions follow it.
    for(const [pool,base,over,counts] of [['slot',profile.slotMax,state.slotMax,used],['pact',profile.pactMax,state.pactMax,state.pactUsed]]) {
      for(const [level,maximum] of Object.entries({...base,...over}).filter(([,n])=>n>0)) {
        const row=make('div',panel,undefined,'dndcustom-session-line');make('span',row,(pool==='pact'?'Pact ':'Level ')+level+': '+Math.max(0,maximum-(counts[level]||0))+'/'+maximum+' available');
        for(let i=0;i<maximum;i++){const spent=i<Number(counts[level]||0);const b=button(row,spent?'●':'○',()=>change(l=>{const target=pool==='pact'?l.state.pactUsed:l.used;target[level]=Math.max(0,Math.min(maximum,Number(target[level]||0)+(spent?-1:1)));}));b.title=(spent?'Recover':'Spend')+' one '+pool+' slot at level '+level;b.setAttribute('aria-label',b.title);}
      }
    }
    if(!Object.values({...profile.slotMax,...state.slotMax,...profile.pactMax,...state.pactMax}).some(n=>n>0))make('p',panel,'No spell slots are available from the imported class data.');
    const concentration=make('div',panel,undefined,'dndcustom-session-line');make('span',concentration,'Concentration: '+(state.concentration?.name||'None'));
    if(state.concentration)button(concentration,'End',()=>change(l=>{l.state.concentration=null;}));
    const status=make('div',panel,state.lastAction||'Changes are saved locally in Obsidian.','dndcustom-session-status');
    if(state.undo)button(status,'Undo last change',()=>{const fresh=this.localSession(data),undo=fresh.state.undo;if(!undo)return;this.pluginState.set('dnd-custom-session-'+data.char.id,JSON.stringify(undo.state));this.pluginState.set('dnd-custom-slots-'+data.char.id,JSON.stringify(undo.used));if(undo.hp)this.pluginState.set('dnd-custom-hp-'+data.char.id,undo.hp);});
    const rows=[...root.querySelectorAll('.dndcustom-cs-spell-row')];
    profile.spells.forEach((item,index)=>{
      const row=rows[index];if(!row)return;const s=item.spell,d=s.definition||{},level=d.level||0,key=item.key;
      const imported=Boolean(s.prepared||s.alwaysPrepared||item.source!=='class'||level===0),prepared=s.alwaysPrepared||level===0||(state.prepared[key]??imported);
      row.querySelector('.dndcustom-cs-spell-prep-dot')?.remove();
      const controls=make('div',row,undefined,'dndcustom-spell-controls');controls.addEventListener('click',e=>e.stopPropagation());
      if(level>0&&item.source==='class'&&!s.alwaysPrepared){const label=make('label',controls);const input=make('input',label);input.type='checkbox';input.checked=prepared;input.setAttribute('aria-label','Prepare '+d.name);label.append(' Prepared');input.addEventListener('change',()=>{try{this.setLocalPrepared(data,key,input.checked);}catch(error){input.checked=!input.checked;new Notice(error.message);}this.notifySessionViews(data.char.id);});}
      else make('span',controls,level===0?'Cantrip':s.alwaysPrepared?'Always prepared':'Granted spell','dndcustom-session-status');
      const source=make('select',controls);source.setAttribute('aria-label','Cast '+d.name+' using');
      const option=(value,text)=>{const o=make('option',source,text);o.value=value;};
      if(level===0)option('cantrip','No slot');
      else {
        const limit=Number(s.limitedUse?.maxUses)||0;if(limit>0){const left=Math.max(0,limit-(state.freeUsed[key]??s.limitedUse.numberUsed??0));if(left)option('free','Free use ('+left+'/'+limit+')');else make('span',controls,'Free use: 0/'+limit,'dndcustom-session-status');}
        for(const [pool,base,over,counts] of [['slot',profile.slotMax,state.slotMax,used],['pact',profile.pactMax,state.pactMax,state.pactUsed]])for(const [n,max] of Object.entries({...base,...over}))if(Number(n)>=level&&max>0)option(pool+':'+n,(pool==='pact'?'Pact ':'Slot ')+n+' ('+Math.max(0,max-(counts[n]||0))+' left)');
      }
      if(level===0)source.hidden=true;
      const cast=button(controls,'Cast',()=>this.castLocalSpell(data,key,source.value));cast.disabled=!prepared||!source.options.length;
      row.classList.toggle('dndcustom-spell-unprepared',!prepared);
    });
    this.sessionViews ||= new Map();const views=this.sessionViews.get(String(data.char.id))||new Set();this.sessionViews.set(String(data.char.id),views);views.add(rerender);
    return ()=>{views.delete(rerender);if(!views.size)this.sessionViews.delete(String(data.char.id));};
  }

  notifySessionViews(id) {
    for(const render of [...(this.sessionViews?.get(String(id))||[])])render();
  }

  configureAbilityLayout(root, table, cells) {
    const doc = root.ownerDocument;
    let columns = 0;
    const render = () => {
      const width = root.getBoundingClientRect().width;
      const next = width > 0 && width < 520 ? 2 : 3;
      if (next === columns) return;
      columns = next;
      table.dataset.abilityColumns = String(columns);
      const head = table.tHead || table.createTHead(); head.replaceChildren();
      const heading = head.insertRow();
      for (let group = 0; group < columns; group++) for (const label of ['','','MOD','SAVE']) {
        const th = doc.createElement('th'); th.textContent = label; heading.append(th);
      }
      const body = table.tBodies[0] || table.createTBody(); body.replaceChildren();
      const groups = columns === 3 ? [[0,1,2],[3,4,5]] : [[0,3],[1,4],[2,5]];
      for (const group of groups) {
        const row = body.insertRow();
        for (const index of group) row.append(...cells[index]);
      }
      table.setAttribute('aria-label', 'Ability scores, check modifiers, and saving throws; ' + groups.length + ' rows of ' + columns + ' abilities');
    };
    render();
    const Observer = doc.defaultView?.ResizeObserver;
    const observer = Observer ? new Observer(render) : null;
    observer?.observe(root);
    return () => observer?.disconnect();
  }

  makeCharacterSheet(data) {
    const working=this.sheetData(data);
    const sheet = new CharacterAPI.FullCharacterSheet(this.app, this, working.char, working.stats, working.pb);
    const open = sheet.onOpen.bind(sheet);
    const close = sheet.onClose.bind(sheet);
    let cleanup;
    sheet.onOpen = () => { cleanup?.(); const fresh=this.sheetData(data); sheet.char=fresh.char; sheet.stats=fresh.stats; open(); cleanup = this.formatPlayerSheet(sheet.contentEl, fresh, () => { const top = sheet.contentEl.scrollTop; sheet.onOpen(); sheet.contentEl.scrollTop = top; }, sheet); sheet.afterRender?.(); };
    sheet.onClose = () => { cleanup?.(); cleanup = null; close(); };
    return sheet;
  }

  formatPlayerSheet(content, data, rerender = () => {}, sheetContext) {
    // Move the original controls, retaining their listeners and state closures.
    if (!content.querySelectorAll) return;
    const root = content.querySelector('.dndcustom-cs-root');
    if (!root || root.classList.contains('dndcustom-mm-view')) return;
    root.classList.add('dndcustom-mm-view', 'dnd-book');
    const all = (s, el = root) => [...el.querySelectorAll(s)];
    const one = (s, el = root) => el.querySelector(s);
    const sections = new Map(all('.dndcustom-cs-section').map(s => [one('.dndcustom-cs-section-hdr', s)?.textContent.trim(), s]));
    const flow = document.createElement('div'); flow.className = 'dndcustom-mm-flow';
    const add = el => { if (el) flow.append(el); return el; };
    const rename = (el, title) => { const h = el && one('.dndcustom-cs-section-hdr', el); if(h) h.textContent = title; return el; };
    const fold = (el, title) => {
      if (!el) return;
      const details = document.createElement('details'); details.className = 'dndcustom-mm-details';
      const summary = document.createElement('summary'); summary.textContent = title; details.append(summary);
      one('.dndcustom-cs-section-hdr', el)?.remove(); details.append(el); add(details); return details;
    };
    const header = one('.dndcustom-cs-header');
    const tools = document.createElement('div'); tools.className = 'dndcustom-mm-tools';
    const close = one('.dndcustom-cs-close-btn'); if(close) tools.append(close);
    const avatar = one('.dndcustom-cs-avatar'); if(avatar) avatar.remove();
    const subtitle=header && one('.dndcustom-cs-char-sub',header);
    if(subtitle && data.char.alignmentId) subtitle.append(' • '+CharacterAPI.alignment(data.char.alignmentId));
    add(header);
    if (avatar) { const portrait = document.createElement('div'); portrait.className='dndcustom-mm-portrait'; portrait.append(avatar); add(portrait); }
    else {
      const file = this.app.vault.getAbstractFileByPath?.('D&D 5e 2024 Rules/z. Load Bearing Folders/Attachments/Placeholder.png');
      if(file) { const portrait=document.createElement('div'); portrait.className='dndcustom-mm-portrait image-embed'; portrait.setAttribute('src',file.path); const img=document.createElement('img'); img.src=this.app.vault.getResourcePath(file); img.alt='Character portrait placeholder'; portrait.append(img); add(portrait); }
    }
    const core = sections.get('Core Stats'), row = core && one('.dndcustom-cs-core-row',core);
    if(row) {
      const pills=new Map(all('.dndcustom-cs-pill',row).map(p=>[one('.dndcustom-cs-pill-label',p)?.textContent.trim(),p]));
      // HP must remain inside the original row for the engine's update callback.
      const hp=pills.get('HP'); hp?.classList.add('dndcustom-cs-pill--hp');
      const line=(keys)=> {const l=document.createElement('div');l.className='dndcustom-mm-meta-line'; keys.forEach(k=>{const p=pills.get(k);if(p)l.append(p);});row.append(l);};
      line(['AC','Initiative']);line(['HP']);line(['Speed']);line(['Prof. Bonus']);
      one('.dndcustom-cs-section-hdr',core)?.remove(); add(core);
    }
    let cleanupAbilityLayout;
    const abilities=all('.dndcustom-cs-abil-card'), saves=all('.dndcustom-cs-save-row');
    if(abilities.length===6 && saves.length===6) {
      const table=document.createElement('table');table.className='dndcustom-mm-abilities';table.setAttribute('aria-label','Ability scores, check modifiers, and saving throws');
      const head=table.createTHead().insertRow(); for(let group=0;group<3;group++) for(const label of ['','','MOD','SAVE']) {const th=document.createElement('th');th.textContent=label;head.append(th);}
      const body=table.createTBody();
      for(const indices of [[0,1,2],[3,4,5]]) {const tr=body.insertRow();for(const i of indices){const card=abilities[i];
        tr.insertCell().textContent=one('.dndcustom-cs-abil-lbl',card)?.textContent;
        tr.insertCell().textContent=one('.dndcustom-cs-abil-score',card)?.textContent;
        const mod=document.createElement('button');mod.className='dndcustom-mm-roll';mod.textContent=one('.dndcustom-cs-abil-mod',card)?.textContent;mod.title=one('.dndcustom-cs-abil-lbl',card)?.textContent+' ability check';mod.addEventListener('click',()=>card.click());tr.insertCell().append(mod);
        const cell=tr.insertCell(), button=one('.dndcustom-cs-roll-btn',saves[i]);if(button){button.title=saves[i].textContent.trim()+' saving throw';cell.append(button);}
        const badge=one('.dndcustom-cs-adv-badge:not(.is-none)',saves[i]);if(badge)cell.append(badge);
      }} const scroll = document.createElement('div'); scroll.className = 'dndcustom-mm-table-scroll'; scroll.append(table); add(scroll);
      const cells = [...body.rows].flatMap(row => [...row.cells]);
      const abilityCells = Array.from({length: 6}, (_, i) => cells.slice(i * 4, i * 4 + 4));
      // Start observing after the flow is attached to the visible root.
      cleanupAbilityLayout = () => this.configureAbilityLayout(root, table, abilityCells);
    }
    const skills=sections.get('Skills');
    if(skills) {const trained=all('.dndcustom-cs-skill-row',skills).filter(r=>one('.dndcustom-cs-dot--prof, .dndcustom-cs-dot--expert',r));
      if(trained.length){const line=document.createElement('div');line.className='dndcustom-mm-skill-summary';const label=document.createElement('strong');label.textContent='Skills ';line.append(label);trained.forEach((r,i)=>{if(i)line.append(', ');const b=document.createElement('button');b.className='dndcustom-mm-roll';b.textContent=(one('.dndcustom-cs-skill-lbl',r)?.textContent||'')+' '+(one('.dndcustom-cs-roll-btn',r)?.textContent||'');b.addEventListener('click',()=>one('.dndcustom-cs-roll-btn',r)?.click());line.append(b);});add(line);}
    }
    const languages = [...new Set(CharacterAPI.modifiers(data.char).filter(m=>m.type==='language').map(m=>m.friendlySubtypeName || m.friendlyTypeName || m.subType).filter(Boolean))];
    if(languages.length){const line=document.createElement('div');line.className='dndcustom-mm-language-summary';const label=document.createElement('strong');label.textContent='Languages ';line.append(label,languages.join(', '));add(line);}
    fold(sections.get('Proficiencies & Languages'),'Proficiencies');
    fold(sections.get('HP Tracker'),'HP & Death Saves');
    fold(skills,'All Skills');
    add(rename(sections.get('Features & Traits'),'Traits'));
    // Only expand descriptions already included in the character; no extra lookups.
    const defs=[...(data.char.race?.racialTraits||[]),...(data.char.feats||[])].filter(x=>x.definition?.name);
    all('.dndcustom-cs-feat-card', flow).forEach((card,i)=>{if(defs[i]?.definition?.description)one('.dndcustom-cs-feat-hdr',card)?.click();});
    add(rename(sections.get('Actions & Attacks'),'Actions'));
    const spells=sections.get('Spells'),slots=sections.get('Spell Slots');
    if(spells){rename(spells,'Spellcasting');if(slots){one('.dndcustom-cs-section-hdr',slots)?.remove();spells.insertBefore(slots,spells.children[1]||null);}add(spells);}else add(rename(slots,'Spellcasting'));
    add(sections.get('Equipment'));add(sections.get('Currency'));
    fold(sections.get('Class Features'),'Class Features');
    fold(sections.get('Session Notes'),'Session Notes');fold(sections.get('Roll Log'),'Roll Log');
    // Keep future upstream sections visible until explicitly styled.
    const consumed=new Set(['Core Stats','Ability Scores','Saving Throws','Skills','HP Tracker','Features & Traits','Actions & Attacks','Spells','Spell Slots','Equipment','Currency','Class Features','Session Notes','Roll Log','Proficiencies & Languages']);
    for(const [name,section] of sections)if(!consumed.has(name))add(section);
    all('.dndcustom-cs-5e-badge').forEach(el=>tools.append(el));add(tools);
    root.replaceChildren(flow);
    const releaseAbility = cleanupAbilityLayout?.();
    const releaseSession = this.enhanceSpellManagement(root, data, rerender);
    const releaseSheet = CharacterSheet.mount(this, root, data, rerender, sheetContext);
    return () => { releaseAbility?.(); releaseSession?.(); releaseSheet?.(); };
  }

  async renderPlayerStatblock(source, el, context = {}) {
    const id = source.match(/^\s*charId\s*:\s*(\d+)\s*$/m)?.[1];
    const rewriteNote = /^\s*refreshMode\s*:\s*note\s*$/m.test(source);
    const frame = el.createDiv({ cls: "dndcustom-player-statblock dnd-book" });
    frame.setAttr("role", "group");
    frame.setAttr("aria-label", "Interactive player character stat block");
    let disposed = false;
    let sheet = null;
    const releaseSheet = () => {
      if (!sheet) return;
      sheet.onClose?.();
      sheet.containerEl?.remove();
      sheet.modalEl?.remove();
      sheet = null;
    };
    if (context.addChild && MarkdownRenderChild) {
      const child = new MarkdownRenderChild(el);
      child.onunload = () => { disposed = true; releaseSheet(); };
      context.addChild(child);
    }
    if (!id || id === "0") {
      frame.createEl("p", { text: "Set charId to your D&D Beyond character ID to load the player tracker." });
      return;
    }

    const render = async (force = false) => {
      if (disposed) return;
      releaseSheet();
      frame.empty();
      frame.createEl("p", { text: "Loading player tracker…", attr: { role: "status" } });
      try {
        const data = await this.fetchCharacter(id, force);
        if (disposed) return;
        frame.empty();
        const content = frame.createDiv({ cls: "dndcustom-cs-content" });
        sheet = this.makeCharacterSheet(data);
        // Reuse the same working sheet renderer inside the note, without opening a modal.
        sheet.contentEl = content;
        sheet.close = () => {
          const current = this.charCache.get(id) || data;
          this.makeCharacterSheet(current).open();
        };
        sheet.onOpen();
        sheet.containerEl?.remove();
        sheet.modalEl?.remove();
        sheet.afterRender = () => {
        const windowButton = content.querySelector(".dndcustom-cs-close-btn");
        if (windowButton) {
          windowButton.textContent = "Open in window";
          windowButton.setAttr("title", "Open the interactive character sheet in a separate window");
        }
        const header = content.querySelector(".dndcustom-mm-tools") || content.querySelector(".dndcustom-cs-header");
        const refresh = header.createEl("button", { cls: "dndcustom-refresh-btn", text: "Refresh" });
        refresh.setAttr("title", rewriteNote ? "Re-import this generated character note" : "Refresh character data without changing your note");
        refresh.addEventListener("click", async () => {
          refresh.disabled = true;
          try {
            if (rewriteNote) {
              await this.importCharacter(id);
              await render();
            } else await render(true);
          } catch (error) {
            new Notice(error.message || "Character refresh failed.");
          } finally {
            refresh.disabled = false;
          }
        });
        };
        sheet.afterRender();
      } catch (error) {
        if (disposed) return;
        releaseSheet();
        frame.empty();
        frame.createEl("p", { text: "The full player tracker could not load. Connect to D&D Beyond once to save a complete offline copy." });
        const maxHp = Number(source.match(/^\s*maxHp\s*:\s*(\d+)\s*$/m)?.[1]);
        if (maxHp > 0) {
          // Retain the previous HP widget's explicit fallback values for offline use.
          this.widgetProcessors.get("dnd-custom-hp-tracker")?.(source, frame, context);
        }
        const retry = frame.createEl("button", { cls: "dndcustom-refresh-btn", text: "Retry loading full tracker" });
        retry.addEventListener("click", () => render(true));
        console.warn("Custom importer: inline tracker could not load", error);
      }
    };
    await render();
  }

  renderSheetLauncher(source, el, context, legacy) {
    const id = source.match(/^\s*charId\s*:\s*(\d+)\s*$/m)?.[1];
    const row = el.createDiv({ cls: "dndcustom-launcher-row" });
    const open = row.createEl("button", { cls: "dndcustom-sheet-btn", text: "Open Interactive Character Sheet" });
    const refresh = row.createEl("button", { cls: "dndcustom-refresh-btn", text: "Refresh from D&D Beyond" });
    if (!id || id === "0") {
      open.disabled = refresh.disabled = true;
      open.title = refresh.title = "This note has no D&D Beyond character ID.";
      return;
    }
    refresh.title = legacy
      ? "Refresh full character data while preserving this existing note."
      : "Refresh the imported note and interactive character sheet.";

    open.addEventListener("click", async () => {
      open.disabled = true;
      open.textContent = "Loading character…";
      try {
        const entry = await this.fetchCharacter(id);
        this.makeCharacterSheet(entry).open();
      } catch (error) {
        console.error("Custom importer: character loading failed", error);
        new Notice("Couldn't load the full character. Connect to D&D Beyond once to save an offline copy. " + (error.message || ""));
      } finally {
        open.disabled = false;
        open.textContent = "Open Interactive Character Sheet";
      }
    });

    refresh.addEventListener("click", async () => {
      refresh.disabled = true;
      refresh.textContent = "Refreshing…";
      try {
        if (legacy) await this.fetchCharacter(id, true);
        else await this.importCharacter(id);
        refresh.textContent = "Refreshed";
      } catch (error) {
        refresh.textContent = "Refresh failed";
        new Notice(error.message || "Character refresh failed.");
      } finally {
        refresh.disabled = false;
        setTimeout(() => { refresh.textContent = "Refresh from D&D Beyond"; }, 1500);
      }
    });
  }

  async importCharacter(input) {
    const result = await super.importCharacter(input);
    // Successful imports contain the complete character response.
    const raw = String(input);
    const id = raw.match(/\/characters\/(\d+)/)?.[1] || raw.match(/^\d+$/)?.[0];
    const entry = id && this.charCache.get(id);
    if (entry?.char) {
      await this.enrichCharacter(entry.char);
      this.fullCharacterIds.add(id);
      await this.saveSettings();
    }
    return result;
  }

  async onunload() {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    await this.saveSettings();
  }
}

module.exports = CustomDnDBeyondImporter;
