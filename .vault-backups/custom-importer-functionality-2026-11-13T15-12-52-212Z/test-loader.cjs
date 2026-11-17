"use strict";
// Test startup and importing without launching Obsidian or using the network.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const processors = new Map();
const original = {path:"Characters/Original.md", meta:{dndbeyond_id:123}, content:"original note"};
const files = new Map([[original.path, original]]);
const modified = [];
let apiCalls = 0;
const character = {
  id:123, name:"Loader Test", classes:[{definition:{name:"Fighter"},level:1}],
  race:{fullName:"Human",racialTraits:[],weightSpeeds:{normal:{walk:30}}},
  background:{definition:{name:"Soldier"}},
  stats:[{id:1,value:16},{id:2,value:12},{id:3,value:14},{id:4,value:10},{id:5,value:10},{id:6,value:8}],
  bonusStats:[],overrideStats:[],modifiers:{},baseHitPoints:10,
  removedHitPoints:0,temporaryHitPoints:0,inventory:[],classSpells:[],spells:{},
  feats:[],actions:{},traits:{},notes:{},currencies:{},
};
class Plugin {
  async loadData(){return settings;}
  addSettingTab(){}
  addRibbonIcon(){return {};}
  addCommand(){}
  registerMarkdownCodeBlockProcessor(name, callback){
    assert(!processors.has(name)); processors.set(name, callback);
  }
}
const obsidian = {
  Plugin, Modal:class{}, PluginSettingTab:class{}, Notice:class{},
  normalizePath:value=>value.replace(/\\/g,"/"),
  requestUrl:async()=>{apiCalls++;return {json:{data:character}};},
};
const moduleStub={exports:{}};
const context=vm.createContext({
  module:moduleStub,exports:moduleStub.exports,console,
  require(name){
    assert.equal(name,"obsidian","Runtime must not require local files");
    return obsidian;
  },
});
vm.runInContext(fs.readFileSync(path.join(__dirname,"main.js"),"utf8"),context,{filename:"custom-plugin-main.js"});
const PluginClass=moduleStub.exports.default||moduleStub.exports;
assert.equal(typeof PluginClass,"function");
const plugin=new PluginClass();
plugin.app={
  workspace:{onLayoutReady:callback=>callback()},
  metadataCache:{getFileCache:file=>({frontmatter:file.meta})},
  vault:{
    getMarkdownFiles:()=>[...files.values()],
    getAbstractFileByPath:value=>files.get(value),
    createFolder:async()=>{},
    create:async(value,content)=>{
      assert(content.includes("dndbeyond_custom_id: 123"));
      const file={path:value,meta:{dndbeyond_custom_id:123},content};
      files.set(value,file);return file;
    },
    modify:async(file,content)=>{modified.push(file.path);file.content=content;},
  },
};
(async()=>{
  await plugin.onload();
  assert.deepEqual([...processors.keys()].sort(),["dnd-custom-hp-tracker","dnd-custom-sheet-launcher"]);
  assert.equal(plugin.charCache.size,0,"Must ignore original-importer notes");
  await plugin.importCharacter("123");
  const imported=[...files.values()].find(file=>file!==original);
  assert(imported.path.startsWith(settings.outputFolder+"/"));
  assert(imported.content.includes("dnd-custom-sheet-launcher"));
  assert(imported.content.includes("dnd-custom-hp-tracker"));
  await plugin.importCharacter("123");
  assert.deepEqual(modified,[imported.path]);
  assert.equal(original.content,"original note");
  assert.equal(apiCalls,2);
  console.log("PASS: restricted-loader startup, widget registration, isolated import and refresh.");
})().catch(error=>{console.error(error);process.exitCode=1;});
