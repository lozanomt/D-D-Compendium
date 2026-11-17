from pathlib import Path
import re,json,collections,zipfile,datetime
ROOT=Path(r'C:\_Projects\DnD Campaigns'); BASE=ROOT/'== SRDs =='; WORK=ROOT/'.artwork/source-review'
files=[p for p in BASE.rglob('*') if p.is_file() and '.obsidian' not in p.parts]
md=[p for p in files if p.suffix=='.md']; index={p.relative_to(ROOT).as_posix().lower():p for p in files}; byname=collections.defaultdict(list)
for p in files: byname[(p.stem if p.suffix=='.md' else p.name).lower()].append(p)
backup=ROOT/'.vault-backups'/('source-review-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.zip'); backup.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(backup,'w',zipfile.ZIP_DEFLATED) as z:
 for p in md: z.write(p,p.relative_to(ROOT))
counts=collections.Counter(); unresolved=[]
def resolve(target):
 t=target.replace('D&D 5e 2024 Rules/z. Load Bearing Folders/','== SRDs ==/z. Load Bearing Folders/').replace('D&D 5e 2024 Rules/','== SRDs ==/5.5e/')
 for key in (t.lower(),t.lower()+'.md'):
  if key in index:return index[key]
 if t.startswith('5.5e/') or t.startswith('z. Load Bearing Folders/'):
  for key in ('== srds ==/'+t.lower(),'== srds ==/'+t.lower()+'.md'):
   if key in index:return index[key]
 name=t.rsplit('/',1)[-1]; choices=byname.get(name.removesuffix('.md').lower(),[])
 if len(choices)==1:return choices[0]
 return None
for p in md:
 original=p.read_text(encoding='utf-8-sig')
 def fix(m):
  raw=m.group(1); parts=re.split(r'(?<!\\)\||\\\|',raw,maxsplit=1); path,sep,heading=parts[0].partition('#')
  if not path:return m.group(0)
  found=resolve(path)
  if not found:
   unresolved.append({'note':p.relative_to(ROOT).as_posix(),'target':path});return m.group(0)
  target=found.relative_to(ROOT).as_posix();target=target[:-3] if found.suffix=='.md' else target
  target+=sep+heading
  if len(parts)>1:target+=('\\|' if '\\|' in raw else '|')+parts[1]
  elif found.suffix=='.md':target+='|'+path.rsplit('/',1)[-1].removesuffix('.md')
  result='[['+target+']]'
  if result!=m.group(0):counts['links_repaired_or_qualified']+=1
  return result
 new=re.sub(r'\[\[([^\]\n]+)\]\]',fix,original)
 if new!=original:p.write_text(new,encoding='utf-8');counts['notes_changed']+=1
(WORK/'links-unresolved.json').write_text(json.dumps(unresolved,indent=2),encoding='utf-8')
(WORK/'links-results.json').write_text(json.dumps({'counts':dict(counts),'unresolved':len(unresolved),'backup':str(backup)},indent=2),encoding='utf-8')
print(dict(counts),'unresolved',len(unresolved),'backup',backup)
print(collections.Counter(r['target'] for r in unresolved).most_common(30))
