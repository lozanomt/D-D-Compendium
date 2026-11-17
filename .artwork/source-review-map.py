from pathlib import Path
import re,json,difflib,collections
W=Path('.artwork/source-review'); pages=json.loads((W/"Dungeon Master's Guide.json").read_text()); rows=json.loads((W/'inventory.json').read_text()); names=sorted(set(r['name'] for r in rows if r['book']=="Dungeon Master's Guide" and '/Magic Items/' in r['path']))
def norm(s):return re.sub('[^a-z0-9]','',s.lower().replace('1','l').replace('0','o'))
entries=[]
for pi,page in enumerate(pages):
 if not 228<=pi<=330:continue
 lines=page.splitlines()
 for i,line in enumerate(lines):
  if not re.match(r'^(Wondrous|Armor|Weapon|Potion|Ring|Rod|Scroll|Staff|Wand)\b',line,re.I):continue
  if not re.search(r'Common|Uncommon|Rare|Legendary|Artifact|Varies',line,re.I):continue
  opts=[]
  for n in (1,2,3):
   heading=' '.join(lines[max(0,i-n):i]);
   for name in names:
    score=difflib.SequenceMatcher(None,norm(heading),norm(name)).ratio();opts.append((score,name,n,heading))
  score,name,n,heading=max(opts)
  entries.append({'page':pi+1,'line':i-n,'meta_line':i,'name':name,'score':round(score,3),'heading':heading,'metadata':line})
(W/'dmg-candidates.json').write_text(json.dumps(entries,indent=2),encoding='utf-8')
stubs=[r for r in rows if r['stub']]; print('entries',len(entries),'stubs',len(stubs))
for r in stubs:
 hits=sorted([e for e in entries if e['name']==r['name']],key=lambda e:e['score'],reverse=True)
 if hits:print(r['name'],hits[0]['page'],hits[0]['score'],hits[0]['heading'])
 else:print('MISSING',r['name'])
