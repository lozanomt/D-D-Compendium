'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,source=process.argv[2]||path.join(root,'audit','upstream-main-v1.1.4.js');
const original=fs.readFileSync(source,'utf8'),core=fs.readFileSync(path.join(root,'lib','importer.js'),'utf8');
const metadata=JSON.parse(fs.readFileSync(path.join(root,'UPSTREAM.json'),'utf8'));
assert.equal(crypto.createHash('sha256').update(original).digest('hex'),metadata.originalFiles['main.js'],'Audit requires the pinned original v1.1.4 bundle');
const normalized=original.replaceAll('dndbi','dndcustom').replaceAll('dnd-hp','dnd-custom-hp').replaceAll('dnd-sheet','dnd-custom-sheet').replaceAll('dnd-slots','dnd-custom-slots').replaceAll('dnd-eq','dnd-custom-eq').replaceAll('dnd-notes','dnd-custom-notes').replaceAll('dndbeyond_id','dndbeyond_custom_id');
const marks=[...core.matchAll(/\b(\w+)=class extends ([\w.]+)/g)];
const names={Ie:'Import dialog',_e:'Legacy HP modal',Ae:'Standalone dice roller / history / CSV / clipboard',We:'Interactive sheet engine',Ne:'5etools data dialog',Ge:'All seven settings'};
for(let i=0;i<marks.length-1;i++){
 const token=marks[i][0],end=marks[i+1][0],a=normalized.indexOf(token),b=core.indexOf(token);
 let actual=core.slice(b,core.indexOf(end,b+1));
 if(marks[i][1]==='We')actual=actual.replace('G.querySelector(".dndcustom-cs-pill--hp .dndcustom-cs-pill-value")||G.querySelector(".dndcustom-cs-pill-value")','G.querySelector(".dndcustom-cs-pill-value")');
 assert.equal(actual,normalized.slice(a,normalized.indexOf(end,a+1)),names[marks[i][1]]+' must retain the original implementation');
 console.log('PASS: '+names[marks[i][1]]+' matches upstream after namespace / HP-selector normalization');
}
for(const id of ['import-dndbeyond-character','open-dice-roller','open-hp-tracker'])assert(core.includes('id:"'+id+'"'),'Original command '+id);
for(const die of ['d4','d6','d8','d10','d12','d20','d100'])assert(core.includes('label:"'+die+'"'),'Dice '+die);
const entry=fs.readFileSync(path.join(root,'entry.js'),'utf8');
assert(entry.includes(".dndcustom-cs-adv-badge:not(.is-none)"),'Saving throw advantage/disadvantage badge must be retained in the compact table');
console.log('PASS: original commands, seven dice, and restored save indicators');
