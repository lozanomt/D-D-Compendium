from pathlib import Path
from pypdf import PdfReader
import json,re,collections
ROOT=Path(r'C:\_Projects\DnD Campaigns'); BASE=ROOT/'== SRDs =='; WORK=ROOT/'.artwork/source-review'; WORK.mkdir(exist_ok=True)
for pdf in (BASE/'5.5e').rglob('*.pdf'):
 out=WORK/(pdf.parent.name+'.json')
 if not out.exists():
  reader=PdfReader(pdf); pages=[p.extract_text() for p in reader.pages]; out.write_text(json.dumps(pages),encoding='utf-8')
  print(pdf.parent.name,len(pages),flush=True)
rows=[]
for p in (BASE/'5.5e').rglob('*.md'):
 t=p.read_text(encoding='utf-8-sig'); stub= bool(re.search(r'(?m)^(Description|Text)\s*$|This information can be found|# Name\b',t))
 rows.append({'path':p.relative_to(ROOT).as_posix(),'name':p.stem,'book':p.relative_to(BASE/'5.5e').parts[0],'stub':stub})
(WORK/'inventory.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print('Stubs',collections.Counter(r['book'] for r in rows if r['stub']))
for r in rows:
 if r['stub'] and r['book']!="Dungeon Master's Guide": print(r['path'])
