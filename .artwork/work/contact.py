import sys
from PIL import Image,ImageDraw
from pathlib import Path
p=Path('C:/_Projects/DnD Campaigns/.artwork/work')/sys.argv[1]
nums=[int(x) for x in sys.argv[2].split(',')]
for start in range(0,len(nums),12):
 sheet=Image.new('RGB',(960,1020),'#ddd')
 for k,n in enumerate(nums[start:start+12]):
  im=Image.open(p/f'page-{n:03}.jpg');im.thumbnail((240,320));sheet.paste(im,((k%4)*240,(k//4)*340));ImageDraw.Draw(sheet).text(((k%4)*240+4,(k//4)*340+320),str(n),fill='black')
 sheet.save(p/f'{sys.argv[3]}-{start//12+1}.jpg',quality=94)
