from pathlib import Path
import json,re
R=Path('.');B=R/'== SRDs ==/5.5e';rows=list(__import__('csv').DictReader((R/'== SRDs ==/Audits/Source-Review-Unresolved-Links.csv').open(encoding='utf-8-sig')))
for row in rows:
 if row['target'] in ['Light','Slow']:
  p=R/row['note'];t=p.read_text(encoding='utf-8');print(p);print('\n'.join(x for x in t.splitlines() if '[['+row['target'] in x)[:2000])
print('remaining Artificer headers',[(p.stem,l) for p in (B/"Player's Handbook"/'Chapter 7 - Spells').rglob('*.md') for l in p.read_text(encoding='utf-8').splitlines() if l.startswith('*') and 'Artificer' in l])
print('duplicates',[(p.stem,str(p)) for p in B.rglob('*.md') if p.stem in ['Potion of Healing','Darkvision']])
