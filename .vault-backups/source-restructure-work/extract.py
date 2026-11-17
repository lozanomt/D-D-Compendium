import json,sys
from pypdf import PdfReader
from pathlib import Path
root=Path(sys.argv[1]); out=Path(sys.argv[2])
for p in root.glob('*.pdf'):
 r=PdfReader(p); pages=[x.extract_text() or '' for x in r.pages]
 (out/(p.stem+'.json')).write_text(json.dumps(pages),encoding='utf-8')
 print(p.name,len(pages),flush=True)
