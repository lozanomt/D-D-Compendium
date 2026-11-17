"use strict";
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=process.argv[2]||__dirname;
let stored=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8'));
delete stored.__customRuntime;
let writes=0, apiCalls=0, offline=false;
const notices=[];
class Element {
  constructor(tag='div',options={}) { this.tag=tag;this.children=[];this.listeners={};this.style={};this.textContent=options.text||'';this.value=options.attr?.value||'';this.classes=new Set((options.cls||'').split(/\s+/).filter(Boolean));this.classList={toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k),add:(...v)=>v.forEach(k=>this.classes.add(k)),remove:(...v)=>v.forEach(k=>this.classes.delete(k))}; }
  createEl(tag,options){const e=new Element(tag,options);this.children.push(e);return e;}
  createDiv(options){return this.createEl('div',typeof options==='string'?{cls:options}:options);}
  createSpan(options){return this.createEl('span',options);}
  addClass(...names){names.forEach(k=>this.classes.add(k));}
  removeClass(...names){names.forEach(k=>this.classes.delete(k));}
  toggleClass(k,v){this.classList.toggle(k,v);}
  setText(value){this.textContent=String(value);}
  setAttr(k,v){this[k]=v;}
  setCssStyles(value){Object.assign(this.style,value);}
  addEventListener(name,callback){(this.listeners[name]??=[]).push(callback);}
  empty(){this.children=[];}
  querySelector(selector){const cls=selector.slice(1);return this.walk().find(e=>e.classes.has(cls))||null;}
  walk(){return [this,...this.children.flatMap(e=>e.walk())];}
  async click(){for(const fn of this.listeners.click||[])await fn({stopPropagation(){}});}
}
class Modal { constructor(app){this.app=app;this.modalEl=new Element();this.contentEl=this.modalEl.createDiv();}open(){this.onOpen();Modal.last=this;} }
class Plugin {
  async loadData(){return JSON.parse(JSON.stringify(stored));}
  async saveData(data){stored=JSON.parse(JSON.stringify(data));}
  addSettingTab(){} addRibbonIcon(){} addCommand(command){(this.commands??=[]).push(command);}
  registerMarkdownCodeBlockProcessor(name,renderer){assert(!this.processors.has(name),'Duplicate processor '+name);this.processors.set(name,renderer);}
}
const char={id:123,name:'Test Monk',classes:[{definition:{name:'Monk'},level:3,classFeatures:[{definition:{name:'Martial Arts',description:'Martial arts feature'}}]},{definition:{name:'Cleric'},level:1,classFeatures:[]}],race:{fullName:'Human',racialTraits:[],weightSpeeds:{normal:{walk:30}}},background:{definition:{name:'Soldier'}},stats:[{id:1,value:8},{id:2,value:17},{id:3,value:14},{id:4,value:10},{id:5,value:15},{id:6,value:8}],bonusStats:[],overrideStats:[],modifiers:{class:[{type:'proficiency',subType:'dexterity-saving-throws'},{type:'proficiency',subType:'stealth'}]},baseHitPoints:23,removedHitPoints:0,temporaryHitPoints:0,inventory:[{equipped:true,quantity:1,definition:{name:'Quarterstaff',weight:4}}],classSpells:[{spells:[{prepared:true,definition:{name:'Cure Wounds',level:1,school:'Abjuration',description:'Healing spell'}}]}],spellSlots:[{level:1,max:2}],spells:{},feats:[{definition:{name:'Alert',description:'Initiative feature'}}],actions:{},traits:{},notes:{},currencies:{gp:25}};
const obsidian={parseYaml:text=>({tags:text.includes("player-character")?["player-character"]:[]}),Plugin,Modal,PluginSettingTab:class{},Notice:class{constructor(text){notices.push(text);}},normalizePath:v=>v.replace(/\\/g,'/'),requestUrl:async()=>{apiCalls++;if(offline)throw Error('Offline');return {json:{data:JSON.parse(JSON.stringify(char))}};}};
const moduleStub={exports:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'main.js'),'utf8'),{module:moduleStub,exports:moduleStub.exports,require:name=>{assert.equal(name,'obsidian');return obsidian;},console,setTimeout,clearTimeout},{filename:'main.js'});
const Custom=moduleStub.exports.default||moduleStub.exports;
const fence=String.fromCharCode(96).repeat(3);
const originalContent='Original note and player annotations\n\n'+fence+'dnd-sheet-launcher\ncharId:123\n'+fence+'\n';
const original={path:'Characters/Original.md',meta:{tags:['player-character']},content:originalContent};
const files=new Map([[original.path,original]]);
function app(originalEnabled=false){return {plugins:{enabledPlugins:new Set(originalEnabled?['dndbeyond-importer']:[]),plugins:{}},workspace:{onLayoutReady:fn=>fn(),getActiveFile:()=>original},metadataCache:{getFileCache:file=>({frontmatter:file.meta})},vault:{cachedRead:async file=>file.content,getMarkdownFiles:()=>[...files.values()],getAbstractFileByPath:p=>files.get(p),createFolder:async()=>{},create:async(p,content)=>{writes++;const file={path:p,content,meta:{tags:["player-character"]}};files.set(p,file);return file;},modify:async(file,content)=>{writes++;file.content=content;}}};}
async function start(active=false){const p=new Custom();p.processors=new Map();p.app=app(active);await p.onload();return p;}
(async()=>{
 const p=await start();
 assert.deepEqual([...p.processors.keys()].sort(),['dnd-custom-hp-tracker','dnd-custom-sheet-launcher','dnd-hp-tracker','dnd-sheet-launcher']);
 assert.equal(p.charCache.size,0);
 const hpEl=new Element();p.processors.get('dnd-hp-tracker')('charId:123\nmaxHp:31\ncurrentHp:31\ntempHp:0',hpEl,{});
 const amount=hpEl.walk().find(e=>e.classes.has('dndcustom-hp-amt-input'));amount.value='5';
 await hpEl.walk().find(e=>e.classes.has('dndcustom-hp-dmg-btn')).click();
 assert.equal(JSON.parse(p.pluginState.get('dnd-custom-hp-123')).current,26);
 const launcher=new Element();p.processors.get('dnd-sheet-launcher')('charId:123',launcher,{sourcePath:original.path});
 await launcher.walk().find(e=>e.classes.has('dndcustom-sheet-btn')).click();
 assert.equal(apiCalls,1);assert(Modal.last,'Full sheet opens');
 const fullText=Modal.last.contentEl.walk().map(e=>e.textContent).join(' ');
 for(const name of ['Quarterstaff','Cure Wounds','Alert','31'])assert(fullText.includes(name),'Missing full sheet data '+name);
 assert.equal(writes,0,'Opening a legacy sheet never rewrites notes');
 assert.equal(JSON.parse(p.pluginState.get('dnd-custom-hp-123')).max,31,'HP recovered correctly');
 await p.saveSettings();
 assert.equal(stored.__customRuntime.characters['123'].char.inventory.length,1);
 const reloaded=await start();offline=true;
 const offlineLauncher=new Element();reloaded.processors.get('dnd-sheet-launcher')('charId:123',offlineLauncher,{});
 await offlineLauncher.walk().find(e=>e.classes.has('dndcustom-sheet-btn')).click();
 assert.equal(apiCalls,1,'Offline reopening uses the complete saved character');
 assert.equal(reloaded.charCache.get('123').char.classSpells.length,1);
 assert.equal(JSON.parse(reloaded.pluginState.get('dnd-custom-hp-123')).current,26);
 const calls=apiCalls;await offlineLauncher.walk().find(e=>e.classes.has('dndcustom-refresh-btn')).click();
 assert.equal(apiCalls,calls+1);assert.equal(original.content,originalContent);assert.equal(writes,0);
 offline=false;
 await reloaded.importCharacter('123');assert.equal(writes,1);assert(files.has('Characters/Custom Importer/Test Monk.md'));
 const generated=files.get('Characters/Custom Importer/Test Monk.md').content;
 const header=generated.match(/^---\n([\s\S]*?)\n---/)[1];
 const keys=[...header.matchAll(/^([a-z_]+):/gm)].map(m=>m[1]).sort();
 assert.deepEqual(keys,['tags']);assert(header.includes('  - player-character'));
 assert(generated.includes('## Ability Scores')&&generated.includes('## Saving Throws')&&generated.includes('## Equipment')&&generated.includes('## Spells'),'Note content remains');assert.equal(original.content,originalContent);
// Re-importing tags-only notes updates them instead of creating duplicates.
 await reloaded.importCharacter('123');assert.equal(writes,2);
 const imported=files.get('Characters/Custom Importer/Test Monk.md');assert(imported);
 files.delete(imported.path);imported.path='Moved/Test Monk.md';files.set(imported.path,imported);
 await reloaded.importCharacter('123');assert.equal(writes,3);assert.equal(files.size,2);
 assert.equal(original.content,originalContent);
 // The data-only command also gets the ID from legacy widgets, with no properties.
 const writeCount=writes,callCount=apiCalls;
 await reloaded.commands.find(c=>c.id==='refresh-active-character-data').callback();
 assert.equal(apiCalls,callCount+1);assert.equal(writes,writeCount);
 const dashboard={path:'Dashboard.md',meta:{tags:['dashboard']},content:fence+'dnd-custom-sheet-launcher\ncharId:999\n'+fence+'\n'};
 files.set(dashboard.path,dashboard);assert.equal(await reloaded.findImportedNote('999'),null);
 dashboard.meta.tags=['player-character'];dashboard.content+=fence+'dnd-custom-sheet-launcher\ncharId:555\n'+fence+'\n';
 assert.equal(await reloaded.findImportedNote('555'),null,'Multi-character dashboards are never overwritten');
 const originalActive=await start(true);assert(!originalActive.processors.has('dnd-sheet-launcher'));assert(!originalActive.processors.has('dnd-hp-tracker'));
 reloaded.pluginState.set('dnd-custom-slots-123',JSON.stringify({'1':1}));
 reloaded.pluginState.set('dnd-custom-eq-123',JSON.stringify({quarterstaff:false}));
 reloaded.pluginState.set('dnd-custom-notes-123','session notes');
 reloaded.rollHistory.unshift({die:'d20',result:12,modifier:3,label:'Stealth'});
 await reloaded.saveSettings();const stateReload=await start();
 assert.equal(JSON.parse(stateReload.pluginState.get('dnd-custom-slots-123'))['1'],1);
 assert.equal(JSON.parse(stateReload.pluginState.get('dnd-custom-eq-123')).quarterstaff,false);
 assert.equal(stateReload.pluginState.get('dnd-custom-notes-123'),'session notes');
 assert.equal(stateReload.rollHistory[0].label,'Stealth');
 stateReload.rollHistory=[];await stateReload.saveSettings();assert.equal(stored.__customRuntime.rollHistory.length,0);
 for(const instance of [p,reloaded,originalActive,stateReload])await instance.onunload();
 console.log('PASS: old/new widgets, complete sheet rendering, correct HP, persistent profiles/HP/slots/equipment/notes, offline reload, failed refresh, original-note preservation, and original-plugin coexistence.');
})().catch(e=>{console.error(e);process.exitCode=1;});
