import json
from pathlib import Path
from PIL import Image,ImageDraw
root=Path('C:/_Projects/DnD Campaigns');rows=json.loads((root/'D&D 5e 2024 Rules/z. Load Bearing Folders/Attachments/Artwork/manifest.json').read_text(encoding='utf8'))['entries'];names=['Oath of the Ancients','Diviner','Troll','Mammoth','Tyrannosaurus Rex','Chain Mail']
out=Image.new('RGB',(1200,660),'#eee8dc');d=ImageDraw.Draw(out)
for i,name in enumerate(names):
 r=next(r for r in rows if r['name']==name);im=Image.open(root/r['file']);im.thumbnail((400,300));x=i%3*400;y=i//3*330;out.paste(im,(x,y),im);d.text((x+10,y+303),name,fill='black')
out.save(root/'.artwork/work/verified-samples.jpg',quality=92)
