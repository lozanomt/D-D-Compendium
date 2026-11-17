from pathlib import Path
import re,json,difflib
W=Path('.artwork/source-review'); pages=json.loads((W/"Dungeon Master's Guide.json").read_text()); rows=json.loads((W/'inventory.json').read_text()); entries=[]
def norm(s):return re.sub('[^a-z0-9]','',s.lower())
for pi,page in enumerate(pages):
 if not 228<=pi<=330:continue
 lines=page.splitlines()
 for i,line in enumerate(lines):
  if not re.match(r'^(Wondrous|Wondrous|Armor|Weapon|Potion|Ring|Rod|Scroll|Staff|Wand)\b',line,re.I):continue
  if not re.search(r'Common|Uncommon|Rare|Legendary|Artifact|Varies',' '.join(lines[i:i+3]),re.I):continue
  entries.append({'page':pi+1,'line':i-1,'metadata':line,'heading':lines[i-1] if i else '', 'headings':[' '.join(lines[max(0,i-n):i]) for n in (1,2,3)]})
alias={'Apparatus of the Crab':'Apparatus of Kwalish','Instant Fortress':"Daern's Instant Fortress",'Handy Haversack':"Heward's Handy Haversack",'Efficient Quiver':'Quiver of Ehlonna','Marvelous Pigments':"Nolzur's Marvelous Pigments",'Energy Longbow':'Energy Bow','Energy Shortbow':'Energy Bow','Oathbow (Longbow)':'Oathbow','Oathbow (Shortbow)':'Oathbow','Dwarven Half Plate':'Dwarven Plate','Maul of Thunderbolts':'Hammer of Thunderbolts','Warhammer of Thunderbolts':'Hammer of Thunderbolts','Rodo f Rulership':'Rod of Rulership','Ring of Djinni Summonning':'Ring of Djinni Summoning','Half Plate Armor of Etherealness':'Plate Armor of Etherealness','Iron Bands':'Iron Bands of Bilarro','Mysterious Deck':'Deck of Many Things'}
matched=[]
for r in rows:
 if not r['stub'] or '/Magic Items/' not in r['path']:continue
 name=alias.get(r['name'],r['name']);name='Spell Scroll' if 'Spell Scroll' in name else name
 opts=[]
 for e in entries:
  score=max(difflib.SequenceMatcher(None,norm(name),norm(h)).ratio() for h in e['headings']);opts.append((score,e))
 best=sorted(opts,key=lambda x:x[0],reverse=True)[:3]
 matched.append(dict(r,candidates=[dict(e,score=round(s,3)) for s,e in best]))
(W/'dmg-matches.json').write_text(json.dumps(matched,indent=2),encoding='utf-8')
for r in matched:
 e=r['candidates'][0];print(r['name'],'=>',e['page'],e['heading'],e['score'])
