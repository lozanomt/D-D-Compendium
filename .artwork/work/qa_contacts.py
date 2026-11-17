import json
from pathlib import Path
from PIL import Image,ImageDraw
root=Path('C:/_Projects/DnD Campaigns');out=root/'D&D 5e 2024 Rules/z. Load Bearing Folders/Attachments/Artwork';rows=json.loads((out/'manifest.json').read_text(encoding='utf8'))['entries'];unique=list({r['file']:r for r in rows}.values())
for book in ['mm','phb','dmg']:
 subset=[r for r in unique if r['book']==book]
 for start in range(0,len(subset),48):
  sheet=Image.new('RGB',(1200,1120),'#eee8dc');d=ImageDraw.Draw(sheet)
  for k,row in enumerate(subset[start:start+48]):
   im=Image.open(root/row['file']);im.thumbnail((200,150));x=(k%6)*200;y=(k//6)*140;im.thumbnail((176,112));sheet.paste(im,(x+(200-im.width)//2,y),im);d.text((x+3,y+113),str(row['page'])+' '+row['name'][:26],fill='black')
  sheet.save(root/f'.artwork/work/{book}/final-{start//48+1}.jpg',quality=92)
print({book:len([r for r in unique if r['book']==book]) for book in ['mm','phb','dmg']})
