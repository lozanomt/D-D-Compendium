from pathlib import Path
import re,json,collections
R=Path(r'C:\_Projects\DnD Campaigns');B=R/'== SRDs ==/5.5e';W=R/'.artwork/source-review';changes=[]
# Artificer is absent from the supplied PHB; only change the class membership line.
for p in (B/"Player's Handbook"/'Chapter 7 - Spells').rglob('*.md'):
 t=p.read_text(encoding='utf-8');new=re.sub(r'(?m)^(\*[^\n]*\()Artificer, ',r'\1',t)
 if new!=t:p.write_text(new,encoding='utf-8');changes.append({'note':p.relative_to(R).as_posix(),'change':'Removed Artificer from PHB spell class header; other spell details not thereby verified.'})
for p in B.rglob('*.md'):
 t=p.read_text(encoding='utf-8');original=t
 # Resolve ambiguous bare links according to actual context.
 def resolve(m):
  term=m.group(1);linestart=t.rfind('\n',0,m.start())+1;lineend=t.find('\n',m.end());line=t[linestart:lineend if lineend>=0 else len(t)]
  choices=list(B.rglob(term+'.md'))
  if term=='Darkvision':
   spell=('| Darkvision' in line or ('Darkvision' in line and (('spell' in line.lower()) or p.stem=='Spells')) or ('Classes' in p.parts and line.lstrip().startswith('|')))
   choices=[q for q in choices if ('Spells' in q.parts)==spell]
  else:choices=[q for q in choices if 'Spells' in q.parts]
  if len(choices)!=1:return m.group(0)
  return '[['+choices[0].relative_to(R).as_posix()[:-3]+'|'+term+']]'
 t=re.sub(r'\[\[(Darkvision|Light|Slow|Darkness)\]\]',resolve,t)
 # Trim accidental whitespace from qualified/short target names only if a target exists.
 def trim(m):
  raw=m.group(1);path,sep,label=raw.partition('|');q=path.strip()
  if path==q:return m.group(0)
  matches=[x for x in B.rglob('*.md') if x.stem==q]
  if len(matches)==1:return '[['+matches[0].relative_to(R).as_posix()[:-3]+(sep+label if sep else '|'+q)+']]'
  return m.group(0)
 t=re.sub(r'\[\[([^\]\n]+)\]\]',trim,t)
 # Pipes inside table-cell wikilinks must be escaped.
 t='\n'.join(re.sub(r'\[\[[^\n]*?\]\]',lambda m:re.sub(r'(?<!\\)\|',r'\\|',m.group(0)),line) if line.lstrip('> ').startswith('|') else line for line in t.split('\n'))
 if t!=original:p.write_text(t,encoding='utf-8')
# Verified PHB page: existing Fireball and Fire Shield match; Fire Bolt header corrected above.
for name in ['Fireball','Fire Bolt','Fire Shield']:
 p=next((B/"Player's Handbook").rglob(name+'.md'));t=p.read_text(encoding='utf-8');pdf=next((B/"Player's Handbook").glob('*.pdf')).relative_to(R).as_posix()
 t=t.replace('---\n','---\nsource_pdf_pages: [277]\nreview_status: "rules-checked-against-page-image"\n',1)
 t+='\n## Source\n\n[['+pdf+'#page=277|Player\'s Handbook, p. 274 (PDF page 277)]]\n';p.write_text(t,encoding='utf-8')
 changes.append({'note':p.relative_to(R).as_posix(),'change':'Rules checked against PDF page 277 image; source link added.'})
# Aboleth stat block matches page 12; restore missing lair mechanics.
p=next((B/'Monster Manual').rglob('Aboleth.md'));t=p.read_text(encoding='utf-8');t=t.replace('chosen by the GM','chosen by the DM')
def lk(name):
 ps=[q for q in B.rglob(name+'.md')];ps=[q for q in ps if 'Rules' in q.parts] if len(ps)>1 else ps
 assert len(ps)==1,name
 return '[['+ps[0].relative_to(R).as_posix()[:-3]+'|'+name+']]'
t+='\n## Aboleth Lairs\n\nAboleths usually lair in submerged ruins and caverns, keeping air-filled spaces for terrestrial servants and vulnerable treasures. Their lairs produce these regional effects:\n\n**Foul Water.** Water sources within 1 mile of the lair are supernaturally fouled. A creature other than the aboleth or its allies that drinks this water must succeed on a DC 15 Constitution saving throw or have the '+lk('Poisoned')+' condition for 1 hour.\n\n**Psionic Projection.** While in its lair, the aboleth can cast '+lk('Project Image')+' without spell components, using Intelligence (spell save DC 16). The spell\'s range is 1 mile, and the aboleth can use its '+lk('Telepathy')+' as though it were in the illusion\'s space.\n\nThese effects end immediately if the aboleth dies or moves its lair elsewhere.\n\n## Source\n\n[['+next((B/'Monster Manual').glob('*.pdf')).relative_to(R).as_posix()+'#page=14|Monster Manual, p. 12 (PDF page 14)]]\n'
t=t.replace('---\n','---\nsource_pdf_pages: [14]\nreview_status: "stat-block-and-lair-rules-checked-against-page-image"\n',1);p.write_text(t,encoding='utf-8');changes.append({'note':p.relative_to(R).as_posix(),'change':'Checked stat block; restored missing lair effects from PDF page 14.'})
(W/'other-corrections.json').write_text(json.dumps(changes,indent=2),encoding='utf-8');print('Changes',len(changes),'Artificer headers',len(changes)-4)
