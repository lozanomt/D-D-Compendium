import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
const root='C:/_Projects/DnD Campaigns';
const rules=path.join(root,'D&D 5e 2024 Rules');
const statePath=path.join(root,'.artwork/generated-artwork-state.json');
const queuePath=path.join(root,'.artwork/generated-artwork-queue.json');
const batch=JSON.parse(await fs.readFile(path.join(root,'.artwork/generated-artwork-batch.json'),'utf8'));
const state=JSON.parse(await fs.readFile(statePath,'utf8'));
const queue=JSON.parse(await fs.readFile(queuePath,'utf8'));
const validate=await new Promise(resolve=>cp.execFile('python',[path.join(root,'.artwork/validate-generated-artwork.py'),...batch.map(b=>path.join(root,b.file))],{maxBuffer:8e6},(error,stdout,stderr)=>resolve({error,stdout,stderr})));
if(validate.error)throw new Error('Artwork validation failed: '+validate.stdout+validate.stderr);
const validations=validate.stdout.trim().split(/\r?\n/).map(s=>JSON.parse(s));
const plans=[];
for(const item of batch){
 const task=queue.tasks.find(t=>t.subject===item.subject&&t.category===item.category);
 if(!task)throw new Error('No exact queue subject for '+item.subject);
 const png=await fs.readFile(path.join(root,item.file));
 const dimensions=[png.readUInt32BE(16),png.readUInt32BE(20)];
 if(dimensions[0]!==dimensions[1])throw new Error('Non-square artwork');
 for(const note of task.entries){
  const relative=path.relative(root,note);if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Note outside project');
  const before=await fs.readFile(note,'utf8');
  const target='![['+item.file+'|320]]';
  if(before.includes(target))continue;
  const active=before.match(/!\[\[D&D 5e 2024 Rules\/z\. Load Bearing Folders\/Attachments\/(?:Artwork\/[^\]]+|Placeholder\.png)(?:\|320)?\]\]/);
  if(!active)throw new Error('Expected original artwork missing in '+note);
  plans.push({note,relative,before,after:before.replace(active[0],target)});
 }
 item.task=task;item.dimensions=dimensions;item.sha256=crypto.createHash('sha256').update(png).digest('hex');
 item.validation=validations.find(v=>path.normalize(v.file)===path.normalize(path.join(root,item.file)));
}
const backup=path.join(root,'.vault-backups/generated-artwork-20261116');
for(const plan of plans){const p=path.join(backup,plan.relative);await fs.mkdir(path.dirname(p),{recursive:true});try{await fs.copyFile(plan.note,p,1)}catch(e){if(e.code!=='EEXIST')throw e;}await fs.writeFile(plan.note,plan.after);if(await fs.readFile(plan.note,'utf8')!==plan.after)throw new Error('Entry write verification failed');}
const cssPath=path.join(root,'.obsidian/snippets/dnd-2024-book.css');let css=await fs.readFile(cssPath,'utf8');
if(!css.includes('/* Consistent bottom fade for generated squares */')){const p=path.join(backup,'.obsidian/snippets/dnd-2024-book.css');await fs.mkdir(path.dirname(p),{recursive:true});try{await fs.copyFile(cssPath,p,1)}catch(e){if(e.code!=='EEXIST')throw e;}css+='\n/* Consistent bottom fade for generated squares */\n.dnd-book .image-embed[src*="/Attachments/GeneratedArtwork/"] img {\n -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 82%, transparent 100%);\n mask-image: linear-gradient(to bottom, #000 0%, #000 82%, transparent 100%);\n}\n';await fs.writeFile(cssPath,css);}
for(const item of batch){item.task.status='installed';item.task.generatedFile=item.file;const record={name:item.subject,category:item.category,note:item.task.entries[0],notes:item.task.entries,file:item.file,sourceReference:item.task.reference,dimensions:item.dimensions,sha256:item.sha256,verified:{square:true,validPNG:true,rgba:true,sourceAlpha:item.validation,bottomFadeEnforcedByCSS:true}};const i=state.installed.findIndex(r=>r.name===item.subject&&r.note===record.note);if(i<0)state.installed.push(record);else state.installed[i]=record;}
state.pendingDownload=queue.tasks.filter(t=>t.status==='generated_awaiting_download').map(t=>t.subject);state.blocker=null;state.status='in_progress';
await fs.writeFile(statePath,JSON.stringify(state,null,2));await fs.writeFile(queuePath,JSON.stringify(queue,null,2));
const totalNotes=new Set(state.installed.flatMap(i=>i.notes??[i.note])).size;
const report=['---','tags: [artwork, audit]','---','# Generated artwork replacement','','Installed **'+state.installed.length+'** paintings across **'+totalNotes+'** entries. The queue contains '+queue.tasks.length+' subjects covering '+state.eligibleEntries+' entries; bulk replacement remains in progress.','','## Locked treatment','','- A genuinely square painted composition with natural subject proportions.','- Watercolor washes and textured oil brushwork, with contextual fantasy scenery.','- No captions, page fragments, decorative borders, or empty side-padding strips.','- Each file is checked for PNG integrity, square dimensions, RGBA format, and an alpha fade toward the bottom.','- The statblock CSS additionally masks the bottom 18% to guarantee a fully transparent lower edge across generated paintings. Top and side edges are not masked.','- Shared multi-item source plates are replaced with individual subject paintings. Class features and ordinary enchanted-armor variants may share their corresponding class or base-armor illustration.','','## Installed paintings',''];
for(const item of state.installed)report.push('### '+item.name,'','![['+item.file+'|320]]','',...(item.notes??[item.note]).map(n=>'- [['+path.relative(root,n).replaceAll('\\','/').replace(/\.md$/,'')+']]'),'');
report.push('## Resume data','','The exact queue is in .artwork/generated-artwork-queue.json, and file hashes and validation measurements are in .artwork/generated-artwork-state.json. Original artwork files are retained. Note and CSS backups are in .vault-backups/generated-artwork-20261116 and the earlier generated-artwork backup. No background generator is scheduled.');
await fs.writeFile(path.join(rules,'Audits/Generated-Artwork-Progress.md'),report.join('\n')+'\n');
export const result={installedPaintings:state.installed.length,installedEntries:totalNotes,batch:batch.map(b=>b.subject),remainingSubjects:queue.tasks.filter(t=>t.status!=='installed').length};
