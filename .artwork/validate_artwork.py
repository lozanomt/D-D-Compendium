import json,hashlib
from pathlib import Path
from PIL import Image
import numpy as np
root=Path('C:/_Projects/DnD Campaigns');out=root/'D&D 5e 2024 Rules/z. Load Bearing Folders/Attachments/Artwork';rows=json.loads((out/'manifest.json').read_text(encoding='utf8'))['entries'];unique={r['file']:r for r in rows};issues=[]
assert len({r['path'] for r in rows})==len(rows)
for f,r in unique.items():
 p=root/f;im=Image.open(p)
 if im.size!=(1200,900) or im.mode!='RGBA':issues.append([f,'format'])
 if hashlib.sha256(p.read_bytes()).hexdigest()!=r['sha256']:issues.append([f,'hash'])
 a=np.array(im.getchannel('A'));x,y,w,h=r['content_rect']
 if a.min()!=0 or a.max()!=255:issues.append([f,'alpha range'])
 if np.any(a[y+h-1,x:x+w]>0):issues.append([f,'bottom not transparent'])
 if not r.get('exclude'):
  fade=round(h*.18)
  if not np.all(a[y:y+h-fade,x:x+w]==255):issues.append([f,'unexpected top or side fade'])
 if not Path(r['path']).exists():issues.append([f,'entry missing'])
print(json.dumps({'entries':len(rows),'images':len(unique),'issues':issues}))
if issues:raise SystemExit(1)
