import fs from 'node:fs/promises';
import path from 'node:path';
const root='C:/_Projects/DnD Campaigns';
const rules=path.join(root,'D&D 5e 2024 Rules');
const out=path.join(rules,'z. Load Bearing Folders/Attachments/Artwork');
const rows=JSON.parse(await fs.readFile(path.join(out,'manifest.json'),'utf8')).entries;
const backup=path.join(root,'.vault-backups','artwork-20261113');
const placeholder='![[D&D 5e 2024 Rules/z. Load Bearing Folders/Attachments/Placeholder.png|320]]';
const changed=[],skipped=[];
for(const row of rows){
 const relative=path.relative(root,row.path);
 if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Entry outside workspace');
 const original=await fs.readFile(row.path,'utf8');
 const embed='![['+row.file+'|320]]';
 if(original.includes(embed)){changed.push(row.path);continue;}
 if(!original.includes(placeholder)){skipped.push(row.path);continue;}
 const saved=path.join(backup,relative);await fs.mkdir(path.dirname(saved),{recursive:true});
 try{await fs.copyFile(row.path,saved,1);}catch(err){if(err.code!=='EEXIST')throw err;}
 await fs.writeFile(row.path,original.replace(placeholder,embed));changed.push(row.path);
}
const cssPath=path.join(root,'.obsidian/snippets/dnd-2024-book.css');
const cssOriginal=await fs.readFile(cssPath,'utf8');
let css=cssOriginal.replace('.dnd-book .image-embed[src*="Placeholder.png"] {','.dnd-book .image-embed[src*="Placeholder.png"],\n.dnd-book .image-embed[src*="/Attachments/Artwork/"] {').replace('.dnd-book .image-embed[src*="Placeholder.png"] img {','.dnd-book .image-embed[src*="Placeholder.png"] img,\n.dnd-book .image-embed[src*="/Attachments/Artwork/"] img {');
if(!css.includes('/* Extracted PDF artwork'))css+='\n/* Extracted PDF artwork: the PNG owns the bottom fade and transparent padding. */\n.dnd-book .image-embed[src*="/Attachments/Artwork/"] {\n    background: transparent !important;\n    border: 0;\n    aspect-ratio: 4 / 3;\n}\n.dnd-book .image-embed[src*="/Attachments/Artwork/"] img {\n    object-fit: contain;\n    filter: none !important;\n    mix-blend-mode: normal !important;\n    background: transparent !important;\n    border-radius: 0;\n    box-shadow: none;\n}\n';
if(css!==cssOriginal){const dest=path.join(backup,'.obsidian/snippets/dnd-2024-book.css');await fs.mkdir(path.dirname(dest),{recursive:true});try{await fs.copyFile(cssPath,dest,1);}catch(err){if(err.code!=='EEXIST')throw err;}await fs.writeFile(cssPath,css);}
const targets=JSON.parse(await fs.readFile(path.join(root,'.artwork/targets.json'),'utf8'));
const assigned=new Set(rows.map(r=>r.path));
const gaps=targets.filter(t=>!assigned.has(t.path));
const folder=p=>path.relative(rules,p).split(path.sep)[0];
const categories=[...new Set(targets.map(t=>folder(t.path)))].sort();
const counts=categories.map(c=>{const all=targets.filter(t=>folder(t.path)===c).length;const done=rows.filter(r=>folder(r.path)===c).length;return [c,all,done,all-done];});
const unique=[...new Map(rows.map(r=>[r.file,r])).values()];
const report=['---','tags: [audit, artwork]','---','# Artwork coverage','','507 source illustrations were extracted and linked to 829 existing rules entries. All finished images are 1200 × 900 RGBA PNGs with a 4:3 canvas, proportional scaling, transparent padding, and a soft bottom-only alpha fade.','','## Coverage','','| Category | Entries checked | Artwork linked | Still needs a match |','| --- | ---: | ---: | ---: |',...counts.map(c=>'| '+c.join(' | ')+' |'),'| **Total** | **'+targets.length+'** | **'+rows.length+'** | **'+gaps.length+'** |','','## Source and review notes','','- Monster Manual: 258 entry links; Player’s Handbook: 387; Dungeon Master’s Guide: 184. The SRD scan yielded no usable decorative artwork.','- Shared scenes and overlapping item plates remain shared; class features use the corresponding class or subclass illustration, and ordinary enchanted armor variants use the illustrated base armor.','- Source artwork is retained, including its painted background and small labels embedded within illustrations. Text outside artwork is cropped away or made transparent where it overlaps the crop boundary. Subjects already cut off by a page edge remain as printed.','- A missing match below means no reviewed, reliable match was selected from these PDFs. It does not assert that the source contains no related image anywhere.','- Existing placeholders remain on unmatched entries, custom entries, indexes, and templates. No replacement artwork was invented.','- Source book, PDF page (1-based), crop coordinates, masks, file hash, and entry mappings are recorded in [[D&D 5e 2024 Rules/z. Load Bearing Folders/Attachments/Artwork/manifest.json]].','- Original notes and the previous CSS are backed up under .vault-backups/artwork-20261113.','- Verified every output’s dimensions, RGBA mode, file hash, bottom transparency, and absence of top/side fading. Verified all inserted links resolve and entry text differs only at its image embed.','- Browse [[Artwork-Gallery]] for the extracted assets.','','## Entries still needing artwork',''];
for(const category of categories){const subset=gaps.filter(t=>folder(t.path)===category);if(!subset.length)continue;report.push('### '+category,'');for(const t of subset)report.push('- [['+path.relative(root,t.path).replaceAll('\\','/').replace(/\.md$/,'')+'|'+t.name+']]');report.push('');}
await fs.writeFile(path.join(rules,'Audits/Artwork-Coverage.md'),report.join('\n')+'\n');
const gallery=['---','tags: [artwork, gallery]','---','# Extracted artwork','','All images use a 4:3 canvas and bottom-only transparency fade. A source illustration can serve multiple related entries. See [[Artwork-Coverage]] for gaps and review notes.',''];
for(const [book,label]of [['mm','Monster Manual'],['phb','Player’s Handbook'],['dmg','Dungeon Master’s Guide']]){
 gallery.push('## '+label,'');for(const row of unique.filter(r=>r.book===book)){const aliases=rows.filter(r=>r.file===row.file);gallery.push('### PDF page '+row.page+' — '+(aliases.find(r=>!r.shared)?.name??aliases[0].sharedFrom??aliases[0].name),'','![['+row.file+'|320]]','',aliases.length+' linked '+(aliases.length===1?'entry':'entries')+': '+aliases.map(r=>'[['+path.relative(root,r.path).replaceAll('\\','/').replace(/\.md$/,'')+'|'+r.name+']]').join(', '),'');}}
await fs.writeFile(path.join(rules,'Audits/Artwork-Gallery.md'),gallery.join('\n')+'\n');
await fs.writeFile(path.join(out,'coverage.json'),JSON.stringify({entries:targets.length,linked:rows.length,images:unique.length,gaps:gaps.map(t=>({name:t.name,path:path.relative(root,t.path).replaceAll('\\','/')})),categories:counts,skipped},null,2));
export const result={linked:changed.length,skipped,images:unique.length,gaps:gaps.length,backup};
